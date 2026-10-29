import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SegregationOfDutiesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const application = request.application || request.body?.application;

    if (!application || !user) {
      return true; // If application not pre-loaded or context missing, service layer will also enforce
    }

    // If this action is an approval and the reviewing officer is the same user
    if (application.reviewedBy && application.reviewedBy === user.id) {
      throw new ForbiddenException(
        'Segregation of duties violation: The officer who reviewed the application cannot approve it.',
      );
    }

    return true;
  }
}
