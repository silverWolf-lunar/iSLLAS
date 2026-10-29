import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Observability')
@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  getMetrics(): string {
    const mem = process.memoryUsage();
    const uptime = process.uptime();

    return [
      '# HELP process_uptime_seconds The process uptime in seconds.',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime}`,
      '# HELP nodejs_heap_size_total_bytes Process heap total size.',
      '# TYPE nodejs_heap_size_total_bytes gauge',
      `nodejs_heap_size_total_bytes ${mem.heapTotal}`,
      '# HELP nodejs_heap_size_used_bytes Process heap used size.',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${mem.heapUsed}`,
      '# HELP nodejs_resident_memory_bytes Process resident memory size.',
      '# TYPE nodejs_resident_memory_bytes gauge',
      `nodejs_resident_memory_bytes ${mem.rss}`,
      '# HELP sllas_system_info System status and build metadata.',
      '# TYPE sllas_system_info gauge',
      'sllas_system_info{version="0.1.0",status="operational"} 1',
    ].join('\n');
  }
}
