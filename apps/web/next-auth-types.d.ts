import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    error?: string;
    user: DefaultSession['user'] & { id?: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
