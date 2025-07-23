import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { linkPreviewService } from '../services/linkPreview.service';
import { storageService } from '../services/storage.service';
import fs from 'fs/promises';

class ContentController {
  async previewLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;

      if (!url) {
        throw new AppError('URL is required', 400);
      }

      const preview = await linkPreviewService.getPreview(url);

      res.json({
        status: 'success',
        data: { preview }
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const uploadedFiles = [];

      for (const file of files) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
        if (!allowedTypes.includes(file.mimetype)) {
          await fs.unlink(file.path); // Clean up
          throw new AppError(`Invalid file type: ${file.mimetype}`, 400);
        }

        // Validate file size (10MB for images, 100MB for videos)
        const maxSize = file.mimetype.startsWith('video') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          await fs.unlink(file.path); // Clean up
          throw new AppError(`File ${file.originalname} is too large`, 400);
        }

        // Upload to storage
        const uploadedFile = await storageService.uploadFile(file, req.user!.id);
        uploadedFiles.push(uploadedFile);

        // Clean up local file
        await fs.unlink(file.path);
      }

      res.json({
        status: 'success',
        data: { files: uploadedFiles }
      });
    } catch (error) {
      // Clean up any remaining files
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
      next(error);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user!;

      await storageService.deleteFile(id, user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const contentController = new ContentController();
