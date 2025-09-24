<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app';
import { computed, reactive, ref, watch } from 'vue';
import { GoogleMap, Polyline } from 'vue3-google-map';

const env = useRuntimeConfig();
const mapRef = ref<any>(null);
const GMAPS_API_KEY = computed(() => env.public.VITE_GOOGLE_MAPS_API_KEY);
const gmap = ref<any>(null);
const mapOptions = reactive({
  zoom: 20,
  maxZoom: 10,
  minZoom: 3,
  styles: [],
});
const props = defineProps<{
  originCoords?: any;
  destinationCoords?: any;
  rideRealCoords: any;
}>();

const polyline = ref<any>(null);
const polylineOpts = ref<any>({
  path: props.rideRealCoords.map((path: any) => ({
    lat: path.latitude,
    lng: path.longitude,
  })),
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 5,
});
const polylineOpts2 = ref<any>({
  path: props.rideRealCoords.map((path: any) => ({
    lat: path.latitude,
    lng: path.longitude,
  })),
  geodesic: true,
  strokeColor: '#7c3aed',
  strokeOpacity: 1.0,
  strokeWeight: 8,
});

const directionsRenderer = ref(null);
const center = props.rideRealCoords[0];
watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (!ready) return;
    gmap.value = mapRef.value.map;
    directions();
  },
);
function setDirection(val: any) {
  directionsRenderer.value = val;
}
async function directions() {
  try {
    const request = {
      origin: props.originCoords, // Start point
      destination: props.destinationCoords, // End point
      travelMode: 'DRIVING', // Travel mode: DRIVING, WALKING, BICYCLING, TRANSIT
    };
    //@ts-ignore
    const directionsService = new window.google.maps.DirectionsService();
    await directionsService.route(request, (response: any, status: any) => {
      //@ts-ignore
      if (status === window.google.maps.DirectionsStatus.OK) {
        if (!directionsRenderer.value) {
          //@ts-ignore
          setDirection(new window.google.maps.DirectionsRenderer());
          //@ts-ignore
          directionsRenderer.value.setMap(gmap.value);
        }
        //@ts-ignore
        directionsRenderer.value.setDirections(response);
        polyline.value = response.routes[0].overview_polyline;
      } else {
        console.error('Failed to calculate the route:', status);
        alert('No route found. Please check your coordinates and travel mode.');
      }
    });
  } catch (e) {
    console.log(e);
  }
}
</script>

<template>
  <section class="border border-violet-600">
    <GoogleMap
      ref="mapRef"
      :api-key="GMAPS_API_KEY"
      :options="mapOptions"
      :center="center"
      style="width: 100%; height: 450px"
      :zoom="15"
    >
      <Polyline :options="polylineOpts" />
      <Polyline :options="polylineOpts2" />
    </GoogleMap>
  </section>
</template>
