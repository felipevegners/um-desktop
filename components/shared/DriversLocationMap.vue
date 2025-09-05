<script setup lang="ts">
import { useDriversLocation } from '@/composables/drivers/useDriverLocations';
import { cn } from '@/lib/utils';
import { Map } from 'lucide-vue-next';
import { CustomMarker, GoogleMap } from 'vue3-google-map';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const center = ref<any>({ lat: -23.55012592233407, lng: -46.63425371400603 });
const markers = ref<any>([]);

const { getDriversLocation, driversWithLocation } = useDriversLocation();

const noAvatar = '/images/no-avatar.png';

const mapZoom = ref(1);
const mapRef = ref<any>(null);
const pointA = ref<any>();
const pointB = ref<any>();
const intervalId = ref<any>(null);
const isZoomInDriver = ref<boolean>(false);
const selectedDriverToFollow = ref<any>();

const generateDriverMarkers = () => {
  if (driversWithLocation.value.length) {
    pointA.value = driversWithLocation.value[0];
    pointB.value = driversWithLocation.value[driversWithLocation.value.length - 1];
    markers.value = driversWithLocation.value?.map((driver: any) => {
      return {
        id: driver.id,
        name: driver.name.split(' ')[0],
        picture: driver.picture ? driver.picture : noAvatar,
        lat: driver.lat,
        lng: driver.lng,
        speed: driver.active ? driver.speed : 0 || 30,
        active: driver.active,
      };
    });
  }

  if (!isZoomInDriver.value) {
    const map = mapRef.value.map;
    //@ts-ignore
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(
      //@ts-ignore
      new google.maps.LatLng(pointA.value.lat, pointA.value.lng),
    );
    bounds.extend(
      //@ts-ignore
      new google.maps.LatLng(pointB.value.lat, pointB.value.lng),
    );
    map.fitBounds(bounds);
  }

  if (isZoomInDriver.value) {
    const driverLocation = markers.value.filter(
      (driver: any) => driver.id === selectedDriverToFollow.value.id,
    );
    center.value = {
      lat: driverLocation[0].lat,
      lng: driverLocation[0].lng,
    };

    mapZoom.value = 18;
  }
};

const setMapCenterOnDriver = (driverData: any) => {
  selectedDriverToFollow.value = driverData;
  isZoomInDriver.value = true;
  mapZoom.value = 18;

  const { lat, lng } = driverData;
  center.value = {
    lat,
    lng,
  };

  calculateMapZoom(lat, lng);
};

const calculateMapZoom = (lat: number, lng: number) => {
  const map = mapRef.value.map;
  //@ts-ignore
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(
    //@ts-ignore
    new google.maps.LatLng(lat, lng),
  );
  map.fitBounds(bounds);
};

const fetchDriversLocations = () => {
  intervalId.value = setInterval(async () => {
    await getDriversLocation();
    generateDriverMarkers();
  }, 12000);
};

onBeforeMount(async () => {
  await getDriversLocation();
});

onMounted(() => {
  setTimeout(() => {
    generateDriverMarkers();
    fetchDriversLocations();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});

const custom = [
  {
    featureType: 'all',
    elementType: 'all',
    stylers: [
      {
        saturation: -70,
      },
    ],
  },

  {
    featureType: 'landscape.natural',
    elementType: 'fill',
    stylers: [
      {
        color: '#cccccc',
      },
    ],
  },

  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#bae6fd',
      },
    ],
  },
];
</script>
<template>
  <Card class="p-2 bg-zinc-200 bg-">
    <GoogleMap
      ref="mapRef"
      :api-key="API_KEY"
      style="width: 100%; height: 500px"
      :center="center"
      :zoom="mapZoom"
      :zoom-control="true"
      :scale-control="false"
      :map-type-control-options="false"
      :map-type-control="false"
      :fullscreen-control="false"
      :pan-control="false"
      :street-view-control="false"
      :rotate-control="false"
      :camera-control="false"
      :styles="custom"
    >
      <CustomMarker
        ref="markerRef"
        :key="marker.id"
        v-for="marker in markers"
        :options="{
          position: {
            lat: marker.lat,
            lng: marker.lng,
          },
        }"
      >
        <div
          class="relative flex flex-col items-center group"
          :class="!marker.active && 'opacity-70'"
          @click="setMapCenterOnDriver(marker)"
        >
          <p
            v-if="marker.active"
            class="opacity-0 px-2 py-1 text-white rounded-md group-hover:opacity-100 transition-opacity"
            :class="marker.speed === 0 ? 'bg-amber-500' : 'bg-zinc-900'"
          >
            {{ marker.name }} | {{ marker.speed }} Km/h
          </p>
          <p
            v-else
            class="opacity-0 px-2 py-1 bg-red-600 text-white rounded-md group-hover:opacity-100 transition-opacity"
          >
            {{ marker.name }} | Offline
          </p>
          <div
            :class="
              cn(
                'relative rounded-full w-12 h-12 border-4 bg-center bg-cover bg-no-repeat',
                marker.active && marker.speed > 1 && 'border-zinc-900',
                !marker.active && 'border-red-600',
                marker.active && marker.speed === 0 && 'border-amber-500',
              )
            "
            :style="{ backgroundImage: `url(${marker.picture})` }"
          />
          <div
            :class="
              cn(
                'absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent',
                marker.active && marker.speed > 1 && 'border-t-zinc-900',
                !marker.active && 'border-t-red-600',
                marker.active && marker.speed === 0 && 'border-t-amber-500',
              )
            "
          />
        </div>
      </CustomMarker>
    </GoogleMap>
  </Card>
</template>

<style scoped></style>
