import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SegregationOfDutiesGuard } from '../src/common/guards/segregation-of-duties.guard';

describe('SegregationOfDutiesGuard (Reviewer cannot be Approver)', () => {
  let guard: SegregationOfDutiesGuard;

  const OFFICER_REVIEWER_ID = 'usr-reviewer-1111';
  const SENIOR_APPROVER_ID = 'usr-approver-2222';

  beforeEach(() => {
    guard = new SegregationOfDutiesGuard();
  });

  const createMockContext = (userId: string, application: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: userId },
          application,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should BLOCK approval if actor is the same officer who reviewed the application', () => {
    const application = {
      id: 'app-100',
      reviewedBy: OFFICER_REVIEWER_ID,
    };

    const context = createMockContext(OFFICER_REVIEWER_ID, application);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should ALLOW approval if actor is an independent officer', () => {
    const application = {
      id: 'app-100',
      reviewedBy: OFFICER_REVIEWER_ID,
    };

    const context = createMockContext(SENIOR_APPROVER_ID, application);

    expect(guard.canActivate(context)).toBe(true);
  });
});
