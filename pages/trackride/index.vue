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
  strokeWeight: 5,
});
const origin = ref<any>({});
const destination = ref<any>({});
const rideDriverId = ref<string>('');
const loadingDriverLocation = ref<boolean>(false);
const driverLocation = ref<any>({});
const intervalId = ref<any>(null);
const driverName = ref<any>('');

await getRideByIdAction(route?.query.rideId as string);
origin.value = ride?.value?.travel.origin;
destination.value = ride?.value?.travel.destination;
rideDriverId.value = ride?.value.driver.id;

const fetchDriverLocation = async () => {
  loadingDriverLocation.value = true;
  await getDriverByIdAction(rideDriverId.value);
  if (driver.value) {
    driverName.value = getFirstAndLastNameString(driver?.value.name);
    const hour = new Date(driver?.value.location?.timestamp).getHours() || 0;
    const minutes = new Date(driver?.value.location?.timestamp).getMinutes() || 0;
    driverLocation.value = {
      time: `${hour}:${minutes < 10 ? '0' + minutes : minutes}`,
      speed: driver?.value.location?.speed,
      lat: driver?.value.location?.latitude,
      lng: driver?.value.location?.longitude,
    };

    center.value = {
      lat: driver?.value.location.latitude,
      lng: driver?.value.location.longitude,
    };
  }
  setTimeout(() => {
    loadingDriverLocation.value = false;
  }, 1000);
};

onMounted(() => {
  fetchDriverLocation();
  decodePolyline(ride?.value.travel.polyLineCoords);
  routePolyLine.value = ride?.value.travel.polyLineCoords;
  intervalId.value = setInterval(async () => {
    await fetchDriverLocation();
    await getRideByIdAction(route?.query.rideId as string);
  }, 30000);
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});

const driverSpeedConverted = computed(() => {
  return parseInt(driver?.value?.location?.speed);
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
  const decode: any = polyLineCodec(polyline);
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
  const parseCenterCoord = parseInt(centerCoord, 10) + 10; // parseInt if centerCoord is not divisivle by 2
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
    <div v-if="ride.status !== 'accepted'" class="h-[600px]">
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
          v-show="!loadingDriverLocation"
          :options="{ position: driverLocation, anchorPoint: 'TOP_CENTER' }"
          class="top-[-10px]"
        >
          <div class="relative flex flex-col items-center">
            <p
              class="px-2 py-1 text-white rounded-md flex flex-row items-center gap-3"
              :class="driver?.location?.speed <= 5 ? 'bg-amber-600' : 'bg-zinc-900'"
            >
              {{ driverName }} - {{ driverLocation.time }} -
              {{ driverLocation?.speed && driverLocation.speed + ' Km/h' }}
              <LoaderCircle
                v-if="loadingDriverLocation"
                :size="12"
                class="text-white animate-spin"
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
        <Polyline :options="ridePath" />
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

<style scoped></style>
