<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { getRideCalculationService } from '@/server/services/rides';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { useContractsStore } from '@/stores/admin/contracts.store';
import {
  Calculator,
  CalendarDays,
  LoaderCircle,
  MapPin,
  MapPinCheck,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Novo Atendimento | Urban Mobi',
});

// const form = useForm();

const contractsStore = useContractsStore();
const { getContractsAction, getContractByIdAction } = contractsStore;
const { contracts, contract, isLoading } = storeToRefs(contractsStore);

const selectedBranches = ref<any>([]);
const loadingBraches = ref<boolean>(false);

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

const calculatedRoute = ref();
const loadingRoute = ref<boolean>(false);

const getRideCalculation = async () => {
  const rideData = {
    origins: originLocationDetails.value.address,
    destinations: destinationLocationDetails.value.address,
  };
  try {
    loadingRoute.value = true;
    const data = await getRideCalculationService(rideData);
    calculatedRoute.value = data;
  } catch (error) {
    console.error(error);
  } finally {
    loadingRoute.value = false;
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

// // Get users' current location
// const getUserLocation = () => {
//   // Check if geolocation is supported by the browser
//   const isSupported = 'navigator' in window && 'geolocation' in navigator;
//   if (isSupported) {
//     // Retrieve the user's current position
//     navigator.geolocation.getCurrentPosition((position) => {
//       coords.value.lat = position.coords.latitude;
//       coords.value.lng = position.coords.longitude;
//     });
//   }
// };

// const openMarker = (id: any) => {
//   openedMarkerID.value = id;
// };

const center = { lat: -23.0397942, lng: -47.0004508 };
const flightPlanCoordinates = [
  { lat: -23.0397942, lng: -47.0004508 },
  { lat: -23.03963623140005, lng: -47.001384208737186 },
];

const flightPath = {
  path: flightPlanCoordinates,
  geodesic: true,
  strokeColor: '#FF0000',
  strokeOpacity: 1.0,
  strokeWeight: 2,
};

const markers = ref<any>([]);

const onMapClick = (event: any) => {
  const { lat, lng } = event.latLng;
  markers.value.push({
    lat: lat(),
    lng: lng(),
  });
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
      <Card class="bg-zinc-300">
        <CardHeader>
          <CardTitle>Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="" @keydown.enter.prevent="true">
            <div class="grid grid-cols-2 gap-6">
              <div class="flex flex-col gap-6 md:max-w-[350px]">
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
                <Button type="button" @click.prevent="getRideCalculation">
                  <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                  <Calculator v-else />
                  Calcular Rota
                </Button>
              </div>
              <div>
                <GoogleMap
                  api-key=""
                  style="width: 100%; height: 500px"
                  :center="center"
                  :zoom="16"
                  @click="onMapClick"
                >
                  <!-- <Marker :options="markerOptions" /> -->
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
                  />
                  <Polyline :options="flightPath" />
                  <!-- <InfoWindow :options="{ position: center, content: 'Hello World!' }" /> -->
                </GoogleMap>
                <div class="mt-10">
                  <pre>{{ calculatedRoute }}</pre>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
