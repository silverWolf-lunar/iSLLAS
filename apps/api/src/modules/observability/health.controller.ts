import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Observability')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe' })
  async readiness(@Res() res: Response) {
    try {
      const isDbConnected = this.dataSource.isInitialized;
      if (!isDbConnected) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'DOWN',
          database: 'DISCONNECTED',
        });
      }

      // Quick ping query
      await this.dataSource.query('SELECT 1');

      return res.status(HttpStatus.OK).json({
        status: 'UP',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'DOWN',
        database: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
