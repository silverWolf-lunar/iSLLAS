import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveBase64File(
    fileName: string,
    mimeType: string,
    base64Data: string,
  ): Promise<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string; status: string }> {
    const cleanBase64 = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeExt = path.extname(fileName) || (mimeType.includes('pdf') ? '.pdf' : '.png');
    const uniqueId = crypto.randomUUID();
    const storedName = `${uniqueId}${safeExt}`;
    const filePath = path.join(this.uploadDir, storedName);

    await fs.promises.writeFile(filePath, buffer);

    return {
      fileUrl: `/api/backend/api/v1/uploads/files/${storedName}`,
      fileName,
      fileSizeBytes: buffer.length,
      mimeType,
      status: 'CLEAN',
    };
  }

  getFilePath(storedName: string): string {
    const safeName = path.basename(storedName);
    const filePath = path.join(this.uploadDir, safeName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File ${safeName} not found`);
    }
    return filePath;
  }
}
