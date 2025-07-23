import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    const fileId = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${userId}-${fileId}${extension}`;
    const destination = path.join(this.uploadDir, filename);

    // Move file from temp location to permanent location
    await fs.rename(file.path, destination);

    return {
      id: fileId,
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${filename}` // In production, this would be a CDN URL
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Find file with matching ID and user ID
    const files = await fs.readdir(this.uploadDir);
    const fileToDelete = files.find(f => f.includes(userId) && f.includes(fileId));

    if (fileToDelete) {
      await fs.unlink(path.join(this.uploadDir, fileToDelete));
    } else {
      throw new Error('File not found');
    }
  }

  async getFile(filename: string): Promise<Buffer> {
    const filepath = path.join(this.uploadDir, filename);
    return await fs.readFile(filepath);
  }
}

export const storageService = new StorageService();
