<script setup lang="ts">
import {
  CustomControl,
  GoogleMap,
  Marker,
  MarkerCluster,
  Polygon,
} from 'vue3-google-map';

interface coordI {
  lat: number;
  lng: number;
}

interface markerI {
  id: number;
  index: number;
  position: coordI;
  draggable: boolean;
  visible: boolean;
  icon: string;
}

interface polygonI {
  id: number;
  index: number;
  paths: coordI[] | [];
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  fillColor: string;
  fillOpacity: number;
  draggable: boolean;
}

type typeActivesT = 'marker' | 'polygon';

const env = useRuntimeConfig();
const customIconMarker = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
<path d="M30.6067 28.94L20 39.5467L9.39334 28.94C7.29557 26.8422 5.86698 24.1695 5.28821 21.2598C4.70945 18.3501 5.00651 15.3341 6.14183 12.5932C7.27715 9.85232 9.19974 7.50965 11.6665 5.86144C14.1332 4.21323 17.0333 3.3335 20 3.3335C22.9667 3.3335 25.8668 4.21323 28.3335 5.86144C30.8003 7.50965 32.7229 9.85232 33.8582 12.5932C34.9935 15.3341 35.2906 18.3501 34.7118 21.2598C34.133 24.1695 32.7044 26.8422 30.6067 28.94ZM20 25C21.7681 25 23.4638 24.2977 24.7141 23.0474C25.9643 21.7972 26.6667 20.1015 26.6667 18.3334C26.6667 16.5653 25.9643 14.8696 24.7141 13.6193C23.4638 12.3691 21.7681 11.6667 20 11.6667C18.2319 11.6667 16.5362 12.3691 15.286 13.6193C14.0357 14.8696 13.3333 16.5653 13.3333 18.3334C13.3333 20.1015 14.0357 21.7972 15.286 23.0474C16.5362 24.2977 18.2319 25 20 25ZM20 21.6667C19.116 21.6667 18.2681 21.3155 17.643 20.6904C17.0179 20.0653 16.6667 19.2174 16.6667 18.3334C16.6667 17.4493 17.0179 16.6015 17.643 15.9763C18.2681 15.3512 19.116 15 20 15C20.8841 15 21.7319 15.3512 22.357 15.9763C22.9822 16.6015 23.3333 17.4493 23.3333 18.3334C23.3333 19.2174 22.9822 20.0653 22.357 20.6904C21.7319 21.3155 20.8841 21.6667 20 21.6667Z" fill="#009EFF"/>
</svg>`;

const mapRef = useTemplateRef('mapRef');
const markerRef = useTemplateRef('markerRef');
const polygonRef = useTemplateRef('polygonRef');
const mapOptions = reactive({
  zoom: 20,
  maxZoom: 10,
  minZoom: 3,
  styles: [],
});

const typeActive = ref<typeActivesT>('marker');

const markers = ref<markerI[]>([]);
const polygons = ref<polygonI[]>([
  {
    id: 0,
    index: Date.now(),
    paths: [],
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    draggable: false,
  },
]);
const center = computed(() => ({ lat: -23.5449983, lng: -46.65893265 }));

const GMAPS_API_KEY = computed(() => env.public.GMAPS_API_KEY);

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (!ready) {
      return;
    }
    const gmap = mapRef?.value?.map;
    gmap.addListener('bounds_changed', handleBoundsChanged);
  },
);

function onMapClick(event: any) {
  const { lat, lng } = event.latLng;
  console.log('Map Event -> ', lat());
  if (typeActive.value === 'marker') {
    markers.value.push({
      id: markers.value.length,
      index: Date.now(),
      position: {
        lat: lat(),
        lng: lng(),
      },
      draggable: false,
      visible: true,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconMarker),
    });
    // console.log({
    //   lat: lat(),
    //   lng: lng(),
    // });
  } else {
    //@ts-expect-error
    polygons.value[0].paths.push({
      lat: lat(),
      lng: lng(),
    });
    polygons.value[0].index = Date.now();
  }
}

function clearMarkers() {
  markers.value = [];
}
function handleBoundsChanged() {
  const gmap = mapRef?.value?.map;
  const bounds = gmap.getBounds();

  if (bounds) {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // console.log('NorthEast:', ne.lat(), ne.lng());
    // console.log('SouthWest:', sw.lat(), sw.lng());
  }
}

function handlerMarker(id: number) {
  //@ts-expect-error
  const marker = markerRef.value.find((m) => m.marker.id === id);
  if (marker) {
    //@ts-expect-error
    markers.value[marker.marker.id].draggable =
      //@ts-expect-error
      !markers.value[marker?.marker?.id].draggable;
    //@ts-expect-error
    marker.marker.draggable = !marker.marker.draggable;
    //@ts-expect-error
    markers.value[marker.marker.id].index = Date.now();
  }
}

function handleMarkerDrag(id: number) {
  //@ts-expect-error
  const marker = markerRef?.value?.find((m) => m?.marker.id === id);
  if (marker) {
    //@ts-expect-error
    const { lat, lng } = marker?.marker?.position;
    updateMarker(id, lat(), lng());
    markers.value[id].index = Date.now();
    markers.value[id].index = Date.now();
  }
}

function updateMarker(id: number, lat: number, lng: number) {
  //@ts-expect-error
  const marker = markerRef.value.find((m) => m.marker.id === id);
  if (marker) {
    markers.value[id].position = { lat, lng };
    //@ts-expect-error
    marker.marker.position = { lat, lng };
    markers.value[id].index = Date.now();
  }
}

const sayHi = () => alert('Hi!');
</script>
<template>
  <section>
    <div>
      <button @click="clearMarkers">Clear Markers</button>
      <form>
        <div>
          <label for="contactChoice1">use marker</label>
          <input
            type="radio"
            id="contactChoice1"
            name="type"
            value="marker"
            v-model="typeActive"
          />
        </div>
        <div>
          <label for="contactChoice2">use polygon</label>
          <input
            type="radio"
            id="contactChoice2"
            name="type"
            value="polygon"
            v-model="typeActive"
          />
        </div>
      </form>
    </div>
    <GoogleMap
      ref="mapRef"
      :api-key="GMAPS_API_KEY"
      :options="mapOptions"
      :center="center"
      style="width: 100%; height: 100vh"
      :zoom="15"
      @click="onMapClick"
      :libraries="['places']"
    >
      <CustomControl position="BOTTOM_CENTER">
        <button class="custom-btn" @click="sayHi">👋</button>
      </CustomControl>
      <MarkerCluster>
        <Marker
          v-for="marker in markers"
          ref="markerRef"
          :key="marker.index"
          :options="marker"
          @dblclick="handlerMarker(marker.id)"
          @dragend="handleMarkerDrag(marker.id)"
        />
      </MarkerCluster>
      <Polygon
        v-for="polygon in polygons"
        ref="polygonRef"
        :key="polygon.index"
        :options="polygon"
      />
    </GoogleMap>
  </section>
</template>
