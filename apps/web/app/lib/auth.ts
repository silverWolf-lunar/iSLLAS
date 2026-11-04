import type { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { Role } from '@sllas/contracts';

const issuer = process.env.OIDC_ISSUER ?? '';
const clientId = process.env.KEYCLOAK_CLIENT_ID ?? '';
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serializeError(entry)]));
  }
  return value;
}

// Automatically infer NEXTAUTH_URL in cloud environments (Render, Vercel) if not explicitly set
if (!process.env.NEXTAUTH_URL) {
  if (process.env.RENDER_EXTERNAL_URL) {
    process.env.NEXTAUTH_URL = process.env.RENDER_EXTERNAL_URL;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NODE_ENV === 'production') {
    process.env.NEXTAUTH_URL = 'https://isllas.onrender.com';
  } else {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}

// Ensure NEXTAUTH_SECRET is explicitly populated
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET =
    process.env.JWT_SECRET ||
    'sllas-production-session-fallback-secret-key-32chars-min';
}

const authSecret = process.env.NEXTAUTH_SECRET;

// Singleton Postgres pool — reused across hot-module reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __sllasAuthPool: Pool | undefined;
}

const REALTIME_DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  '';

function getPool(): Pool {
  if (!global.__sllasAuthPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      REALTIME_DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure DATABASE_URL in your environment or .env file.',
      );
    }

    const isSsl =
      process.env.DB_SSL === 'true' ||
      Boolean(
        connectionString &&
          !connectionString.includes('localhost') &&
          !connectionString.includes('127.0.0.1') &&
          !connectionString.includes('@db:'),
      );

    global.__sllasAuthPool = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    global.__sllasAuthPool.on('error', (err) => {
      console.error('[SLLAS_AUTH_POOL] Unexpected idle client error:', err.message);
      global.__sllasAuthPool = undefined;
    });
  }
  return global.__sllasAuthPool;
}

import crypto from 'crypto';

function signHs256Jwt(payload: Record<string, any>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Looks up a user by email in Supabase in real-time and verifies their password.
 * Returns the user row on success, null on failure.
 */
async function verifyDatabaseUser(email: string, password: string) {
  let pool: Pool;
  try {
    pool = getPool();
  } catch (err) {
    global.__sllasAuthPool = undefined;
    throw err;
  }

  let client;
  try {
    client = await pool.connect();
  } catch (err: any) {
    global.__sllasAuthPool = undefined;
    console.error('[SLLAS_AUTH] Database connection error:', err?.message);
    throw err;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await client.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      status: string;
      office_id: string | null;
      province_id: string | null;
      district_id: string | null;
      password_hash: string | null;
    }>(
      `SELECT id, email, first_name, last_name, role, status, office_id, province_id, district_id, password_hash
       FROM users
       WHERE LOWER(TRIM(email)) = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      console.warn(`[SLLAS_AUTH] Sign-in failed: No user found for ${normalizedEmail}`);
      return null;
    }

    const user = result.rows[0];

    // Only allow ACTIVE accounts
    if (user.status !== 'ACTIVE') {
      console.warn(`[SLLAS_AUTH] Sign-in failed: User ${normalizedEmail} status is ${user.status}`);
      return null;
    }

    // If no password hash is set yet, deny login
    if (!user.password_hash) {
      console.warn(`[SLLAS_AUTH] Sign-in failed: User ${normalizedEmail} has no password_hash set`);
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.warn(`[SLLAS_AUTH] Sign-in failed: Password mismatch for ${normalizedEmail}`);
      return null;
    }

    return user;
  } finally {
    if (client) client.release();
  }
}

const authProviders: any[] = [
  CredentialsProvider({
    id: 'credentials',
    name: 'Government Credentials',
    credentials: {
      email: { label: 'Email', type: 'text', placeholder: 'officer@sllas.gov.zw' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Please enter both your email and password');
      }

      if (credentials.password.trim().length === 0) {
        throw new Error('Password cannot be empty');
      }

      // 1. Direct Real-Time Supabase Database Verification (Primary authoritative source)
      try {
        const dbUser = await verifyDatabaseUser(credentials.email, credentials.password);
        if (dbUser) {
          const fullName = `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.email;
          const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-for-local-testing-only-12345';
          const nowSec = Math.floor(Date.now() / 1000);
          const signedAccessToken = signHs256Jwt({
            sub: dbUser.id,
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            role: dbUser.role,
            status: dbUser.status,
            officeId: dbUser.office_id || null,
            provinceId: dbUser.province_id || null,
            districtId: dbUser.district_id || null,
            iat: nowSec,
            exp: nowSec + 8 * 3600,
          }, jwtSecret);

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: fullName,
            role: dbUser.role as Role,
            provinceId: dbUser.province_id || undefined,
            districtId: dbUser.district_id || undefined,
            accessToken: signedAccessToken,
          };
        }
      } catch (dbErr: any) {
        console.warn('[SLLAS_AUTH] Direct DB verification encountered error, checking backend API fallback:', dbErr?.message);
      }

      // 2. Secondary: Try Backend API if available
      let apiBaseUrl = (process.env.API_INTERNAL_URL ?? 'http://localhost:3001').trim().replace(/\/$/, '');
      if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
        apiBaseUrl = `https://${apiBaseUrl}`;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email.trim(),
            password: credentials.password,
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (res.ok) {
          const data = await res.json();
          const authResult = data?.data ?? data;
          if (authResult?.token && authResult?.user) {
            return {
              id: authResult.user.id,
              email: authResult.user.email,
              name: `${authResult.user.firstName || ''} ${authResult.user.lastName || ''}`.trim() || authResult.user.email,
              role: authResult.user.role,
              accessToken: authResult.token,
            };
          }
        }
      } catch (err: any) {
        console.warn(`[SLLAS_AUTH] Backend API login attempt failed: ${err?.message}`);
      }

      // If user was not verified via database or backend API
      throw new Error('Invalid email or password');
    },
  }),
];

// Only register KeycloakProvider if OIDC_ISSUER and KEYCLOAK_CLIENT_ID are configured
if (issuer && clientId) {
  authProviders.push(
    KeycloakProvider({
      clientId,
      clientSecret: clientSecret || '',
      issuer,
      authorization: { params: { scope: 'openid email profile' } },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers: authProviders,
  secret: authSecret,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  useSecureCookies:
    process.env.NODE_ENV === 'production' &&
    (process.env.NEXTAUTH_URL?.startsWith('https://') ?? false) &&
    !process.env.NEXTAUTH_URL?.includes('localhost') &&
    !process.env.NEXTAUTH_URL?.includes('127.0.0.1'),
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  logger: {
    error(code, metadata) {
      const details = metadata instanceof Error
        ? serializeError(metadata)
        : serializeError(metadata);
      console.error('[SLLAS_AUTH_ERROR]', JSON.stringify({
        code,
        issuer,
        clientId,
        details,
      }));
    },
    warn(code) {
      console.warn('[SLLAS_AUTH_WARN]', code);
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 5 * 60 * 1000;
        token.error = undefined;
      }
      if (user) {
        token.sub = user.id;
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.provinceId = (user as any).provinceId;
        token.districtId = (user as any).districtId;
        token.accessTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        token.error = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).provinceId = token.provinceId;
        (session.user as any).districtId = token.districtId;
        (session.user as any).accessToken = token.accessToken;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
};
