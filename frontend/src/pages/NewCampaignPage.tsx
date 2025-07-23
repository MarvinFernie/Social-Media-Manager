import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Stack,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { LinkedIn, Twitter, ArrowBack, Create } from '@mui/icons-material';
import { campaignService } from '../services/campaign.service';

const NewCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'twitter']);
  
  const createMutation = useMutation({
    mutationFn: campaignService.createCampaign,
    onSuccess: async (campaign) => {
      // Generate content for selected platforms
      if (selectedPlatforms.length > 0) {
        await generateMutation.mutateAsync({
          campaignId: campaign.id,
          platforms: selectedPlatforms as Array<'linkedin' | 'twitter'>,
        });
      }
      navigate(`/campaigns/${campaign.id}`);
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ campaignId, platforms }: { campaignId: string; platforms: Array<'linkedin' | 'twitter'> }) =>
      campaignService.generateContent(campaignId, { platforms }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      originalContent: content.trim(),
    });
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const isLoading = createMutation.isPending || generateMutation.isPending;

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        Create New Campaign
      </Typography>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <TextField
                label="Campaign Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />

              <TextField
                label="Original Content"
                fullWidth
                multiline
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isLoading}
                helperText="Enter your original content. AI will adapt it for each platform."
              />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Select Platforms
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPlatforms.includes('linkedin')}
                        onChange={() => togglePlatform('linkedin')}
                        disabled={isLoading}
                      />
                    }
                    label={
                      <Chip
                        icon={<LinkedIn />}
                        label="LinkedIn"
                        variant={selectedPlatforms.includes('linkedin') ? 'filled' : 'outlined'}
                        color={selectedPlatforms.includes('linkedin') ? 'primary' : 'default'}
                      />
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPlatforms.includes('twitter')}
                        onChange={() => togglePlatform('twitter')}
                        disabled={isLoading}
                      />
                    }
                    label={
                      <Chip
                        icon={<Twitter />}
                        label="Twitter"
                        variant={selectedPlatforms.includes('twitter') ? 'filled' : 'outlined'}
                        color={selectedPlatforms.includes('twitter') ? 'primary' : 'default'}
                      />
                    }
                  />
                </FormGroup>
              </Box>

              {(createMutation.isError || generateMutation.isError) && (
                <Alert severity="error">
                  Failed to create campaign. Please try again.
                </Alert>
              )}

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Create />}
                  disabled={isLoading || !title.trim() || !content.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create & Generate'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
};

export default NewCampaignPage;

