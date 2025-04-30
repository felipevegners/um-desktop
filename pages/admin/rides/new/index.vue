<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { getRideCalculationService, getRideRoutesService } from '@/server/services/rides';
import { useContractsStore } from '@/stores/admin/contracts.store';
import {
  Calculator,
  CalendarDays,
  LoaderCircle,
  MapPin,
  MapPinCheck,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { polyLineCodec } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Novo Atendimento | Urban Mobi',
});

const contractsStore = useContractsStore();
const { getContractsAction, getContractByIdAction } = contractsStore;
const { contracts, contract, isLoading } = storeToRefs(contractsStore);

const selectedBranches = ref<any>([]);
const loadingBraches = ref<boolean>(false);
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const originCoords = ref<any>({
  lat: '',
  lng: '',
});
const originLocationDetails = ref<any>({
  address: '',
  url: '',
});
const destinationCoords = ref<any>({
  lat: '',
  lng: '',
});
const destinationLocationDetails = ref<any>({
  address: '',
  url: '',
});
const calculatedTravel = ref();
const routePolyLine = ref();
const loadingRoute = ref<boolean>(false);
const center = ref<any>({ lat: -23.0397942, lng: -47.0004508 });
const ridePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 5,
});
const markers = ref<any>([]);
const showRenderedMap = ref<boolean>(false);
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-square-icon lucide-square-square"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`;

onBeforeMount(async () => {
  await getContractsAction();
});

const sanitizeContracts = computed(() => {
  //@ts-ignore
  return contracts?.value.map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const getBranches = async (contractId: string) => {
  loadingBraches.value = true;
  try {
    await getContractByIdAction(contractId);
    setTimeout(() => {
      loadingBraches.value = false;
    }, 1000);
    selectedBranches.value = contract?.value.branches.map((branch: any) => {
      return {
        label: `${branch.branchCode} - ${branch.name}`,
        value: branch?.id,
      };
    });
  } catch (error) {
    console.log('Error -> ', error);
  }
};

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
  center.value = {
    lat: coords[centerCoord].lat,
    lng: coords[centerCoord].lng,
  };

  // Set the markers on the map
  markers.value = [
    {
      lat: coords[0].lat,
      lng: coords[0].lng,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStart),
    },
    {
      lat: coords[coords.length - 1].lat,
      lng: coords[coords.length - 1].lng,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd),
    },
  ];
};

const getRideCalculation = async () => {
  const rideData = {
    origins: originLocationDetails.value.address,
    destinations: destinationLocationDetails.value.address,
  };
  try {
    loadingRoute.value = true;
    const travelCalculation = await getRideCalculationService(rideData);
    calculatedTravel.value = travelCalculation;
    const routeCalculation: any = await getRideRoutesService(rideData);
    routePolyLine.value = routeCalculation[0].polyline.encodedPolyline;
  } catch (error) {
    console.error(error);
  } finally {
    decodePolyline(routePolyLine.value);
    loadingRoute.value = false;
    showRenderedMap.value = true;
  }
};

// // Set the location based on the place selected
const setOriginPlace = (place: any) => {
  originCoords.value.lat = place.geometry.location.lat();
  originCoords.value.lng = place.geometry.location.lng();
  // Update the location details
  originLocationDetails.value.address = place.formatted_address;
  originLocationDetails.value.url = place.url;
};
// // Set the location based on the place selected
const setDestinationPlace = (place: any) => {
  destinationCoords.value.lat = place.geometry.location.lat();
  destinationCoords.value.lng = place.geometry.location.lng();
  // Update the location details
  destinationLocationDetails.value.address = place.formatted_address;
  destinationLocationDetails.value.url = place.url;
};
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <CalendarDays />
        Gerar Novo Atendimento
      </h1>
    </section>
    <section>
      <Card class="py-6 bg-zinc-300">
        <!-- <CardHeader>
          <CardTitle>Dados do Atendimento</CardTitle>
        </CardHeader> -->
        <CardContent>
          <form @submit.prevent="" @keydown.enter.prevent="true">
            <div class="grid grid-cols-2 gap-6">
              <!-- COLUNA DE DADOS -->
              <div class="flex flex-col gap-6">
                <h3 class="mb-4 text-lg font-bold">1. Selecione o Contrato</h3>
                <FormField v-slot="{ componentField }" name="contract">
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="sanitizeContracts"
                        :label="'Selecione'"
                        @on-select="getBranches"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="branch">
                  <FormItem>
                    <FormLabel>Filial</FormLabel>
                    <FormControl>
                      <LoaderCircle v-if="isLoading" class="animate-spin" />
                      <FormSelect
                        v-else
                        v-bind="componentField"
                        :items="selectedBranches"
                        :label="'Selecione'"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="area">
                  <FormItem>
                    <FormLabel>Centro de Custo</FormLabel>
                    <FormControl>
                      <LoaderCircle v-if="isLoading" class="animate-spin" />
                      <FormSelect
                        v-else
                        v-bind="componentField"
                        :items="[]"
                        :label="'Selecione'"
                      />
                    </FormControl>
                  </FormItem>
                  <div class="p-6 flex flex-col gap-6 border border-zinc-900 rounded-md">
                    <h3 class="font-bold">Dados da Viagem</h3>
                    <FormField v-slot="{ componentField }" name="origin">
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <div class="flex items-center gap-2">
                            <MapPin />
                            <GMapAutocomplete
                              placeholder="Insira a Origem"
                              @place_changed="setOriginPlace"
                              v-bind="componentField"
                              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="destination">
                      <FormItem>
                        <FormLabel>Destino</FormLabel>
                        <FormControl>
                          <div class="flex items-center gap-2">
                            <MapPinCheck />
                            <GMapAutocomplete
                              placeholder="Insira o Destino"
                              @place_changed="setDestinationPlace"
                              v-bind="componentField"
                              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </div>
                </FormField>
                <Button type="button" @click.prevent="getRideCalculation">
                  <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                  <Calculator v-else />
                  Calcular Rota
                </Button>
              </div>
              <!-- COLUNA MAPA E ROTA -->
              <div class="flex items-center">
                <div
                  v-if="loadingRoute"
                  class="flex flex-col gap-6 items-center justify-center w-full"
                >
                  <LoaderCircle :size="60" class="animate-spin" />
                  <small>Calculando rota...</small>
                </div>
                <div v-else class="flex flex-col items-start w-full">
                  <GoogleMap
                    v-if="showRenderedMap"
                    :api-key="API_KEY"
                    style="width: 100%; height: 500px"
                    :center="center"
                    :zoom="15"
                  >
                    <Marker
                      v-for="marker in markers"
                      ref="markerRef"
                      :key="marker.id"
                      :options="{
                        position: {
                          lat: marker.lat,
                          lng: marker.lng,
                        },
                        icon: marker.icon,
                      }"
                      class="w-10 h-10"
                    />
                    <Polyline :options="ridePath" />
                  </GoogleMap>
                  <div v-if="calculatedTravel?.rows" class="mt-6 flex gap-4">
                    <div
                      class="p-6 flex flex-col items-start justify-center bg-white rounded-md"
                    >
                      <small>Distância Total</small>
                      <p class="font-bold">
                        {{ calculatedTravel?.rows[0]?.elements[0]?.distance.text }}
                      </p>
                    </div>
                    <div
                      class="p-6 flex-col items-start justify-center bg-white rounded-md"
                    >
                      <small>Tempo Total</small>
                      <p class="font-bold">
                        {{ calculatedTravel?.rows[0]?.elements[0]?.duration.text }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div></div>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
