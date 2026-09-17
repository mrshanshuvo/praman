import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: token,
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

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: token,
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
    return {
      message: 'Successfully logged out',
      userId,
    };
  }
}
