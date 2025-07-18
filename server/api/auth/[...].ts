import { NuxtAuthHandler } from '#auth';
import { useToast } from '@/components/ui/toast/use-toast';
import bcrypt from 'bcrypt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '~/utils/prisma';

const { toast } = useToast();

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,
  pages: {
    signIn: '/login',
    error: '/error',
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
            cause: 'Barretos',
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
  },
});
