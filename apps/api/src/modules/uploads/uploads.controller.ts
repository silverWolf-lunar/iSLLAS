import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { Public } from '../../common/decorators/public.decorator';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload file (base64 encoded document or image)' })
  async upload(
    @Body() body: { fileName: string; mimeType: string; base64Data: string },
  ) {
    return this.uploadsService.saveBase64File(
      body.fileName || 'document.png',
      body.mimeType || 'image/png',
      body.base64Data,
    );
  }

  @Get('files/:name')
  @Public()
  @ApiOperation({ summary: 'Download or view uploaded file' })
  getFile(@Param('name') name: string, @Res() res: Response) {
    const filePath = this.uploadsService.getFilePath(name);
    res.sendFile(filePath);
  }
}
