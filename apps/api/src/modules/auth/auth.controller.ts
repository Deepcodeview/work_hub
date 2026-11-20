import { Controller, Post, Get, Body, Req, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '@workhub/contracts';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: any
  ): Promise<ApiResponse<any>> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const result = await this.authService.login(body.email, body.password, { userAgent, ipAddress });
    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser('id') userId: string,
    @Headers('authorization') authHeader: string
  ): Promise<ApiResponse<any>> {
    const token = authHeader?.replace('Bearer ', '');
    await this.authService.logout(userId, token);
    return {
      success: true,
      data: { message: 'Logged out successfully' },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<ApiResponse<AuthenticatedUser>> {
    return {
      success: true,
      data: user,
    };
  }
}
