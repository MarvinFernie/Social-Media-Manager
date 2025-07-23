import { Router } from 'express';
import { platformController } from '../controllers/platform.controller';
import { oauthController } from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// OAuth callback routes (no auth required)
router.get('/callback/linkedin', oauthController.handleLinkedInCallback);
router.get('/callback/twitter', oauthController.handleTwitterCallback);

// All routes below require authentication
router.use(authenticate);

// Platform account management
router.get('/accounts', platformController.getConnectedAccounts);
router.post('/connect/:platform', platformController.connectPlatform);
router.delete('/disconnect/:platform', platformController.disconnectPlatform);
router.post('/refresh/:platform', platformController.refreshToken);

// Platform specific endpoints
router.get('/:platform/profile', platformController.getPlatformProfile);
router.get('/:platform/limits', platformController.getPlatformLimits);

export default router;

