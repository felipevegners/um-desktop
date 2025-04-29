// import { defineNuxtPlugin } from '#app';
import VueGoogleMaps from '@fawmi/vue-google-maps';

export default defineNuxtPlugin({
  name: 'VueGoogleMaps',
  async setup(nuxtApp) {
    nuxtApp.vueApp.use(VueGoogleMaps, {
      load: {
        key: 'AIzaSyBWGVwrdiUr3IzWGFC713hIzRaNx2fYV4U',
        libraries: 'places', // This is required if you use the Autocomplete plugin
      },
      autobindAllEvents: true,
    });
  },
});
