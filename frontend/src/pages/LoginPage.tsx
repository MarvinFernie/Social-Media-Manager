import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
import { Google, LinkedIn, Twitter } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Social Media Manager
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" paragraph>
              Create once, publish everywhere. AI-powered content adaptation for multiple platforms.
            </Typography>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Sign in with
              </Typography>
            </Divider>

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Google />}
                onClick={() => login('google')}
                sx={{
                  textTransform: 'none',
                  borderColor: '#4285f4',
                  color: '#4285f4',
                  '&:hover': {
                    borderColor: '#357ae8',
                    backgroundColor: 'rgba(66, 133, 244, 0.04)',
                  },
                }}
              >
                Continue with Google
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<LinkedIn />}
                onClick={() => login('linkedin')}
                sx={{
                  textTransform: 'none',
                  borderColor: '#0077b5',
                  color: '#0077b5',
                  '&:hover': {
                    borderColor: '#006399',
                    backgroundColor: 'rgba(0, 119, 181, 0.04)',
                  },
                }}
              >
                Continue with LinkedIn
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<Twitter />}
                onClick={() => login('twitter')}
                sx={{
                  textTransform: 'none',
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  '&:hover': {
                    borderColor: '#1a91da',
                    backgroundColor: 'rgba(29, 161, 242, 0.04)',
                  },
                }}
              >
                Continue with X (Twitter)
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;


