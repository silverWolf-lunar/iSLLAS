import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { WORKER_ONLY_KEY } from '../decorators/worker-only.decorator';
import * as jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { AuthService } from '../../modules/identity/auth.service';
import { Role } from '@sllas/contracts';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private keycloakJwksClient?: JwksClient;

  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly authService?: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isWorkerOnly = this.reflector.getAllAndOverride<boolean>(WORKER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isWorkerOnly) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (isPublic && !token) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    if (process.env.NODE_ENV === 'production') {
      return this.authenticateWithKeycloak(token, request);
    }

    try {
      const secret = process.env.JWT_SECRET || 'dev-secret-key-for-local-testing-only-12345';

      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      request.user = this.createDevelopmentUser(decoded);

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private async authenticateWithKeycloak(
    token: string,
    request: { user?: unknown },
  ): Promise<boolean> {
    if (!this.authService) {
      throw new Error('Keycloak authentication requires AuthService');
    }

    const issuer = process.env.OIDC_ISSUER;
    const audience = process.env.OIDC_AUDIENCE;
    if (!issuer || !audience) {
      throw new Error('OIDC_ISSUER and OIDC_AUDIENCE must be configured');
    }

    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || decodedToken.header.alg !== 'RS256' || !decodedToken.header.kid) {
      throw new UnauthorizedException('Authentication failed');
    }

    this.keycloakJwksClient ??= jwksClient({
      jwksUri: `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    const signingKey = await new Promise<string>((resolve, reject) => {
      this.keycloakJwksClient!.getSigningKey(decodedToken.header.kid, (error, key) => {
        if (error || !key) {
          reject(new UnauthorizedException('Authentication failed'));
          return;
        }
        resolve(key.getPublicKey());
      });
    });

    let claims: jwt.JwtPayload;
    try {
      claims = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer,
        audience,
      }) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('Authentication failed');
    }

    if (typeof claims.sub !== 'string' || !this.hasExpectedRealmRole(claims)) {
      throw new UnauthorizedException('Authentication failed');
    }

    const profile = await this.authService.getKeycloakProfile(claims.sub);
    const roleClaim = `sllas_${profile.role.toLowerCase()}`;
    const realmRoles = claims.realm_access?.roles;
    if (!Array.isArray(realmRoles) || !realmRoles.includes(roleClaim)) {
      throw new UnauthorizedException('Keycloak role does not match the provisioned account');
    }

    request.user = profile;
    return true;
  }

  private hasExpectedRealmRole(claims: jwt.JwtPayload): boolean {
    const realmRoles = claims.realm_access?.roles;
    return Array.isArray(realmRoles) &&
      Object.values(Role).some((role) => realmRoles.includes(`sllas_${role.toLowerCase()}`));
  }

  private createDevelopmentUser(decoded: jwt.JwtPayload) {
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      firstName: decoded.given_name || decoded.firstName || '',
      lastName: decoded.family_name || decoded.lastName || '',
      phoneNumber: decoded.phoneNumber || null,
      role: decoded.role || 'CLIENT',
      officeId: decoded.officeId || null,
      provinceId: decoded.provinceId || null,
      districtId: decoded.districtId || null,
      status: decoded.status || 'ACTIVE',
      permissions: decoded.permissions || [],
    };
  }

  private extractTokenFromRequest(request: {
    headers: Record<string, string | undefined>;
    cookies?: Record<string, string | undefined>;
  }): string | null {
    // 1. Authorization: Bearer <token>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. HTTP-only Cookie
    if (request.cookies && request.cookies['sllas_session']) {
      return request.cookies['sllas_session'];
    }

    // 3. Dev testing header (X-Dev-User-Role / X-Dev-Token)
    if (process.env.NODE_ENV !== 'production' && request.headers['x-dev-token']) {
      return request.headers['x-dev-token'];
    }

    return null;
  }
}
