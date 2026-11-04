import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import type { AuthResponse, UserSummary, MessageResponse } from '@devspace/contracts';

@Controller('auth')
export class AuthController {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 900 * 1000, // 15 mins
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const bundle = await this.authService.register(
      dto.email,
      dto.password,
      dto.displayName,
      userAgent,
      ipAddress,
    );

    this.setAuthCookies(res, bundle.accessToken, bundle.refreshToken);

    return {
      user: bundle.user,
      expiresIn: bundle.expiresIn,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const bundle = await this.authService.login(
      dto.email,
      dto.password,
      userAgent,
      ipAddress,
    );

    this.setAuthCookies(res, bundle.accessToken, bundle.refreshToken);

    return {
      user: bundle.user,
      expiresIn: bundle.expiresIn,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const bundle = await this.authService.refreshSession(
      refreshToken,
      userAgent,
      ipAddress,
    );

    this.setAuthCookies(res, bundle.accessToken, bundle.refreshToken);

    return {
      user: bundle.user,
      expiresIn: bundle.expiresIn,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponse> {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      try {
        const payload: any = JSON.parse(
          Buffer.from(refreshToken.split('.')[1], 'base64').toString('utf8'),
        );
        if (payload?.sessionId) {
          await this.authService.logout(payload.sessionId);
        }
      } catch {
        // Continue clearing cookies even if token decode fails
      }
    }

    this.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: CurrentUserPayload): Promise<UserSummary> {
    const userRecord = await this.usersService.findById(user.id);
    if (!userRecord) {
      throw new UnauthorizedException('User no longer exists');
    }
    return {
      id: userRecord.id,
      email: userRecord.email,
      displayName: userRecord.profile?.displayName || userRecord.email.split('@')[0],
      createdAt: userRecord.createdAt.toISOString(),
    };
  }
}
