import { NuxtAuthHandler } from '#auth';
import { getCookie, setCookie } from 'h3';
import CredentialsProvider from 'next-auth/providers/credentials';
import { $fetch } from 'ofetch';
import { prisma } from '~/utils/prisma';

const DESKTOP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const UM_API_TOKEN_REFRESH_WINDOW_MS = 2 * 60 * 1000;

function resolveUmApiBaseUrl(): string {
  return (
    process.env.UM_API_BASE_URL ||
    process.env.EXPO_PUBLIC_UM_API_URL ||
    'https://um-api-pu0t.onrender.com'
  );
}

function toTimestamp(dateLike: unknown): number {
  if (typeof dateLike !== 'string' || !dateLike.trim()) return 0;
  const timestamp = new Date(dateLike).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function shouldRefreshUmApiToken(token: any): boolean {
  const accessToken = token?.umApiToken;
  const refreshToken = token?.umApiRefreshToken;
  const expiresAt = toTimestamp(token?.umApiAccessTokenExpiresAt);

  if (!accessToken || !refreshToken || !expiresAt) {
    return false;
  }

  return Date.now() >= expiresAt - UM_API_TOKEN_REFRESH_WINDOW_MS;
}

async function rotateUmApiSessionToken(token: any): Promise<any> {
  if (!token?.umApiRefreshToken) {
    return token;
  }

  try {
    const apiBaseUrl = resolveUmApiBaseUrl();
    const refreshUrl = new URL('/auth/refresh', apiBaseUrl);
    const refreshedSession = await $fetch<any>(refreshUrl.toString(), {
      method: 'POST',
      body: {
        refreshToken: token.umApiRefreshToken,
      },
    });

    if (!refreshedSession?.accessToken) {
      throw new Error('um-api refresh did not return access token');
    }

    return {
      ...token,
      umApiToken: refreshedSession.accessToken,
      umApiRefreshToken: refreshedSession.refreshToken ?? token.umApiRefreshToken,
      umApiAccessTokenExpiresAt:
        refreshedSession.accessTokenExpiresAt ?? token.umApiAccessTokenExpiresAt,
      umApiSession: refreshedSession.session ?? token.umApiSession ?? null,
      permissions: Array.isArray(refreshedSession.permissions)
        ? refreshedSession.permissions
        : (token.permissions ?? []),
      accessScope: refreshedSession.accessScope ?? token.accessScope ?? null,
      authError: null,
    };
  } catch (error) {
    console.error('[auth] Failed to rotate um-api token:', error);
    return {
      ...token,
      umApiToken: null,
      umApiRefreshToken: null,
      umApiAccessTokenExpiresAt: null,
      authError: 'um_api_refresh_failed',
    };
  }
}

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    //@ts-expect-error
    CredentialsProvider.default({
      name: 'credentials',
      credentials: {},
      //@ts-ignore
      async authorize(credentials: { email: string; password: string }) {
        if (!credentials?.email || !credentials?.password) {
          throw createError({
            statusCode: 400,
            message: 'Email e senha são obrigatórios.',
          });
        }

        // O login do desktop deve confiar no um-api como fonte única de autenticação.
        try {
          const apiBaseUrl = resolveUmApiBaseUrl();
          const loginUrl = new URL('/auth/login', apiBaseUrl);
          const loginResult = await $fetch<any>(loginUrl.toString(), {
            method: 'POST',
            body: {
              email: credentials.email,
              password: credentials.password,
              clientType: 'web',
              includeRefreshToken: true,
            },
          });

          if (
            !loginResult?.accessToken ||
            !loginResult?.refreshToken ||
            !loginResult?.user
          ) {
            throw createError({
              statusCode: 401,
              message: 'Falha ao validar sessão no um-api.',
            });
          }

          return {
            ...loginResult.user,
            id: loginResult.user.id,
            name: loginResult.user.username || loginResult.user.name,
            umApiToken: loginResult.accessToken,
            umApiRefreshToken: loginResult.refreshToken,
            umApiAccessTokenExpiresAt: loginResult.accessTokenExpiresAt || null,
            umApiSession: loginResult.session || null,
            permissions: Array.isArray(loginResult.permissions)
              ? loginResult.permissions
              : [],
            accessScope: loginResult.accessScope || null,
            session: loginResult.session || null,
          };
        } catch (err) {
          console.error('[auth] Failed login via um-api:', err);
          throw createError({
            statusCode: 401,
            message: 'Email ou senha inválidos.',
          });
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: DESKTOP_SESSION_MAX_AGE_SECONDS,
    updateAge: 5 * 60,
  },

  callbacks: {
    async signIn({ user }: any) {
      // Fire-and-forget: keep local isLoggedIn flag in sync without blocking auth.
      if ((user as any)?.id) {
        prisma.accounts
          .update({ where: { id: (user as any).id }, data: { isLoggedIn: true } })
          .catch((err: any) =>
            console.error('[auth] Failed to set isLoggedIn=true:', err),
          );
      }

      // Set cookies when user is authenticated
      try {
        const event = useEvent();
        const cookiesAccepted = String(getCookie(event, 'accept_cookies') || 'false');

        if (event) {
          setCookie(event, 'accept_cookies', cookiesAccepted, {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
          });
          //@ts-ignore
          setCookie(event, 'accept_terms', String(user?.acceptTerms), {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
          });
        }
      } catch (error) {
        console.error('Error setting cookies:', error);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token = {
          ...token,
          ...user,
          //@ts-ignore
          name: user?.username,
          //@ts-ignore
          umApiToken: user?.umApiToken ?? null,
          //@ts-ignore
          umApiRefreshToken: user?.umApiRefreshToken ?? null,
          //@ts-ignore
          umApiAccessTokenExpiresAt: user?.umApiAccessTokenExpiresAt ?? null,
          //@ts-ignore
          umApiSession: user?.umApiSession ?? null,
          authError: null,
        };
      }

      if (shouldRefreshUmApiToken(token)) {
        token = await rotateUmApiSessionToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...token,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signOut({ token }: any) {
      // Fire-and-forget: clear isLoggedIn flag without blocking signOut.
      const accountId = token?.id || token?.sub;
      if (accountId) {
        prisma.accounts
          .update({ where: { id: accountId }, data: { isLoggedIn: false } })
          .catch((err: any) =>
            console.error('[auth] Failed to set isLoggedIn=false:', err),
          );
      }
    },
  },
});
