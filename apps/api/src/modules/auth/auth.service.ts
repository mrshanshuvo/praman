import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthConfig } from '../../core/config/env.config.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private generateTokens(userId: string, email: string) {
    const auth = this.configService.get<AuthConfig>('auth');
    const accessSecret = auth?.jwtSecret || 'praman-dev-secret-super-secure-key-change-in-prod';
    const accessExpiresIn = (auth?.jwtExpiresIn || '15m') as any;
    const refreshSecret =
      auth?.jwtRefreshSecret || 'praman-refresh-secret-super-secure-key-change-in-prod';
    const refreshExpiresIn = (auth?.jwtRefreshExpiresIn || '7d') as any;

    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string | null) {
    let hash: string | null = null;
    if (refreshToken) {
      const salt = await bcrypt.genSalt(10);
      hash = await bcrypt.hash(refreshToken, salt);
    }

    await this.prisma.client.orm.public.User.where({ id: userId }).update({
      refreshTokenHash: hash,
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.client.orm.public.User.where({
      email: dto.email.toLowerCase().trim(),
    }).first();

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.client.orm.public.User.create({
      email: dto.email.toLowerCase().trim(),
      name: dto.name || null,
      passwordHash,
    });

    const tokens = this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.client.orm.public.User.where({
      email: dto.email.toLowerCase().trim(),
    }).first();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account was created without a password. Please contact support or reset password.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const auth = this.configService.get<AuthConfig>('auth');
    const refreshSecret =
      auth?.jwtRefreshSecret || 'praman-refresh-secret-super-secure-key-change-in-prod';

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.client.orm.public.User.where({
      id: payload.sub,
    }).first();

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Access denied: Session has been revoked');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      // Possible token reuse attack: invalidate session immediately
      await this.updateRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Access denied: Token reuse detected');
    }

    // Token rotation: Issue brand new access token and refresh token
    const tokens = this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.client.orm.public.User.where({
      id: userId,
    }).first();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async logout(userId: string) {
    await this.updateRefreshTokenHash(userId, null);
    return {
      message: 'Successfully logged out',
      userId,
    };
  }
}
