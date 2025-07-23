import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { authService } from '../services/auth.service';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    authService.handleOAuthCallback();
    // If no token in URL, redirect to login
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('token')) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Typography variant="body1">Completing sign in...</Typography>
    </Box>
  );
};

export default OAuthCallbackPage;
