// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    modules: [
        '@nuxtjs/tailwindcss',
        '@nuxtjs/color-mode',
        'nuxt-file-storage',
        'shadcn-nuxt',
        '@pinia/nuxt',
    ],
    fileStorage: {
        mount: 'public/files',
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
        // Make environment variables accessible here
        DATABASE_URL: process.env.DATABASE_URL,
        public: {
            DATABASE_URL: process.env.DATABASE_URL,
            // Add more environment variables as needed
        },
    },
    imports: {
        dirs: ['stores'],
    },
    ssr: false,
});
