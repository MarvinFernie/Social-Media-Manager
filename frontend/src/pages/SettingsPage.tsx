import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  LinkedIn,
  Twitter,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Settings,
  Link,
  LinkOff,
  Delete,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LLMConfig } from '../services/auth.service';
import { platformService } from '../services/platform.service';

interface SocialAccount {
  id: string;
  platform: 'linkedin' | 'twitter';
  username: string;
  isActive: boolean;
  needsReconnection: boolean;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [llmProvider, setLlmProvider] = useState<string>('');
  const [llmModel, setLlmModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check for OAuth callback notifications
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error) {
      const messages: Record<string, string> = {
        linkedin_auth_failed: 'Failed to connect LinkedIn account',
        twitter_auth_failed: 'Failed to connect Twitter/X account',
      };
      setNotification({ type: 'error', message: messages[error] || 'Authentication failed' });
    }

    if (success) {
      const messages: Record<string, string> = {
        linkedin_connected: 'LinkedIn account connected successfully',
        twitter_connected: 'Twitter/X account connected successfully',
      };
      setNotification({ type: 'success', message: messages[success] || 'Account connected successfully' });
    }
  }, [searchParams]);

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
  });

  // Fetch connected accounts
  const { data: accounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: platformService.getConnectedAccounts,
  });

  // Update LLM config mutation
  const updateLLMMutation = useMutation({
    mutationFn: (data: { provider: string; model: string; apiKey: string }) =>
      authService.updateLLMConfig(data as LLMConfig),
    onSuccess: () => {
      setNotification({ type: 'success', message: 'LLM configuration updated successfully' });
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update LLM configuration',
      });
    },
  });

  // Revoke LLM config mutation
  const revokeLLMMutation = useMutation({
    mutationFn: authService.revokeLLMConfig,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'LLM configuration revoked successfully' });
      setLlmProvider('');
      setLlmModel('');
      setApiKey('');
      setShowRevokeDialog(false);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to revoke LLM configuration',
      });
      setShowRevokeDialog(false);
    },
  });

  // Connect platform mutation
  const connectPlatformMutation = useMutation({
    mutationFn: platformService.connectPlatform,
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to initiate connection',
      });
    },
  });

  // Disconnect platform mutation
  const disconnectPlatformMutation = useMutation({
    mutationFn: platformService.disconnectPlatform,
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Account disconnected successfully' });
      refetchAccounts();
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to disconnect account',
      });
    },
  });

  // Set initial LLM config from user data
  useEffect(() => {
    if (userData) {
      setLlmProvider(userData.llmProvider || '');
      setLlmModel(userData.llmModel || '');
    }
  }, [userData]);

  const handleLLMSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!llmProvider || !apiKey) {
      setNotification({ type: 'error', message: 'Please select a provider and enter an API key' });
      return;
    }
    updateLLMMutation.mutate({ provider: llmProvider, model: llmModel, apiKey });
  };

  const getDefaultModel = (provider: string): string => {
    const defaults: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-opus-20240229',
      gemini: 'gemini-pro',
    };
    return defaults[provider] || '';
  };

  const handleProviderChange = (provider: string) => {
    setLlmProvider(provider);
    setLlmModel(getDefaultModel(provider));
  };

  const getConnectedAccount = (platform: string): SocialAccount | undefined => {
    return accounts?.find((acc: SocialAccount) => acc.platform === platform);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings /> Settings
      </Typography>

      {notification && (
        <Alert severity={notification.type} onClose={() => setNotification(null)} sx={{ mb: 3 }}>
          {notification.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* LLM Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                LLM Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your AI provider for content generation
              </Typography>

              <form onSubmit={handleLLMSubmit}>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={llmProvider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      label="Provider"
                    >
                      <MenuItem value="openai">OpenAI</MenuItem>
                      <MenuItem value="anthropic">Anthropic</MenuItem>
                      <MenuItem value="gemini">Google Gemini</MenuItem>
                    </Select>
                  </FormControl>

                  {llmProvider && (
                    <TextField
                      label="Model"
                      fullWidth
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      helperText="You can specify a custom model or use the default"
                    />
                  )}

                  <TextField
                    label="API Key"
                    fullWidth
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText={userData?.hasApiKey ? 'Enter a new key to update' : 'Your API key will be encrypted'}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      {userData?.hasApiKey && (
                        <Chip
                          icon={<CheckCircle />}
                          label="API Key Configured"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {userData?.hasApiKey && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => setShowRevokeDialog(true)}
                          disabled={revokeLLMMutation.isPending}
                        >
                          Revoke
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={updateLLMMutation.isPending}
                      >
                        {updateLLMMutation.isPending ? <CircularProgress size={24} /> : 'Save Configuration'}
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Social Media Integrations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Media Integrations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect your social media accounts to publish content
              </Typography>

              <Stack spacing={2}>
                {/* LinkedIn */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinkedIn sx={{ fontSize: 40, color: '#0077B5' }} />
                      <Box>
                        <Typography variant="subtitle1">LinkedIn</Typography>
                        {(() => {
                          const account = getConnectedAccount('linkedin');
                          if (account) {
                            return (
                              <Typography variant="body2" color="text.secondary">
                                Connected as @{account.username}
                              </Typography>
                            );
                          }
                          return (
                            <Typography variant="body2" color="text.secondary">
                              Not connected
                            </Typography>
                          );
                        })()}
                      </Box>
                    </Box>
                    {(() => {
                      const account = getConnectedAccount('linkedin');
                      if (account) {
                        return (
                          <Stack direction="row" spacing={1}>
                            {account.needsReconnection && (
                              <Chip label="Needs Reconnection" color="warning" size="small" />
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<LinkOff />}
                              onClick={() => disconnectPlatformMutation.mutate('linkedin')}
                              disabled={disconnectPlatformMutation.isPending}
                            >
                              Disconnect
                            </Button>
                          </Stack>
                        );
                      }
                      return (
                        <Button
                          variant="contained"
                          startIcon={<Link />}
                          onClick={() => connectPlatformMutation.mutate('linkedin')}
                          disabled={connectPlatformMutation.isPending}
                        >
                          Connect
                        </Button>
                      );
                    })()}
                  </Box>
                </Paper>

                {/* Twitter/X */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Twitter sx={{ fontSize: 40, color: '#1DA1F2' }} />
                      <Box>
                        <Typography variant="subtitle1">X (Twitter)</Typography>
                        {(() => {
                          const account = getConnectedAccount('twitter');
                          if (account) {
                            return (
                              <Typography variant="body2" color="text.secondary">
                                Connected as @{account.username}
                              </Typography>
                            );
                          }
                          return (
                            <Typography variant="body2" color="text.secondary">
                              Not connected
                            </Typography>
                          );
                        })()}
                      </Box>
                    </Box>
                    {(() => {
                      const account = getConnectedAccount('twitter');
                      if (account) {
                        return (
                          <Stack direction="row" spacing={1}>
                            {account.needsReconnection && (
                              <Chip label="Needs Reconnection" color="warning" size="small" />
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<LinkOff />}
                              onClick={() => disconnectPlatformMutation.mutate('twitter')}
                              disabled={disconnectPlatformMutation.isPending}
                            >
                              Disconnect
                            </Button>
                          </Stack>
                        );
                      }
                      return (
                        <Button
                          variant="contained"
                          startIcon={<Link />}
                          onClick={() => connectPlatformMutation.mutate('twitter')}
                          disabled={connectPlatformMutation.isPending}
                        >
                          Connect
                        </Button>
                      );
                    })()}
                  </Box>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revoke LLM Config Confirmation Dialog */}
      <Dialog
        open={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        aria-labelledby="revoke-dialog-title"
        aria-describedby="revoke-dialog-description"
      >
        <DialogTitle id="revoke-dialog-title">
          Revoke LLM Configuration?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="revoke-dialog-description">
            Are you sure you want to revoke your LLM API key? This will remove your AI provider configuration 
            and you won't be able to generate content until you configure it again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRevokeDialog(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => revokeLLMMutation.mutate()} 
            color="error" 
            variant="contained"
            disabled={revokeLLMMutation.isPending}
            startIcon={revokeLLMMutation.isPending ? <CircularProgress size={20} /> : <Delete />}
          >
            {revokeLLMMutation.isPending ? 'Revoking...' : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;












