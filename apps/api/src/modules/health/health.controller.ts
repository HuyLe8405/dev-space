import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthStatus } from '@devspace/contracts';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'DevSpace API health check' })
  @ApiOkResponse({
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'devspace-api' },
      },
    },
  })
  checkHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'devspace-api',
    };
  }
}
