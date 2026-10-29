import type { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
      issuer: process.env.OIDC_ISSUER ?? '',
      authorization: { params: { scope: 'openid email profile' } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === 'production' ? undefined : 'local-development-only-secret-not-for-deployments'),
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 5 * 60 * 1000;
        token.error = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
};
