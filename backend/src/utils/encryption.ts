import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const pbkdf2Iterations = 100000;
const pbkdf2KeyLength = 32;

export class EncryptionService {
  private masterKey: string;

  constructor() {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    this.masterKey = process.env.ENCRYPTION_KEY;
  }

  encrypt(text: string): string {
    const salt = crypto.randomBytes(saltLength);
    const iv = crypto.randomBytes(ivLength);
    
    const key = crypto.pbkdf2Sync(this.masterKey, salt, pbkdf2Iterations, pbkdf2KeyLength, 'sha256');
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  decrypt(encryptedData: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const salt = buffer.slice(0, saltLength);
    const iv = buffer.slice(saltLength, saltLength + ivLength);
    const tag = buffer.slice(saltLength + ivLength, saltLength + ivLength + tagLength);
    const encrypted = buffer.slice(saltLength + ivLength + tagLength);
    
    const key = crypto.pbkdf2Sync(this.masterKey, salt, pbkdf2Iterations, pbkdf2KeyLength, 'sha256');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }
}

export const encryptionService = new EncryptionService();
