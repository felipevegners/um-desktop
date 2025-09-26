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

const polylineOpts = ref<any>({
  path: props.rideRealCoords.map((path: any) => ({
    lat: path.latitude,
    lng: path.longitude,
  })),
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 5,
  zIndex: 10,
});

const directionsRenderer = ref(null);
const center = {
  lat: props.rideRealCoords[0].latitude,
  lng: props.rideRealCoords[0].longitude,
};
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
        const customArrow = {
          //@ts-ignore
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          strokeColor: '#00F',
          fillColor: '#00F',
          fillOpacity: 1,
        };
        if (!directionsRenderer.value) {
          setDirection(
            //@ts-ignore
            new window.google.maps.DirectionsRenderer({
              suppressMarkers: true,
              polylineOptions: {
                geodesic: true,
                strokeColor: '#ff33cc',
                strokeOpacity: 1,
                strokeWeight: 8,
                zIndex: 9,
                icons: [
                  {
                    icon: customArrow,
                    offset: '0%',
                  },
                ],
              },
            }),
          );
          //@ts-ignore
          directionsRenderer.value.setMap(gmap.value);
        }
        //@ts-ignore
        directionsRenderer.value.setDirections(response);
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
  <section>
    <GoogleMap
      ref="mapRef"
      :api-key="GMAPS_API_KEY"
      :options="mapOptions"
      :center="center"
      style="width: 100%; height: 450px"
      :zoom="15"
    >
      <Polyline :options="polylineOpts" />
      <DirectionsRenderer />
    </GoogleMap>
  </section>
</template>
