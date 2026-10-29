import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { DatabaseModule } from './modules/database/database.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { AuditModule } from './modules/audit/audit.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ParcelsModule } from './modules/parcels/parcels.module';
import { ClientProfilesModule } from './modules/client-profiles/client-profiles.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';

import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { JurisdictionGuard } from './common/guards/jurisdiction.guard';
import { SegregationOfDutiesGuard } from './common/guards/segregation-of-duties.guard';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ObservabilityModule,
    AuditModule,
    OutboxModule,
    AccessControlModule,
    IdentityModule,
    OrganizationsModule,
    ParcelsModule,
    ClientProfilesModule,
    ApplicationsModule,
    RecommendationsModule,
    NotificationsModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JurisdictionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SegregationOfDutiesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
