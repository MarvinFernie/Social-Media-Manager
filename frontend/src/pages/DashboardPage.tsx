import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { Add, LinkedIn, Twitter } from '@mui/icons-material';
import { campaignService } from '../services/campaign.service';
import { formatDistanceToNow } from 'date-fns';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: campaigns, isPending: isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignService.getCampaigns,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <LinkedIn fontSize="small" />;
      case 'twitter':
        return <Twitter fontSize="small" />;
      default:
        return <Add fontSize="small" />;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load campaigns. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Your Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/campaigns/new')}
        >
          New Campaign
        </Button>
      </Box>

      {campaigns?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No campaigns yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first campaign to start publishing content across multiple platforms.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/campaigns/new')}
            >
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {campaigns?.map((campaign) => (
            <Grid item xs={12} md={6} lg={4} key={campaign.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {campaign.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2,
                    }}
                  >
                    {campaign.originalContent}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={campaign.status}
                      color={getStatusColor(campaign.status)}
                      size="small"
                    />
                    {campaign.platformContents?.map((pc) => (
                      <Chip
                        key={pc.id}
                        icon={getPlatformIcon(pc.platform)}
                        label={pc.platform}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                  
                  <Typography variant="caption" color="text.secondary">
                    Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;






