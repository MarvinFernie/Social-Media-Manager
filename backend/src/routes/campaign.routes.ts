import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Campaign CRUD
router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaign);
router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Campaign actions
router.post('/:id/generate', campaignController.generatePlatformContent);
router.post('/:id/refine', campaignController.refineContent);
router.post('/:id/publish', campaignController.publishCampaign);
router.post('/:id/publish/:platform', campaignController.publishToPlatform);

export default router;
