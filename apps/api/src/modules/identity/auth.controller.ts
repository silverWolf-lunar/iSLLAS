import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserProfile, Role } from '@sllas/contracts';
import { SYSTEM_CONFIG } from '@sllas/config';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile and permissions' })
  @SwaggerResponse({ status: 200, description: 'Current user profile' })
  async getMe(@CurrentUser() user: UserProfile): Promise<UserProfile> {
    return this.authService.getProfile(user.id);
  }

  @Post('dev-login')
  @Public()
  @ApiOperation({ summary: 'Development login / token generation' })
  async devLogin(
    @Body() body: { role?: Role; email?: string; provinceId?: string; districtId?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const role = body.role || Role.SYSTEM_ADMIN;
    const result = await this.authService.devLogin(role, body.email, body.provinceId, body.districtId);

    // Set secure HTTP-only cookie
    res.cookie(SYSTEM_CONFIG.AUTH.COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SYSTEM_CONFIG.AUTH.REFRESH_TOKEN_TTL_SECONDS * 1000,
    });

    return {
      token: result.token,
      user: result.user,
    };
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'Clear session cookies and log out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SYSTEM_CONFIG.AUTH.COOKIE_NAME);
    return { success: true, message: 'Logged out successfully' };
  }
}
