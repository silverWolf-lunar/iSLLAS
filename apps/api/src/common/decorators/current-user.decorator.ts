import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '@sllas/contracts';

export const CurrentUser = createParamDecorator(
  (data: keyof UserProfile | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
