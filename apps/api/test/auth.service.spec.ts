import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  let mockConfigService: any;

  beforeEach(async () => {
    mockPrisma = {
      client: {
        orm: {
          public: {
            User: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null),
                update: vi.fn().mockResolvedValue({}),
              }),
              create: vi.fn(),
            },
          },
        },
      },
    };

    mockJwtService = {
      sign: vi.fn().mockImplementation((_payload, opts) => {
        if (opts?.secret === 'test-refresh-secret') {
          return 'mock-refresh-token';
        }
        return 'mock-access-token';
      }),
      verify: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'auth') {
          return {
            jwtSecret: 'test-access-secret',
            jwtExpiresIn: '15m',
            jwtRefreshSecret: 'test-refresh-secret',
            jwtRefreshExpiresIn: '7d',
          };
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register a new user and return token pair', async () => {
    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
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

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.user.email).toBe('test@praman.dev');
    expect(result.user.id).toBe('u-1');
  });

  it('should reject registration if email is already taken', async () => {
    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 'u-exists' }),
      update: vi.fn().mockResolvedValue({}),
    });

    await expect(
      service.register({
        email: 'taken@praman.dev',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should authenticate user with valid credentials and return token pair', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secretPass', salt);

    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({
        id: 'u-login',
        email: 'login@praman.dev',
        name: 'Login User',
        passwordHash: hash,
      }),
      update: vi.fn().mockResolvedValue({}),
    });

    const result = await service.login({
      email: 'login@praman.dev',
      password: 'secretPass',
    });

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
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
      update: vi.fn().mockResolvedValue({}),
    });

    await expect(
      service.login({
        email: 'login@praman.dev',
        password: 'wrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should refresh tokens when valid refresh token is provided', async () => {
    const refreshToken = 'valid-refresh-token';
    const salt = await bcrypt.genSalt(10);
    const tokenHash = await bcrypt.hash(refreshToken, salt);

    mockJwtService.verify.mockReturnValue({
      sub: 'u-login',
      email: 'login@praman.dev',
    });

    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({
        id: 'u-login',
        email: 'login@praman.dev',
        name: 'Login User',
        refreshTokenHash: tokenHash,
      }),
      update: vi.fn().mockResolvedValue({}),
    });

    const result = await service.refresh(refreshToken);

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.user.id).toBe('u-login');
  });

  it('should reject refresh if token does not match stored hash (reuse detection)', async () => {
    const refreshToken = 'reused-token';
    const salt = await bcrypt.genSalt(10);
    const tokenHash = await bcrypt.hash('different-token', salt);

    mockJwtService.verify.mockReturnValue({
      sub: 'u-login',
      email: 'login@praman.dev',
    });

    const updateMock = vi.fn().mockResolvedValue({});
    mockPrisma.client.orm.public.User.where.mockReturnValue({
      first: vi.fn().mockResolvedValue({
        id: 'u-login',
        email: 'login@praman.dev',
        refreshTokenHash: tokenHash,
      }),
      update: updateMock,
    });

    await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    // Verifies that on token reuse, the stored hash was revoked
    expect(updateMock).toHaveBeenCalledWith({ refreshTokenHash: null });
  });

  it('should logout user and revoke refresh token', async () => {
    const updateMock = vi.fn().mockResolvedValue({});
    mockPrisma.client.orm.public.User.where.mockReturnValue({
      update: updateMock,
    });

    const result = await service.logout('u-login');
    expect(result).toEqual({
      message: 'Successfully logged out',
      userId: 'u-login',
    });
    expect(updateMock).toHaveBeenCalledWith({ refreshTokenHash: null });
  });
});
