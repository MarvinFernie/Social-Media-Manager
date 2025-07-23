import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  TextField,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  LinkedIn,
  Twitter,
  Send,
  Check,
  Refresh,
} from '@mui/icons-material';
import { campaignService } from '../services/campaign.service';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const CampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, number>>({});
  const [refinementPrompts, setRefinementPrompts] = useState<Record<string, string>>({});

  const { data: campaign, isPending: isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignService.getCampaign(id!),
    enabled: !!id,
  });

  const refineMutation = useMutation({
    mutationFn: (data: { platformContentId: string; prompt: string; selectedVariationIndex?: number }) =>
      campaignService.refineContent(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => campaignService.publishCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  const publishToPlatformMutation = useMutation({
    mutationFn: (platform: string) => campaignService.publishToPlatform(id!, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !campaign) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load campaign. Please try again.
      </Alert>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <LinkedIn />;
      case 'twitter':
        return <Twitter />;
      default:
        return <Send />;
    }
  };

  const handleSelectVariation = (platformContentId: string, index: number) => {
    setSelectedVariations({ ...selectedVariations, [platformContentId]: index });
  };

  const handleRefine = (platformContentId: string) => {
    const prompt = refinementPrompts[platformContentId];
    if (!prompt?.trim()) return;

    refineMutation.mutate({
      platformContentId,
      prompt: prompt.trim(),
      selectedVariationIndex: selectedVariations[platformContentId],
    });
    setRefinementPrompts({ ...refinementPrompts, [platformContentId]: '' });
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {campaign.title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending || !campaign.platformContents?.length}
        >
          Publish All
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Original Content */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Original Content
              </Typography>
              <Typography variant="body2" whiteSpace="pre-wrap">
                {campaign.originalContent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Platform Content */}
        <Grid item xs={12} md={8}>
          {campaign.platformContents && campaign.platformContents.length > 0 ? (
            <Card>
              <CardContent>
                <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
                  {campaign.platformContents.map((pc, index) => (
                    <Tab
                      key={pc.id}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          {getPlatformIcon(pc.platform)}
                          {pc.platform}
                          {pc.status === 'posted' && <Check fontSize="small" color="success" />}
                        </Box>
                      }
                    />
                  ))}
                </Tabs>

                {campaign.platformContents.map((pc, index) => (
                  <TabPanel key={pc.id} value={selectedTab} index={index}>
                    <Stack spacing={3}>
                      {/* Variations */}
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Generated Variations
                        </Typography>
                        <Stack spacing={2}>
                          {pc.variations.map((variation, vIndex) => (
                            <Paper
                              key={vIndex}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                border: 2,
                                borderColor:
                                  selectedVariations[pc.id] === vIndex
                                    ? 'primary.main'
                                    : 'transparent',
                              }}
                              onClick={() => handleSelectVariation(pc.id, vIndex)}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="start">
                                <Box flex={1}>
                                  <Chip label={variation.tone} size="small" sx={{ mb: 1 }} />
                                  <Typography variant="body2" whiteSpace="pre-wrap">
                                    {variation.content}
                                  </Typography>
                                </Box>
                                {selectedVariations[pc.id] === vIndex && (
                                  <Check color="primary" />
                                )}
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Refinement */}
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Refine Content
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="e.g., Make it more professional, Add a call-to-action..."
                            value={refinementPrompts[pc.id] || ''}
                            onChange={(e) =>
                              setRefinementPrompts({
                                ...refinementPrompts,
                                [pc.id]: e.target.value,
                              })
                            }
                            disabled={refineMutation.isPending}
                          />
                          <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => handleRefine(pc.id)}
                            disabled={
                              refineMutation.isPending || !refinementPrompts[pc.id]?.trim()
                            }
                          >
                            Refine
                          </Button>
                        </Stack>
                      </Box>

                      {/* Final Content */}
                      {pc.selectedContent && (
                        <>
                          <Divider />
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              Final Content
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                              <Typography variant="body2" whiteSpace="pre-wrap">
                                {pc.finalContent || pc.selectedContent}
                              </Typography>
                            </Paper>
                          </Box>
                        </>
                      )}

                      {/* Publish Button */}
                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          startIcon={getPlatformIcon(pc.platform)}
                          onClick={() => publishToPlatformMutation.mutate(pc.platform)}
                          disabled={
                            publishToPlatformMutation.isPending || pc.status === 'posted'
                          }
                        >
                          {pc.status === 'posted' ? 'Published' : `Publish to ${pc.platform}`}
                        </Button>
                      </Box>

                      {pc.postUrl && (
                        <Alert severity="success">
                          Successfully published!{' '}
                          <a href={pc.postUrl} target="_blank" rel="noopener noreferrer">
                            View post
                          </a>
                        </Alert>
                      )}
                    </Stack>
                  </TabPanel>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              No platform content generated yet. Generate content from the dashboard.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CampaignPage;

















