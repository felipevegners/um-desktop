<script setup lang="ts">
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-vue-next';
import { useRuntimeConfig } from 'nuxt/app';
import { computed, reactive, ref, watch } from 'vue';
import { CustomMarker, GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { polyLineCodec } from '~/lib/utils';

const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

const env = useRuntimeConfig();
const DIRECTIONS_ENABLED = computed(
  () => String(env.public.VITE_ENABLE_DIRECTIONS ?? 'false') === 'true',
);
const mapRef = ref<any>(null);
const GMAPS_API_KEY = computed(() => env.public.VITE_GOOGLE_MAPS_API_KEY);
const gmap = ref<any>(null);

// Normalize coordinate objects that may use lat/lng or latitude/longitude
function toLatLng(coords: any): { lat: number; lng: number } | null {
  if (!coords) return null;
  const lat =
    typeof coords.lat === 'number'
      ? coords.lat
      : typeof coords.latitude === 'number'
        ? coords.latitude
        : parseFloat(coords.lat ?? coords.latitude);
  const lng =
    typeof coords.lng === 'number'
      ? coords.lng
      : typeof coords.longitude === 'number'
        ? coords.longitude
        : parseFloat(coords.lng ?? coords.longitude);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  return { lat, lng };
}

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
  rideProgress?: any;
  driverData?: any;
  realPolyline?: any;
  rideStatus?: string;
}>();

const driverPath = ref<any>({
  // `ridePath` removed — prefer server `canonicalPath` (magenta). Keep empty fallback.
  path: [],
  geodesic: true,
  strokeColor: '#f0f',
  strokeOpacity: 1.0,
  strokeWeight: 4,
  zIndex: 10,
});

const serverPolyline = ref('');
const finalPolyline = computed(() => {
  const encoded = props.realPolyline || serverPolyline.value || '';
  const decode: any = polyLineCodec(encoded);
  const coords = decode.map((path: any) => ({
    lat: path[0],
    lng: path[1],
  }));
  return {
    path: coords,
    geodesic: true,
    strokeColor: '#33ccff',
    strokeOpacity: 1.0,
    strokeWeight: 8,
    zIndex: 9,
  };
});

const checkIconData =
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd);

const canonicalCoords = computed(() => {
  const canonical = props.rideProgress?.canonicalPath;
  if (!Array.isArray(canonical)) return [];
  return canonical.map((p: any) => toLatLng(p)).filter((p: any) => Boolean(p)) as {
    lat: number;
    lng: number;
  }[];
});

const finishedLL = computed(() => toLatLng(props.rideProgress?.finishedLocation));

const directionsRenderer = ref(null);
const originLL = computed(() => toLatLng(props.originCoords));
const destLL = computed(() => toLatLng(props.destinationCoords));
const center = computed(() => originLL.value ?? { lat: -15.7801, lng: -47.9292 });

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (!ready) return;
    gmap.value = mapRef.value?.map;
    // Prefer server-side route when available. If directions toggle is enabled
    // and there is no server-provided polyline/canonical path, fetch from server.
    if (
      DIRECTIONS_ENABLED.value &&
      !props.realPolyline &&
      canonicalCoords.value.length < 2
    ) {
      fetchServerRoute();
    }
    const oLL = originLL.value;
    const dLL = destLL.value;
    if (oLL && dLL) {
      //@ts-ignore
      const bounds = new google.maps.LatLngBounds();
      //@ts-ignore
      bounds.extend(new google.maps.LatLng(oLL.lat, oLL.lng));
      //@ts-ignore
      bounds.extend(new google.maps.LatLng(dLL.lat, dLL.lng));
      gmap.value.fitBounds(bounds);
    }
  },
);
async function fetchServerRoute() {
  // Build locations array compatible with server-side proxy
  const locations: any[] = [];
  if (originLL.value)
    locations.push({
      location: {
        latLng: { latitude: originLL.value.lat, longitude: originLL.value.lng },
      },
    });
  if (props.stopsCoords && Array.isArray(props.stopsCoords)) {
    for (const s of props.stopsCoords) {
      if (s?.coords) {
        locations.push({
          location: { latLng: { latitude: s.coords.lat, longitude: s.coords.lng } },
        });
      }
    }
  }
  if (destLL.value)
    locations.push({
      location: { latLng: { latitude: destLL.value.lat, longitude: destLL.value.lng } },
    });

  if (locations.length < 2) return;

  try {
    const response: any = await $fetch('/api/travels/routes', {
      method: 'POST',
      body: { locations },
    });

    const route = Array.isArray(response) && response.length > 0 ? response[0] : null;
    const encoded = route?.polyline?.encodedPolyline ?? '';
    if (encoded) {
      serverPolyline.value = encoded;
      // If bounds are present, try to pan/fit
      try {
        if (gmap.value && route?.bounds) {
          //@ts-ignore
          gmap.value.fitBounds(route.bounds);
          setTimeout(() => {
            //@ts-ignore
            gmap.value.panTo(route.bounds.getCenter());
          }, 200);
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    console.debug('Failed fetching server route', e);
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
      :center="center"
      :options="mapOptions"
      style="width: 100%; height: 550px"
      :disable-default-ui="true"
    >
      <CustomMarker
        v-if="rideStatus === 'in-progress' && !driverData.loading"
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
      <Polyline :options="finalPolyline" />
      <!-- Prefer server-side canonicalPath (magenta) when available, fallback to driverPath -->
      <Polyline
        v-if="canonicalCoords.length >= 2"
        :options="{
          path: canonicalCoords,
          geodesic: true,
          strokeColor: '#f0f',
          strokeOpacity: 1.0,
          strokeWeight: 4,
          zIndex: 10,
        }"
      />
      <Marker
        v-if="finishedLL"
        :options="{ position: finishedLL, icon: checkIconData, title: 'Finalizado' }"
      />
      <Polyline v-else :options="driverPath" />
      <DirectionsRenderer />
    </GoogleMap>
  </section>
</template>
