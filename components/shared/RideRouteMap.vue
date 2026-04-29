<script setup lang="ts">
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-vue-next';
import { useRuntimeConfig } from 'nuxt/app';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { CustomMarker, GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { polyLineCodec } from '~/lib/utils';

// color mode is provided by Nuxt's color-mode module (auto-imported)
// Use a safe runtime check so missing auto-import doesn't throw a ReferenceError.
const colorMode =
  typeof useColorMode !== 'undefined' && typeof useColorMode === 'function'
    ? useColorMode()
    : ref('light');

const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

const env = useRuntimeConfig();
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

// Map styles copied from `um-driver-app` `NAVIGATION_MAP_STYLE_*` to ensure visual consistency
const DESKTOP_MAP_STYLE_LIGHT = [
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f6368' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },

  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9ea' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d0d0d0' }],
  },

  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e0e0e0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cfcfcf' }],
  },

  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e6f1e8' }],
  },

  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#b3d9ed' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const DESKTOP_MAP_STYLE_DARK = [
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d5dde8' }] },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a2430' }],
  },

  // Navy background — not pure black, easier on eyes
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },

  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#3f4958' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#263241' }],
  },

  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },

  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },

  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8fa1b6' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },

  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },

  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7f8ea3' }],
  },
];

const mapOptions = reactive({
  zoom: 20,
  maxZoom: 10,
  minZoom: 3,
  styles: colorMode.value === 'dark' ? DESKTOP_MAP_STYLE_DARK : DESKTOP_MAP_STYLE_LIGHT,
});

// Theme synchronization (light/dark or explicit override) handled after `props` is defined.

onMounted(() => {
  // Debug: ensure color mode and styles are available at runtime
  // debug logs removed
});
const props = defineProps<{
  originCoords?: any;
  stopsCoords?: any[];
  destinationCoords?: any;
  rideProgress?: any;
  driverData?: any;
  realPolyline?: any;
  rideStatus?: string;
  // mapTheme: 'auto' (follow colorMode) | 'light' | 'dark' — allows forcing map theme
  mapTheme?: 'auto' | 'light' | 'dark';
}>();

// Compute effective theme: explicit `mapTheme` prop overrides Nuxt `colorMode` when provided
const effectiveTheme = computed(() => {
  const override = props.mapTheme ?? 'auto';
  if (override !== 'auto') return override;
  return colorMode?.value ?? 'light';
});

const mapStyles = computed(() =>
  effectiveTheme.value === 'dark' ? DESKTOP_MAP_STYLE_DARK : DESKTOP_MAP_STYLE_LIGHT,
);

// Initialize styles based on effective theme
mapOptions.styles = mapStyles.value;

// Watch effective theme (either colorMode or explicit prop) and apply styles + StyledMapType
watch(
  () => effectiveTheme.value,
  (v) => {
    mapOptions.styles = v === 'dark' ? DESKTOP_MAP_STYLE_DARK : DESKTOP_MAP_STYLE_LIGHT;
    if (gmap.value && typeof gmap.value.setOptions === 'function') {
      // debug log removed
      gmap.value.setOptions({ styles: mapOptions.styles });
      try {
        const gm: any = (globalThis as any).google;
        if (gm && gm.maps && typeof gm.maps.StyledMapType === 'function') {
          const styled = new gm.maps.StyledMapType(mapOptions.styles, {
            name: 'UM Style',
          });
          gmap.value.mapTypes.set('um_style', styled);
          gmap.value.setMapTypeId('um_style');
          // debug log removed
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('RideRouteMap StyledMapType apply failed (theme change):', e);
      }
    }
    // debug log removed
  },
  { immediate: true },
);

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
// Accept a variety of shapes for `realPolyline`:
// - encoded polyline string
// - object { encodedPolyline: string }
// - array of [lat,lng] pairs
// - array of { lat, lng } points
const finalPolyline = computed(() => {
  let raw: any = props.realPolyline ?? serverPolyline.value ?? null;
  if (!raw) {
    try {
      const gm: any = (globalThis as any).google;
      if (gm && gm.maps && typeof gm.maps.StyledMapType === 'function') {
        const styled = new gm.maps.StyledMapType(mapOptions.styles, { name: 'UM Style' });
        gmap.value.mapTypes.set('um_style', styled);
        gmap.value.setMapTypeId('um_style');
        // debug log removed
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('RideRouteMap StyledMapType apply failed (theme change):', e);
    }
    raw = raw.encodedPolyline;
  }

  let coords: { lat: number; lng: number }[] = [];
  if (typeof raw === 'string') {
    const decoded: any = polyLineCodec(raw);
    coords = decoded.map((p: any) => ({ lat: p[0], lng: p[1] }));
  } else if (Array.isArray(raw)) {
    const first = raw[0];
    if (Array.isArray(first) && typeof first[0] === 'number') {
      // [[lat, lng], ...]
      coords = raw.map((p: any) => ({ lat: p[0], lng: p[1] }));
    } else if (first && (first.lat !== undefined || first.latitude !== undefined)) {
      // [{lat, lng}, ...] or [{latitude, longitude}, ...]
      coords = raw
        .map((p: any) => {
          const lat =
            typeof p.lat === 'number'
              ? p.lat
              : p.latitude
                ? p.latitude
                : parseFloat(p.lat || p.latitude);
          const lng =
            typeof p.lng === 'number'
              ? p.lng
              : p.longitude
                ? p.longitude
                : parseFloat(p.lng || p.longitude);
          if (!isFinite(lat) || !isFinite(lng)) return null;
          return { lat, lng } as { lat: number; lng: number };
        })
        .filter(Boolean) as { lat: number; lng: number }[];
    }
  }

  return {
    path: coords,
    geodesic: true,
    strokeColor: '#000000',
    strokeOpacity: 1.0,
    strokeWeight: 5,
    zIndex: 9,
  };
});

const checkIconData =
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd);
const startIconData =
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStart);
const stopIconData =
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStop);

const canonicalCoords = computed(() => {
  const canonical = props.rideProgress?.canonicalPath;
  if (!Array.isArray(canonical)) return [];
  return canonical.map((p: any) => toLatLng(p)).filter((p: any) => Boolean(p)) as {
    lat: number;
    lng: number;
  }[];
});

const finishedLL = computed(() => toLatLng(props.rideProgress?.finishedLocation));

const stopsLL = computed(() => {
  if (!Array.isArray(props.stopsCoords)) return [];
  return (props.stopsCoords || [])
    .map((p: any) => toLatLng(p.coords))
    .filter(Boolean) as {
    lat: number;
    lng: number;
  }[];
});

// no client-side DirectionsRenderer in editor view
const originLL = computed(() => toLatLng(props.originCoords));
const destLL = computed(() => toLatLng(props.destinationCoords));
const center = computed(() => originLL.value ?? { lat: -15.7801, lng: -47.9292 });

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (!ready) return;
    gmap.value = mapRef.value?.map;
    // Ensure styles are applied on initial map creation too
    if (gmap.value && typeof gmap.value.setOptions === 'function') {
      // debug log removed
      gmap.value.setOptions({ styles: mapOptions.styles });
      try {
        const gm: any = (globalThis as any).google;
        if (gm && gm.maps && typeof gm.maps.StyledMapType === 'function') {
          const styled = new gm.maps.StyledMapType(mapOptions.styles, {
            name: 'UM Style',
          });
          gmap.value.mapTypes.set('um_style', styled);
          gmap.value.setMapTypeId('um_style');
          // debug log removed
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('RideRouteMap StyledMapType apply failed (map ready):', e);
      }
    }
    const path = finalPolyline.value.path || [];
    if (path.length >= 2) {
      //@ts-ignore
      const bounds = new google.maps.LatLngBounds();
      for (const p of path) {
        //@ts-ignore
        bounds.extend(new google.maps.LatLng(p.lat, p.lng));
      }
      gmap.value.fitBounds(bounds);
      return;
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
// No client-side route calculation in editor; map only renders server polyline.
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
      <!-- Origin / Stops / Destination markers -->
      <Marker
        v-if="originLL"
        :options="{ position: originLL, icon: startIconData, title: 'Embarque' }"
      />
      <Marker
        v-for="(stop, idx) in stopsLL"
        :key="'stop-' + idx"
        :options="{ position: stop, icon: stopIconData, title: 'Parada ' + (idx + 1) }"
      />
      <Marker
        v-if="destLL"
        :options="{ position: destLL, icon: checkIconData, title: 'Destino' }"
      />
      <!-- Prefer server-side canonicalPath (magenta) when available, fallback to driverPath -->
      <Polyline
        v-if="canonicalCoords.length >= 2"
        :options="{
          path: canonicalCoords,
          geodesic: true,
          strokeColor: '#f0f',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          zIndex: 10,
        }"
      />
      <Marker
        v-if="finishedLL"
        :options="{ position: finishedLL, icon: checkIconData, title: 'Finalizado' }"
      />
      <Polyline v-else :options="driverPath" />
    </GoogleMap>
  </section>
</template>
