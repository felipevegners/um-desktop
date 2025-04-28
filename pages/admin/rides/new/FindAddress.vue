<script setup lang="ts">
import { GoogleMap, Marker } from 'vue3-google-map';

const env = useRuntimeConfig();
const { result, search } = useAlgoliaSearch('fields');
const markerRef = useTemplateRef('markerRef');
const mapRef = useTemplateRef('mapRef');
const GMAPS_API_KEY = computed(() => env.public.GMAPS_API_KEY);
const mapOptions = reactive({
  zoom: 20,
  maxZoom: 10,
  minZoom: 3,
  styles: [],
});
const center = computed(() => ({ lat: 50.4503596, lng: 30.5245025 }));
const locals = computed(() => result.value?.hits || []);
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedHandleBoundsChanged = debounce(handleBoundsChanged, 300);

async function handleBoundsChanged() {
  const gmap = mapRef.value.map;
  const bounds = gmap.getBounds();
  if (bounds) {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const boundingBox = [sw.lat(), sw.lng(), ne.lat(), ne.lat()];

    try {
      await search({
        query: '',
        requestOptions: {
          facetFilters: ['enabled:true', 'status:success'],
          insideBoundingBox: [boundingBox],
          aroundRadius: 50,
        },
      });
    } catch (error) {
      console.error('Error during Algolia search', error);
    }
  }
}

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (!ready) return;
    const gmap = mapRef.value.map;
    gmap.addListener('bounds_changed', debouncedHandleBoundsChanged);
  },
);
</script>
<template>
  <section class="grid grid-cols-7">
    <div class="col-span-1">
      <div v-for="item in locals" :key="item.id">
        <nuxt-link :to="`/field/${item.id}`">
          <h2>{{ item.title }}</h2>
        </nuxt-link>
        <address>
          {{ item.address }}({{ item._geoloc.lat }}, {{ item._geoloc.lat }})
        </address>
      </div>
    </div>
    <div class="col-span-6">
      <GoogleMap
        ref="mapRef"
        :api-key="GMAPS_API_KEY"
        :options="mapOptions"
        :center="center"
        style="width: 100%; height: 100vh"
        :zoom="15"
      >
        <Marker
          v-for="marker in locals"
          ref="markerRef"
          :key="marker.id"
          :options="{
            position: {
              lat: marker._geoloc.lat,
              lng: marker._geoloc.lng,
            },
          }"
        />
      </GoogleMap>
    </div>
  </section>
</template>
