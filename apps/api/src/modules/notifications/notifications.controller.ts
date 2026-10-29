import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationPreference, UserProfile } from '@sllas/contracts';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@ApiCookieAuth('sllas_session')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get the current user notification preferences' })
  async getPreferences(@CurrentUser() user: UserProfile) {
    return this.notificationsService.listPreferences(user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences for the current user' })
  async upsertPreferences(
    @CurrentUser() user: UserProfile,
    @Body() preferences: NotificationPreference[],
  ) {
    return this.notificationsService.upsertPreferences(user.id, preferences);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List active notification templates' })
  async listTemplates() {
    return this.notificationsService.listTemplates();
  }

  @Get() 
  @ApiOperation({ summary: 'List recent notifications for the current user' })
  async listForUser(@CurrentUser() user: UserProfile) {
    return this.notificationsService.listForUser(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@CurrentUser() user: UserProfile, @Param('id') id: string) {
    return this.notificationsService.markNotificationRead(id, user.id);
  }
}
