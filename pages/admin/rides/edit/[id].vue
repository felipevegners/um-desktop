<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import DatePicker from '@/components/shared/DatePicker.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useContractsStore } from '@/stores/contracts.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  CalendarDate,
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from '@internationalized/date';
import {
  CalendarDays,
  ConciergeBell,
  FastForward,
  Mail,
  Megaphone,
  OctagonX,
  Phone,
  Waypoints,
  X,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { map } from 'zod';
import FormButtons from '~/components/forms/FormButtons.vue';
import { currencyFormat, polyLineCodec } from '~/lib/utils';
import { useAccountStore } from '~/stores/account.store';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-square-icon lucide-square-square"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`;

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Editar Atendimento | Urban Mobi',
});

const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction } = ridesStore;
const { ride } = storeToRefs(ridesStore);

const accountStore = useAccountStore();
const { getUsersAccountsAction } = accountStore;
const { accounts } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

const driversStore = useDriverStore();
const { getDriversAction } = driversStore;
const { drivers } = storeToRefs(driversStore);

await getRideByIdAction(route?.params?.id as string);

const loadingSend = ref<boolean>(false);
const loadingProducts = ref<boolean>(false);
const loadingRoute = ref<boolean>(false);
const availableUsers = ref();
const showAvailableProducts = ref<boolean>(true);
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>();
const travelDate = ref<any>();
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

const routePolyLine = ref();
const markers = ref<any>([]);

const center = ref<any>({ lat: -23.0397942, lng: -47.0004508 });
const ridePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 5,
});

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

onMounted(() => {
  decodePolyline(ride?.value.travel.polyLineCoors);
  routePolyLine.value = ride?.value.travel.polyLineCoors;
});

onBeforeMount(async () => {
  await getUsersAccountsAction();
  const filteredUsers = accounts.value.filter(
    (user: any) => user.enabled === true && user.role !== 'admin',
  );
  availableUsers.value = filteredUsers.map((user: any) => {
    return {
      label: user.username,
      value: user.id,
    };
  });

  await getContractByIdAction(ride?.value.billing.contractId);
  availableProducts.value = contract?.value.products;
  selectedProduct.value = { id: ride?.value?.product?.id };
  const splitDate = ride?.value.travel.date.split('/').reverse();
  const dateNumbers = splitDate.map((str: string) => Number(str));
  travelDate.value = new CalendarDate(dateNumbers[0], dateNumbers[1], dateNumbers[2]);

  await getDriversAction();
});

const sanitizeDrivers = computed(() => {
  return drivers?.value.map((driver) => {
    return {
      label: driver.name,
      value: driver.id,
    };
  });
});

const setSelectedProduct = (value: any) => {
  selectedProduct.value = value;
};

// Set the location based on the place selected
const setOriginPlace = (place: any) => {
  originCoords.value.lat = place.geometry.location.lat();
  originCoords.value.lng = place.geometry.location.lng();
  // Update the location details
  originLocationDetails.value.address = place.formatted_address;
  originLocationDetails.value.url = place.url;
  form.setValues({
    origin: place.formatted_address,
  });
};
// Set the location based on the place selected
const setDestinationPlace = (place: any) => {
  destinationCoords.value.lat = place.geometry.location.lat();
  destinationCoords.value.lng = place.geometry.location.lng();
  // Update the location details
  destinationLocationDetails.value.address = place.formatted_address;
  destinationLocationDetails.value.url = place.url;
  form.setValues({
    destination: place.formatted_address,
  });
};

const form = useForm({
  validationSchema: '',
  keepValuesOnUnmount: true,
  initialValues: {
    user: ride?.value.user.id,
    reason: ride?.value.reason,
    passengers: ride?.value.travel.passengers,
    departTime: ride?.value.travel.departTime,
    origin: ride?.value.travel.originAddress,
    destination: ride?.value.travel.destinationAddress,
    driver: ride?.value.driver.id,
  },
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays class="w-6 h-6" />
        Editar Atendimento
      </h1>
      <div class="flex gap-10 items-center">
        <Button variant="destructive" @click="">
          <OctagonX />
          Cancelar Atendimento
        </Button>
      </div>
    </section>
    <form @submit.prevent="" @keydown.enter.prevent="true">
      <Card class="py-6 bg-zinc-200">
        <CardHeader>
          <CardTitle> Dados do Atendimento </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="md:grid md:grid-cols-2 gap-6">
            <!-- COLUNA DE DADOS -->
            <div class="flex flex-col gap-6">
              <span
                :class="`p-2 flex items-center justify-center rounded-md text-white text-sm uppercase w-fit  ${ride?.status === 'created' ? 'bg-blue-600' : 'bg-green-600'}`"
              >
                {{
                  ride?.status === 'created'
                    ? 'Agendado'
                    : ride?.status === 'accepted'
                      ? 'Aceito'
                      : 'Unknown'
                }}
              </span>
              <div
                class="p-6 grid grid-cols-2 gap-6 items-start border border-zinc-900 rounded-md"
              >
                <div class="p-4">
                  <span class="text-muted-foreground text-sm">Solicitante</span>
                  <h3 class="text-lg font-bold">{{ ride?.dispatcher.user }}</h3>
                  <span class="text-muted-foreground text-sm">Data</span>
                  <h3 class="text-lg font-bold">{{ ride?.dispatcher.dispatchDate }}</h3>
                </div>
                <div class="p-4 space-y-4">
                  <div>
                    <FormField v-slot="{ componentField, value }" name="driver">
                      <FormItem>
                        <FormLabel>Alterar Motorista</FormLabel>
                        <FormControl>
                          <FormSelect
                            v-bind="componentField"
                            :items="sanitizeDrivers"
                            :label="'Selecione'"
                          />
                        </FormControl>
                      </FormItem>
                    </FormField>
                    <Button v-if="!form.values.driver" class="mt-3 w-full">
                      <ConciergeBell class="w-5 h-5 mr-2" />
                      Acionar Motorista
                    </Button>
                  </div>
                </div>
                <div class="col-span-2 grid grid-cols-3 gap-3">
                  <div class="p-3 border border-zinc-400 bg-white rounded-md">
                    <span class="text-muted-foreground text-sm">Distância</span>
                    <h3 class="text-lg font-bold">{{ ride?.travel.distance }}</h3>
                  </div>
                  <div class="p-3 border border-zinc-400 bg-white rounded-md">
                    <span class="text-muted-foreground text-sm">Duração</span>
                    <h3 class="text-lg font-bold">{{ ride?.travel.duration }}</h3>
                  </div>
                  <div class="p-3 border border-zinc-400 bg-white rounded-md">
                    <span class="text-muted-foreground text-sm">Valor</span>
                    <h3 class="text-lg font-bold">
                      {{ currencyFormat(ride?.price) || '' }}
                    </h3>
                  </div>
                </div>
              </div>
              <div
                class="p-6 border border-zinc-900 rounded-md flex justify-between gap-6 items-center"
              >
                <div class="grow">
                  <FormField v-slot="{ componentField }" name="user">
                    <FormItem>
                      <FormLabel>Usuário:</FormLabel>
                      <FormControl>
                        <FormSelect
                          v-bind="componentField"
                          :items="availableUsers"
                          :label="'Selecione'"
                          @on-select=""
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
                <div class="mt-3">
                  <p class="flex items-center gap-2 text-sm font-bold">
                    <Phone :size="16" />{{ ride?.user.phone }}
                  </p>
                  <p class="flex items-center gap-2 text-sm font-bold">
                    <Mail :size="16" />{{ ride?.user.email }}
                  </p>
                </div>
              </div>
              <div v-if="showAvailableProducts">
                <LoaderCircle v-if="loadingProducts" class="animate-spin" />
                <div v-else>
                  <label class="text-sm font-medium">Produto Selecionado:</label>
                  <ul class="mt-2 flex justify-evenly gap-4">
                    <li
                      class="w-full"
                      v-for="product in availableProducts"
                      :key="product.id"
                    >
                      <article
                        class="p-4 flex items-center justify-start gap-4 bg-white rounded-md border border-zinc-900"
                      >
                        <Checkbox
                          @update:checked="setSelectedProduct(product)"
                          :checked="selectedProduct?.id === product.id"
                        />
                        <div
                          class="font-normal uppercase flex items-center justify-start gap-2"
                        >
                          <div
                            class="w-[50px] h-[50px] rounded-md bg-zinc-200 bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
                            :style="{ backgroundImage: `url(${product.image?.url})` }"
                          />
                          <small
                            class="px-2 py-1 uppercase text-white text-center rounded-md"
                            :class="`${product.type === 'contract' ? 'bg-zinc-800' : product.type === 'free-km' ? 'bg-orange-400' : 'bg-purple-400'}`"
                          >
                            {{ product.code }}
                          </small>
                          <small>{{ product.name }}</small>
                          <div class="flex items-center justify-start">
                            <Users :size="14" />
                            <small class="ml-1 font-bold">{{ product.capacity }}</small>
                          </div>
                        </div>
                      </article>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                v-if="selectedProduct"
                class="p-6 flex flex-col items-start gap-6 border border-zinc-900 rounded-md"
              >
                <CardTitle>Dados da Viagem</CardTitle>
                <div class="flex flex-col gap-6 w-full">
                  <div class="md:grid md:grid-cols-2 gap-6">
                    <FormField v-slot="{ componentField }" name="reason">
                      <FormItem>
                        <FormLabel>Motivo / Justificativa</FormLabel>
                        <FormControl>
                          <Input type="text" v-bind="componentField" />
                        </FormControl>
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="passengers">
                      <FormItem>
                        <FormLabel>Nº Passageiros*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            v-bind="componentField"
                            :max="selectedProduct.capacity"
                          />
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="flex flex-col">
                      <label class="mb-2 text-sm font-medium">Data*</label>
                      <DatePicker v-model="travelDate" />
                    </div>
                    <div class="flex items-end gap-4">
                      <FormField v-slot="{ componentField }" name="departTime">
                        <FormItem class="md:min-w-[200px]">
                          <FormLabel>Hora da Partida</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              v-bind="componentField"
                              v-maska="'##:##'"
                            />
                          </FormControl>
                        </FormItem>
                      </FormField>
                    </div>
                  </div>
                  <FormField v-slot="{ componentField, value }" name="origin">
                    <FormItem>
                      <FormLabel>Origem*</FormLabel>
                      <FormControl>
                        <div class="flex flex-col items-start gap-2">
                          <div class="flex items-center w-full gap-2">
                            <SquareDot />
                            <GMapAutocomplete
                              placeholder="Insira a Origem"
                              @place_changed="setOriginPlace"
                              v-bind="componentField"
                              :value="value"
                              id="originField"
                              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField, value }" name="destination">
                    <FormItem>
                      <FormLabel>Destino*</FormLabel>
                      <FormControl>
                        <div class="flex items-center gap-2">
                          <SquareSquare />
                          <GMapAutocomplete
                            placeholder="Insira o Destino"
                            @place_changed="setDestinationPlace"
                            v-bind="componentField"
                            :value="value"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
                <Button type="button" @click.prevent="">
                  <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                  <Waypoints v-else />
                  {{
                    form.values.origin !== ride.travel.originAddress ||
                    form.values.destination !== ride.travel.destinationAddress
                      ? 'Calcular Nova Rota'
                      : 'Calcular Rota'
                  }}
                </Button>
              </div>
            </div>
            <!-- COLUNA MAPA E ROTA -->
            <div class="flex flex-col items-start justify-start w-full">
              <div class="w-full">
                <CardTitle class="mb-6">Mapa e Rota</CardTitle>
                <GoogleMap
                  :api-key="API_KEY"
                  style="width: 100%; height: 600px"
                  :center="center"
                  :zoom="11.98"
                  :disable-default-ui="true"
                  :gesture-handling="'none'"
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FormButtons
        :cancel="'/admin/rides/open'"
        :loading="loadingSend"
        sbm-label="Salvar Atendimento"
        cnc-label="Cancelar"
      />
    </form>
  </main>
</template>

<style scoped></style>
