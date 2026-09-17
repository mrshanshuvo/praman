import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

/**
 * Parameter decorator to extract the currently authenticated user from the request.
 *
 * Usage:
 * ```ts
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
