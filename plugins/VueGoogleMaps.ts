// import { defineNuxtPlugin } from '#app';
import VueGoogleMaps from '@fawmi/vue-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default defineNuxtPlugin({
  name: 'VueGoogleMaps',
  async setup(nuxtApp) {
    nuxtApp.vueApp.use(VueGoogleMaps, {
      load: {
        key: API_KEY,
        libraries: 'places', // This is required if you use the Autocomplete plugin
      },
      autobindAllEvents: true,
    });
  },
});
