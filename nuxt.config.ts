import type { RouteHandlerConfig } from 'uploadthing/types';

// https://nuxt.com/docs/api/configuration/nuxt-config
export type ModuleOptions = RouteHandlerConfig & {
  /**
   * Path to your router definition file
   * @default `~/server/uploadthing.ts`
   */
  routerPath?: string;
};
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@uploadthing/nuxt',
    '@sidebase/nuxt-auth',
  ],
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    originEnvKey: 'NUXT_AUTH_ORIGIN',
    baseURL: 'http://localhost:3000/api/auth',
    provider: {
      type: 'authjs',
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true,
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui',
  },
  // prisma: {
  //   skipPrompts: true
  // },
  runtimeConfig: {
    authSecret: process.env.NUXT_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    public: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
  },
  imports: {
    dirs: ['stores'],
  },
  uploadthing: {
    routerPath: '~/server/uploadthing.ts',
  },
  ssr: false,
});
