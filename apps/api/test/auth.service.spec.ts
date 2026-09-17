import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../src/core/database/prisma.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockPrisma = {
      client: {
        orm: {
          public: {
            User: {
              where: vi.fn(),
              create: vi.fn(),
            },
          },
        },
      },
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register a new user and return token', async () => {
    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    });

    mockPrisma.client.orm.public.User.create.mockResolvedValue({
      id: 'u-1',
      email: 'test@praman.dev',
      name: 'Test User',
      passwordHash: 'hashed',
    });

    const result = await service.register({
      email: 'test@praman.dev',
      password: 'password123',
      name: 'Test User',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('test@praman.dev');
    expect(result.user.id).toBe('u-1');
  });

  it('should reject registration if email is already taken', async () => {
    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 'u-exists' }),
    });

    await expect(
      service.register({
        email: 'taken@praman.dev',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should authenticate user with valid credentials', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secretPass', salt);

    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({
        id: 'u-login',
        email: 'login@praman.dev',
        name: 'Login User',
        passwordHash: hash,
      }),
    });

    const result = await service.login({
      email: 'login@praman.dev',
      password: 'secretPass',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.id).toBe('u-login');
  });

  it('should throw UnauthorizedException on invalid password', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('actualPassword', salt);

    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({
        id: 'u-login',
        email: 'login@praman.dev',
        passwordHash: hash,
      }),
    });

    await expect(
      service.login({
        email: 'login@praman.dev',
        password: 'wrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should logout user and return confirmation message', async () => {
    const result = await service.logout('u-login');
    expect(result).toEqual({
      message: 'Successfully logged out',
      userId: 'u-login',
    });
  });
});
