import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(authenticate);

// Content operations
router.post('/preview-link', contentController.previewLink);
router.post('/upload-media', upload.array('files', 10), contentController.uploadMedia);
router.delete('/media/:id', contentController.deleteMedia);

export default router;
