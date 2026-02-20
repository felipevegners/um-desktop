import { NuxtAuthHandler } from '#auth';
import { useToast } from '@/components/ui/toast/use-toast';
import bcrypt from 'bcrypt';
import { getCookie, setCookie } from 'h3';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '~/utils/prisma';

const { toast } = useToast();

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
        const account = await prisma.accounts.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!account) {
          throw new Error('Conta não encontrada!');
        }

        if (!account.emailConfirmed) {
          throw createError({
            statusCode: 401,
            message:
              'Sua conta ainda não foi verificada!, Acesse seu e-mail e confirme seu cadastro para prosseguir com o acesso.',
            cause: 'Error',
          });
        }

        const isValid = await bcrypt.compare(credentials.password, account.password);

        if (!isValid) {
          throw createError({
            statusCode: 401,
            message: 'Senha inválida!',
          });
        }
        return {
          ...account,
          password: undefined,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 1800,
  },

  callbacks: {
    async signIn({ user }: any) {
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
      // Update DB to mark user as logged in and set token expiry for refresh logic
      try {
        const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (user?.id) {
          await prisma.accounts.update({
            where: { id: user.id },
            data: { tokenExpiresAt: refreshExpiry, isLoggedIn: true },
          });
        }
      } catch (err) {
        console.error('Error updating login state in DB:', err);
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
        };
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
    async signOut(message: any) {
      try {
        // Try to retrieve user id from token or session
        const userId = message?.token?.id || message?.session?.user?.id || undefined;

        // If we don't have an id but have email, resolve the account
        let idToUse = userId;
        if (!idToUse && message?.session?.user?.email) {
          const acc = await prisma.accounts.findUnique({
            where: { email: message.session.user.email },
          });
          idToUse = acc?.id;
        }

        if (idToUse) {
          await prisma.accounts.update({
            where: { id: idToUse },
            data: { isLoggedIn: false, tokenExpiresAt: null },
          });
        }
      } catch (err) {
        console.error('Error in signOut event updating DB:', err);
      }
    },
  },
});
