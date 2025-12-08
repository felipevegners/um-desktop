<script setup lang="ts">
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-vue-next';
import { useRuntimeConfig } from 'nuxt/app';
import { computed, reactive, ref, watch } from 'vue';
import { CustomMarker, GoogleMap, Polyline } from 'vue3-google-map';

const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

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
  stopsCoords?: any;
  destinationCoords?: any;
  rideRealCoords?: any;
  driverData?: any;
  inProgress?: boolean;
}>();

const polylineOpts = ref<any>({
  path:
    props.rideRealCoords?.ridePath?.map((path: any) => ({
      lat: path.latitude,
      lng: path.longitude,
    })) || [],
  geodesic: true,
  strokeColor: '#f0f',
  strokeOpacity: 0.75,
  strokeWeight: 4,
  zIndex: 10,
});

const directionsRenderer = ref(null);
const center = {
  lat: props.originCoords?.latitude,
  lng: props.originCoords?.longitude,
};

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (!ready) return;
    gmap.value = mapRef.value?.map;
    directions();
    //@ts-ignore
    const bounds = new google.maps.LatLngBounds();
    //@ts-ignore
    bounds.extend(new google.maps.LatLng(props.originCoords.lat, props.originCoords.lng));
    bounds.extend(
      //@ts-ignore
      new google.maps.LatLng(props.destinationCoords.lat, props.destinationCoords.lng),
    );

    gmap.value.fitBounds(bounds);
  },
);
function setDirection(val: any) {
  directionsRenderer.value = val;
}
async function directions() {
  const intermediates = props.stopsCoords?.map((stop: any) => {
    return {
      location: {
        lat: stop.coords.lat,
        lng: stop.coords.lng,
      },
    };
  });
  try {
    const request = {
      origin: props.originCoords, // Start point
      waypoints: intermediates,
      destination: props.destinationCoords, // End point
      travelMode: 'DRIVING', // Travel mode: DRIVING, WALKING, BICYCLING, TRANSIT
    };
    //@ts-ignore
    const directionsService = new window.google.maps.DirectionsService();
    await directionsService.route(request, (response: any, status: any) => {
      //@ts-ignore
      if (status === window.google.maps.DirectionsStatus.OK) {
        // const customArrow = {
        //   //@ts-ignore
        //   path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        //   scale: 5,
        //   strokeColor: '#000000',
        //   fillColor: '#000000',
        //   fillOpacity: 0.8,
        //   //@ts-ignore
        //   anchor: new google.maps.Point(0, 0),
        // };

        // const square = {
        //   path: 'M 10 20 10 20',
        //   strokeColor: '#000',
        //   fillColor: '#33ffcc',
        //   fillOpacity: 1,
        //   scale: 5,
        // };
        if (!directionsRenderer.value) {
          setDirection(
            //@ts-ignore
            new window.google.maps.DirectionsRenderer({
              suppressMarkers: true,
              polylineOptions: {
                geodesic: true,
                strokeColor: '#000',
                strokeOpacity: 0.8,
                strokeWeight: 6,
                zIndex: 9,
                // icons: [
                //   {
                //     icon: customArrow,
                //     offset: '0%',
                //   },
                // ],
              },
            }),
          );
          const route = response.routes[0];
          const startLocation = route.legs[0].start_location;
          const endLocation = route.legs[0].end_location;
          //@ts-ignore
          new google.maps.Marker({
            position: startLocation,
            map: gmap.value,
            icon:
              'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStart),
            title: 'Embarque',
          });

          const legs = response.routes[0].legs;
          legs.forEach((leg: any, index: number) => {
            if (index > 0) {
              //@ts-ignore
              new google.maps.Marker({
                position: leg.start_location,
                map: gmap.value,
                icon:
                  'data:image/svg+xml;charset=UTF-8,' +
                  encodeURIComponent(customIconStop),
                title: `Parada ${index + 1}`,
                scale: 8,
              });
            }
          });
          //@ts-ignore
          new google.maps.Marker({
            position: endLocation,
            map: gmap.value,
            icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd),
            title: `Destino`,
          });
          //@ts-ignore
          directionsRenderer.value.setMap(gmap.value);
          gmap.value.fitBounds(response.routes[0].bounds);
          setTimeout(() => {
            gmap.value.panTo(response.routes[0].bounds);
          }, 200);
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
    <div
      v-if="driverData?.loading"
      class="p-3 flex flex-row items-center gap-3 bg-zinc-900"
    >
      <LoaderCircle class="animate-spin text-white" />
      <small class="text-white">Carregando localização do motorista...</small>
    </div>
    <GoogleMap
      ref="mapRef"
      :api-key="GMAPS_API_KEY"
      :options="mapOptions"
      style="width: 100%; height: 550px"
      :disable-default-ui="true"
    >
      <CustomMarker
        v-if="inProgress && !driverData.loading"
        :options="{
          position: {
            lat: driverData?.location?.latitude,
            lng: driverData?.location?.longitude,
          },
          anchorPoint: 'TOP_CENTER',
        }"
      >
        <div class="relative flex flex-col items-center">
          <span class="px-2 py-1 rounded-md bg-zinc-900 text-white">
            {{ driverData?.name.split(' ')[0] }}
          </span>
          <img
            :src="driverData?.picture || '/images/no-avatar.png'"
            :class="
              cn(
                'w-14 h-14 object-cover border-4 border-zinc-900 rounded-full relative',
                driverData?.location?.speed === 0 && 'border-amber-600',
              )
            "
          />
          <div
            class="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-zinc-900"
          />
        </div>
      </CustomMarker>
      <Polyline :options="polylineOpts" />
      <DirectionsRenderer />
    </GoogleMap>
  </section>
</template>
