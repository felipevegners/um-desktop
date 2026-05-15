<script setup lang="ts">
import { cn } from '@/lib/utils';
import 'add-to-calendar-button';
import { Car, LoaderCircle, Map } from 'lucide-vue-next';
import { CustomMarker, GoogleMap, Marker, Polyline } from 'vue3-google-map';
import RideStatusFlag from '~/components/shared/RideStatusFlag.vue';
import { getFirstAndLastNameString, polyLineCodec } from '~/lib/utils';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;
const customDriverIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

useHead({
  title: 'Acompanhar Meu Atendimento | Urban Mobi',
});

definePageMeta({
  auth: false,
});

const route = useRoute();
// The driver app syncs location to the backend profile every 3 minutes.
// Polling faster than that only burns requests for no new data.
const DRIVER_LOCATION_SYNC_INTERVAL_MS = 3 * 60_000;
const TRACK_POLL_INTERVAL_MS = DRIVER_LOCATION_SYNC_INTERVAL_MS;
// 1s tick so both relative-location label and stop stopwatch stay precise
const RELATIVE_TIME_TICK_MS = 1_000;
const MARKER_MOVE_TRANSITION_MS = 1400;
const ridesStore = useRidesStore();
const { getRideByIdAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

const driverStore = useDriverStore();
const { getDriverByIdAction } = driverStore;
const { driver } = storeToRefs(driverStore);

const routePolyLine = ref();
const markers = ref<any>([]);
const center = ref<any>({ lat: 0, lng: 0 });
const initialZoom = ref(18);
const mapRef = ref<any>(null);
const ridePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 4,
});
const canonicalCoords = ref<any[]>([]);
const finishedLL = ref<any | null>(null);
const checkIconData =
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd);
const origin = ref<any>({});
const destination = ref<any>({});
const rideDriverId = ref<string>('');
const loadingDriverLocation = ref<boolean>(false);
const driverLocation = ref<any>({});
const intervalId = ref<any>(null);
const relativeTimeIntervalId = ref<any>(null);
const pollProgressKey = ref(0);
const driverName = ref<any>('');
const driverMarkerRef = ref<any>(null);
const driverPosition = ref<{ lat: number; lng: number } | null>(null);
const nowMs = ref<number>(Date.now());
const isRideTerminal = computed(() => {
  const status = String(ride?.value?.status || '');
  return status === 'completed' || status === 'cancelled';
});

const normalizeDriverSpeedKmh = (rawSpeed: unknown): number => {
  const raw = typeof rawSpeed === 'number' ? rawSpeed : Number(rawSpeed);
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  // Some historical payloads were double-converted (km/h * 3.6),
  // producing unrealistic values like 300+ km/h.
  if (raw > 220) {
    const corrected = raw / 3.6;
    return Math.round(Math.max(0, corrected));
  }

  return Math.round(raw);
};

const parseLocationTimestampMs = (rawTimestamp: unknown): number | null => {
  if (typeof rawTimestamp === 'number' && Number.isFinite(rawTimestamp))
    return rawTimestamp;
  if (typeof rawTimestamp === 'string') {
    const numeric = Number(rawTimestamp);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(rawTimestamp);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const formatRelativeLocationTime = (timestampMs: number | null): string => {
  if (!timestampMs) return 'Atualizado há --';

  const elapsedMs = Math.max(0, nowMs.value - timestampMs);
  const elapsedSec = Math.floor(elapsedMs / 1000);

  if (elapsedSec < 5) return 'Atualizado agora';
  if (elapsedSec < 60) return `Atualizado há ${elapsedSec}s`;

  const elapsedMin = Math.floor(elapsedSec / 60);
  if (elapsedMin < 60) return `Atualizado há ${elapsedMin}min`;

  const elapsedHours = Math.floor(elapsedMin / 60);
  return `Atualizado há ${elapsedHours}h`;
};

const animateDriverPosition = (target: { lat: number; lng: number }) => {
  if (!driverPosition.value) {
    // First render — set directly without animation
    driverPosition.value = target;
    return;
  }

  // Apply a CSS transition to the overlay container that vue3-google-map uses
  // to position the CustomMarker (it sets style.left / style.top on that element).
  // This produces smooth movement entirely in CSS — no RAF loop, no per-frame
  // Vue reactive updates. The transition is removed after completion so that
  // normal map pan / zoom movements are not inadvertently animated.
  const overlayContainer = driverMarkerRef.value?.$el?.parentElement as
    | HTMLElement
    | undefined;
  if (overlayContainer) {
    const transition = `left ${MARKER_MOVE_TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), top ${MARKER_MOVE_TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    overlayContainer.style.transition = transition;
    const cleanup = () => {
      overlayContainer.style.transition = '';
      overlayContainer.removeEventListener('transitionend', cleanup);
    };
    overlayContainer.addEventListener('transitionend', cleanup, { once: true });
  }

  // Single reactive update — Vue re-renders CustomMarker once,
  // the map overlay sets new left/top, CSS transition takes over.
  driverPosition.value = target;
};

const driverSpeedKmh = computed(() =>
  normalizeDriverSpeedKmh(driverLocation.value?.speed),
);
const driverLocationFreshness = computed(() =>
  formatRelativeLocationTime(driverLocation.value?.timestampMs ?? null),
);

// Active stop: last entry in progress.stops that has stopStart but no stopEnd
const activeStop = computed(() => {
  const stops = ride?.value?.progress?.stops as any[] | undefined;
  if (!Array.isArray(stops) || stops.length === 0) return null;
  const last = stops[stops.length - 1] as any;
  if (!last?.stopStart || last?.stopEnd) return null;
  return last;
});

const stopElapsedFormatted = computed(() => {
  if (!activeStop.value) return null;
  const startMs = parseLocationTimestampMs(activeStop.value.stopStart);
  if (startMs === null) return null;
  const totalSec = Math.max(0, Math.floor((nowMs.value - startMs) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
});

await getRideByIdAction(route?.query.rideId as string, { publicTrack: true });
origin.value = ride?.value?.travel.origin;
destination.value = ride?.value?.travel.destination;
rideDriverId.value = ride?.value.driver.id;

// Build canonical path and finished location from ride.progress when available
function updateCanonicalFromRide() {
  try {
    const canonicalRaw = ride?.value?.progress?.canonicalPath;
    if (Array.isArray(canonicalRaw) && canonicalRaw.length >= 1) {
      canonicalCoords.value = canonicalRaw
        .map((p: any) => {
          const lat =
            typeof p.lat === 'number'
              ? p.lat
              : typeof p.latitude === 'number'
                ? p.latitude
                : parseFloat(p.lat ?? p.latitude);
          const lng =
            typeof p.lng === 'number'
              ? p.lng
              : typeof p.longitude === 'number'
                ? p.longitude
                : parseFloat(p.lng ?? p.longitude);
          if (!isFinite(lat) || !isFinite(lng)) return null;
          return { lat, lng };
        })
        .filter(Boolean);
    } else {
      canonicalCoords.value = [];
    }

    const finished = ride?.value?.progress?.finishedLocation;
    if (finished) {
      const lat = typeof finished.lat === 'number' ? finished.lat : finished.latitude;
      const lng = typeof finished.lng === 'number' ? finished.lng : finished.longitude;
      if (isFinite(lat) && isFinite(lng)) finishedLL.value = { lat, lng };
      else finishedLL.value = null;
    } else {
      finishedLL.value = null;
    }
  } catch (e) {
    canonicalCoords.value = [];
    finishedLL.value = null;
  }
}

const fetchDriverLocation = async () => {
  if (!rideDriverId.value || isRideTerminal.value) {
    loadingDriverLocation.value = false;
    return;
  }

  loadingDriverLocation.value = true;
  try {
    await getDriverByIdAction(rideDriverId.value, { publicTrack: true });
    if (!driver.value) return;

    const lat = Number(driver?.value.location?.latitude);
    const lng = Number(driver?.value.location?.longitude);

    driverName.value = getFirstAndLastNameString(driver?.value.name);
    driverLocation.value = {
      timestampMs: parseLocationTimestampMs(driver?.value.location?.timestamp),
      speed: normalizeDriverSpeedKmh(driver?.value.location?.speed),
      lat,
      lng,
    };

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const target = { lat, lng };
      animateDriverPosition(target);
      center.value = target;
    }
  } finally {
    loadingDriverLocation.value = false;
  }
};

onMounted(() => {
  decodePolyline(
    ride?.value?.travel?.polyLineCoords ||
      ride?.value?.travel?.finalPolyline ||
      ride?.value?.travel?.polyline ||
      '',
  );
  routePolyLine.value =
    ride?.value?.travel?.polyLineCoords ||
    ride?.value?.travel?.finalPolyline ||
    ride?.value?.travel?.polyline ||
    '';
  updateCanonicalFromRide();

  if (!isRideTerminal.value) {
    fetchDriverLocation();
    pollProgressKey.value++;
  }

  relativeTimeIntervalId.value = setInterval(() => {
    nowMs.value = Date.now();
  }, RELATIVE_TIME_TICK_MS);

  intervalId.value = setInterval(async () => {
    await getRideByIdAction(route?.query.rideId as string, { publicTrack: true });
    rideDriverId.value = ride?.value?.driver?.id || '';
    updateCanonicalFromRide();

    if (isRideTerminal.value) {
      if (intervalId.value) {
        clearInterval(intervalId.value);
      }
      loadingDriverLocation.value = false;
      return;
    }

    await fetchDriverLocation();
    pollProgressKey.value++;
  }, TRACK_POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }

  if (relativeTimeIntervalId.value) {
    clearInterval(relativeTimeIntervalId.value);
  }
});

const driverSpeedConverted = computed(() => {
  return driverSpeedKmh.value;
});

// watch(
//   () => mapRef.value?.ready,
//   (ready) => {
//     if (ready) {
//       const map = mapRef.value.map;
//       //@ts-ignore
//       const bounds = new google.maps.LatLngBounds();
//       bounds.extend(
//         //@ts-ignore
//         new google.maps.LatLng(
//           driver?.value.location?.latitude,
//           driver?.value.location?.longitude,
//         ),
//       );
//       bounds.extend(
//         //@ts-ignore
//         new google.maps.LatLng(
//           driver?.value.location?.latitude,
//           driver?.value.location?.longitude,
//         ),
//       );

//       map.fitBounds(bounds);
//     }
//   },
// );

// Google Maps Area
const decodePolyline = (polyline: string) => {
  if (!polyline || typeof polyline !== 'string') {
    ridePath.value = {
      ...ridePath.value,
      path: [],
    };
    markers.value = [];
    return;
  }

  const decode: any = polyLineCodec(polyline);
  if (!Array.isArray(decode) || decode.length === 0) {
    ridePath.value = {
      ...ridePath.value,
      path: [],
    };
    markers.value = [];
    return;
  }

  const coords = decode.map((path: any) => ({
    lat: path[0],
    lng: path[1],
  }));

  // Set the coords to build the path
  ridePath.value = {
    ...ridePath.value,
    path: [...coords],
  };

  // Find the center of ride path to center the map
  const centerCoord = coords.length > 2 ? coords.length / 2 : coords.length;
  const parseCenterCoord = Math.floor(centerCoord) + 10;
  center.value = {
    lat: coords[parseCenterCoord].lat,
    lng: coords[parseCenterCoord].lng,
  };

  const stopsMarkers = ride?.value.travel.stops.map((stop: any, index: number) => {
    return {
      ...stop.coords,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStop),
      title: `Parada ${index + 1} de ${ride?.value.user.name}`,
    };
  });

  // Set the markers on the map
  markers.value = [
    {
      lat: coords[0].lat,
      lng: coords[0].lng,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStart),
      title: `Embarque de ${ride?.value.user.name}`,
    },
    ...stopsMarkers,
    {
      lat: coords[coords.length - 1].lat,
      lng: coords[coords.length - 1].lng,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd),
      title: `Desembarque de ${ride?.value.user.name}`,
    },
  ];
};
</script>
<template>
  <header class="p-6 bg-zinc-900 flex items-start justify-between">
    <div class="flex items-center gap-4">
      <div class="h-12 w-12">
        <img src="/images/um_symbol_negative.svg" alt="Logotipo UM" />
      </div>
      <div class="flex flex-col items-start">
        <small class="text-muted-foreground text-center uppercase text-xs">
          Atendimento
        </small>
        <h1 class="text-xl font-bold text-white">
          {{ ride?.code }}
        </h1>
      </div>
    </div>
    <RideStatusFlag :rideStatus="ride?.status" />
  </header>
  <section
    v-if="ride.status === 'accepted'"
    class="p-6 flex flex-col items-center justify-center bg-black h-20"
  >
    <h1 class="text-um-primary">Este atendimento ainda não iniciou!</h1>
    <h3 class="text-white">Previsão de início: {{ ride?.travel.departTime }}</h3>
  </section>
  <section v-if="loadingData" class="min-h-[300px] flex items-center justify-center">
    <LoaderCircle class="animate-spin" />
  </section>
  <section v-else>
    <SharedRideStepper :steps="ride?.progress.steps" v-if="ride.status !== 'accepted'" />
    <!-- Poll countdown bar: restarts on each fetch via key change -->
    <div
      v-if="ride.status !== 'accepted' && !isRideTerminal"
      class="h-1 w-full bg-zinc-200 overflow-hidden"
      aria-hidden="true"
    >
      <div
        :key="pollProgressKey"
        class="h-full bg-zinc-800 poll-countdown-bar"
        :style="{ '--poll-duration': TRACK_POLL_INTERVAL_MS + 'ms' }"
      />
    </div>
    <div v-if="ride.status !== 'accepted'" class="relative h-[600px]">
      <!-- Active stop floating badge -->
      <div
        v-if="activeStop"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white shadow-lg text-sm font-semibold pointer-events-none select-none"
      >
        <span class="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
        Em parada · {{ stopElapsedFormatted }}
      </div>
      <GoogleMap
        ref="mapRef"
        :api-key="API_KEY"
        style="width: 100%; height: 100%"
        :center="center"
        :zoom="initialZoom"
      >
        <Marker
          v-for="marker in markers"
          ref="markerRef"
          :key="marker.id"
          :options="{
            title: marker.title,
            position: {
              lat: marker.lat,
              lng: marker.lng,
            },
            icon: marker.icon,
          }"
          class="w-10 h-10"
        />
        <CustomMarker
          v-if="driverPosition"
          ref="driverMarkerRef"
          :options="{ position: driverPosition, anchorPoint: 'TOP_CENTER' }"
          class="top-[-10px]"
        >
          <div class="relative flex flex-col items-center">
            <p
              class="px-2 py-1 text-white rounded-md flex flex-row items-center gap-2 transition-all duration-300"
              :class="driverSpeedKmh <= 5 ? 'bg-amber-600' : 'bg-zinc-900'"
            >
              {{ driverName }} - {{ driverLocationFreshness }} - {{ driverSpeedKmh }} Km/h
              <span
                v-if="loadingDriverLocation"
                class="inline-block h-2 w-2 rounded-full bg-white/80 animate-pulse"
              />
            </p>
            <img
              :src="driver?.driverFiles?.picture?.url || '/images/no-avatar.png'"
              :class="
                cn(
                  'w-14 h-14 object-cover border-4 border-zinc-900 rounded-full relative',
                  driverSpeedConverted === 0 && 'border-amber-600',
                )
              "
            />
            <div
              :class="
                cn(
                  'absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent',
                  driver?.location && driverSpeedConverted > 5 && 'border-t-zinc-900',
                  driverSpeedConverted === 0 && 'border-t-amber-600',
                )
              "
            />
          </div>
        </CustomMarker>
        <!-- Prefer server-side canonicalPath when available -->
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
        <Polyline v-else-if="!isRideTerminal" :options="ridePath" />
      </GoogleMap>
    </div>
    <section class="p-4 bg-zinc-200">
      <div>
        <Car />
        <h2 class="mb-4 text-xl font-bold">Dados do Motorista</h2>
      </div>
      <div class="p-6 bg-white rounded-md col-span-2 space-y-2">
        <p class="text-sm text-zinc-600">Nome</p>
        <p class="text-xl font-bold">
          {{ driverName }}
        </p>
        <p class="text-sm text-zinc-600">Veículo</p>
        <div v-if="ride?.driver.hasCarSelected">
          <p class="text-xl font-bold">
            {{ ride?.driver?.selectedCar?.model }} -
            {{ ride?.driver?.selectedCar?.color }}
          </p>
          <span
            class="block w-fit my-2 px-1 pt-1 pb-0.5 bg-white font-mono font-bold text-xl uppercase border border-zinc-950 rounded-md"
          >
            {{ ride?.driver.selectedCar.plate }}
          </span>
        </div>
        <p v-else class="text-muted-foreground text-sm">-</p>
        <p class="text-sm text-zinc-600">Observações ao Motorista</p>
        <p v-if="ride?.observations" class="text-xl font-bold">
          {{ ride?.observations }}
        </p>
        <p v-else>Sem Observações</p>
      </div>
    </section>
    <section class="p-4 bg-zinc-200">
      <div>
        <Map />
        <h2 class="mb-4 text-xl font-bold">Dados do Atendimento</h2>
      </div>
      <div class="p-6 bg-white rounded-md col-span-2 space-y-2">
        <p class="text-sm text-zinc-600">Origem</p>
        <p class="text-xl font-bold">
          {{ ride?.travel.originAddress }}
        </p>
        <div v-if="ride?.travel.stops.length" class="py-2 border-y">
          <p class="text-sm text-zinc-600">Paradas</p>
          <p v-for="(stop, idx) in ride?.travel?.stops" class="text-base font-bold">
            {{ Number(idx) + 1 }} - {{ stop.address }}
          </p>
        </div>
        <p class="text-sm text-zinc-600">Destino</p>
        <p class="text-xl font-bold">{{ ride?.travel.destinationAddress }}</p>
      </div>
    </section>
  </section>
</template>

<style scoped>
@keyframes poll-countdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.poll-countdown-bar {
  animation: poll-countdown var(--poll-duration) linear forwards;
}
</style>
