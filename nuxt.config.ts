import type { RouteHandlerConfig } from 'uploadthing/types';

const { DATABASE_URL, VITE_GOOGLE_MAPS_API_KEY } = process.env;

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
  app: {
    head: {
      title: 'Urban Mobi - Plataforma de Gestão de Mobilidade Urbana e Corporativa',
      htmlAttrs: {
        lang: 'pt-BR',
      },
      link: [
        {
          rel: 'icon',
          type: 'image/svg',
          href: 'images/um_symbol_negative.svg',
        },
      ],
      charset: 'utf-16',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@uploadthing/nuxt',
    '@sidebase/nuxt-auth',
  ],
  auth: {
    globalAppMiddleware: true,
    provider: {
      type: 'authjs',
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
    authSecret: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    VITE_GOOGLE_MAPS_API_KEY,
    public: {
      VITE_GOOGLE_MAPS_API_KEY,
      DATABASE_URL,
    },
  },
  imports: {
    dirs: ['stores'],
  },
  uploadthing: {
    routerPath: '~/server/uploadthing.ts',
  },
  ssr: false,
  plugins: ['~/plugins/VueGoogleMaps'],
  build: {
    transpile: ['@fawmi/vue-google-maps'],
  },
  vite: {
    optimizeDeps: {
      include: ['@fawmi/vue-google-maps', 'fast-deep-equal'],
    },
  },
});
