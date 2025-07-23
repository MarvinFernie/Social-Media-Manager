import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  authController.handleOAuthCallback
);

router.get('/linkedin', passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] }));
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  authController.handleOAuthCallback
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Update LLM configuration
router.put('/llm-config', authenticate, authController.updateLLMConfig);

// Revoke LLM configuration
router.delete('/llm-config', authenticate, authController.revokeLLMConfig);

// Logout
router.post('/logout', authenticate, authController.logout);

export default router;

