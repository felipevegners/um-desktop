<script setup lang="ts">
import DatePicker from '@/components/shared/DatePicker.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { getRideCalculationService, getRideRoutesService } from '@/server/services/rides';
import { useAccountStore } from '@/stores/account.store';
import { useBranchesStore } from '@/stores/branches.store';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
import {
  CalendarDays,
  LoaderCircle,
  SquareDot,
  SquareSquare,
  Users,
  Waypoints,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { currencyFormat, getDate, polyLineCodec } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Backoffice - Novo Atendimento | Urban Mobi',
});

const contractsStore = useContractsStore();
const branchesStore = useBranchesStore();
const accountStore = useAccountStore();
const ridesStore = useRidesStore();
const productsStore = useProductsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);
const { getBranchByIdAction } = branchesStore;
const { branch } = storeToRefs(branchesStore);
const { getUsersAccountsAction } = accountStore;
const { accounts } = storeToRefs(accountStore);
const { createRideAction, getRidesAction, loadingData } = ridesStore;
const { rides } = storeToRefs(ridesStore);
const { getProductsAction } = productsStore;
const { products } = storeToRefs(productsStore);

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-square-icon lucide-square-square"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`;

const form = useForm();
const { toast } = useToast();
const { data } = useAuth();
const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const loadingProducts = ref<boolean>(false);
const showAvailableProducts = ref<boolean>(false);
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>();
const travelDate = ref<any>();
const availableUsers = ref<any>([]);
const selectedUser = ref<any>();
const noBranchAlert = ref<boolean>(false);
const showGenerateRide = ref<boolean>(false);

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

onBeforeMount(async () => {
  await getUsersAccountsAction();
  const filteredUsers = accounts.value.filter(
    (user: any) =>
      user.enabled === true && user.role !== 'admin' && user.role !== 'platform-driver',
  );
  availableUsers.value = filteredUsers.map((user: any) => {
    return {
      label: user.username,
      value: user.id,
    };
  });
});

const setSelectedProduct = (value: any) => {
  selectedProduct.value = value;
};

const setSelectedUser = async (value: string) => {
  noBranchAlert.value = false;
  const userData: any = accounts?.value.find((account: any) => account.id === value);
  selectedUser.value = {
    ...userData?.contract,
    name: userData.username,
    email: userData.email,
    phone: userData.phone,
  };
  if (userData?.contract.branchId !== '-') {
    await getBranchByIdAction(userData?.contract?.branchId);
  } else {
    // toast({
    //   title: 'Opss!',
    //   class: 'bg-red-500 border-0 text-white text-2xl',
    //   description: `O usuário selecionado não possui uma filial cadastrada.`,
    // });
    noBranchAlert.value = true;
  }

  try {
    showAvailableProducts.value = true;
    loadingProducts.value = true;
    if (userData?.contract?.contractId !== '-') {
      await getContractByIdAction(selectedUser.value.contractId);
      availableProducts.value = contract?.value.products;
    } else {
      await getProductsAction();
      availableProducts.value = products.value;
    }
    loadingProducts.value = false;
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Erro ao buscar os produtos do contrato. Tente novamente.`,
    });
    console.error('error -> ', error);
  }
};

const useBrachAddressOnOrigin = (value: any) => {
  const { address } = branch?.value;
  if (value === true) {
    originLocationDetails.value.address = `${address.streetName}, ${address.streetNumber} - ${address.neighborhood}, ${address.city}`;
    const field = window.document.getElementById('originField');
    field?.focus();

    form.setValues({
      origin: `${address.streetName}, ${address.streetNumber} - ${address.neighborhood}, ${address.city}`,
    });
  } else {
    form.setValues({
      origin: '',
    });
  }
};

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

const calculatedTravel = ref({
  travelDistance: '',
  travelTime: '',
  travelPrice: '',
  arrivalTime: '',
});

const getRideCalculation = async () => {
  const rideData = {
    origins: originLocationDetails.value.address,
    destinations: destinationLocationDetails.value.address,
  };
  try {
    loadingRoute.value = true;
    const travelCalculation = await getRideCalculationService(rideData);

    //Ride Price Calculation
    const duration = travelCalculation?.rows[0]?.elements[0]?.duration.value / 60;
    const basePrice = parseFloat(selectedProduct?.value.basePrice);
    const distance = travelCalculation?.rows[0]?.elements[0]?.distance.value / 1000;

    const ridePrice =
      basePrice +
      parseFloat(distance.toFixed(2)) * parseFloat(selectedProduct?.value.kmPrice) +
      duration * parseFloat(selectedProduct?.value.minutePrice);

    calculatedTravel.value.travelDistance =
      travelCalculation?.rows[0]?.elements[0]?.distance.text;
    calculatedTravel.value.travelTime =
      travelCalculation?.rows[0]?.elements[0]?.duration.text;
    calculatedTravel.value.travelPrice = ridePrice.toFixed(2).toString();

    const routeCalculation: any = await getRideRoutesService(rideData);
    routePolyLine.value = routeCalculation[0]?.polyline?.encodedPolyline;
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao calcular a rota. Tente novamente.`,
    });
    loadingRoute.value = false;
  } finally {
    decodePolyline(routePolyLine.value);
    loadingRoute.value = false;
    showRenderedMap.value = true;
    showGenerateRide.value = true;
  }
};

// // Set the location based on the place selected
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
// // Set the location based on the place selected
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

const generateRideCode = async () => {
  await getRidesAction();
  const ridesLength = rides?.value.length;
  const today = new Date();

  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

  return `UM-${day}${month}${year}${ridesLength + 1}`;
};

const onSubmit = form.handleSubmit(async (values) => {
  const ridePayload = {
    code: await generateRideCode(),
    billing: {
      contractId: selectedUser.value.contractId,
      area: selectedUser.value.area,
      branchId: selectedUser.value.branchId,
    },
    user: {
      id: values.user,
      name: selectedUser.value.name,
      email: selectedUser.value.email,
      phone: selectedUser.value.phone,
      companyName: selectedUser.value.name,
    },
    product: {
      id: selectedProduct.value.id,
      code: selectedProduct.value.code,
      name: selectedProduct.value.name,
      basePrice: selectedProduct.value.basePrice,
      kmPrice: selectedProduct.value.kmPrice,
      minutePrice: selectedProduct.value.minutePrice,
    },
    reason: values.reason,
    travel: {
      passengers: values.passengers,
      //@ts-ignore
      date: df.format(travelDate?.value?.toDate(getLocalTimeZone())) || '',
      departTime: values.departTime,
      originAddress: values.origin,
      origin: {
        lat: originCoords.value.lat,
        lng: originCoords.value.lng,
      },
      destinationAddress: values.destination,
      destination: {
        lat: destinationCoords.value.lat,
        lng: destinationCoords.value.lng,
      },
      distance: calculatedTravel.value.travelDistance,
      duration: calculatedTravel.value.travelTime,
      polyLineCoors: routePolyLine.value,
    },
    status: 'created',
    accepted: false,
    price: calculatedTravel.value.travelPrice,
    driver: {},
    observations: values.observations,
    dispatcher: {
      user: data?.value?.user?.name,
      email: data?.value?.user?.email,
      dispatchDate: new Date().toLocaleDateString('pt-BR').padStart(10, '0'),
    },
  };

  try {
    await createRideAction(ridePayload);
  } catch (error) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: `Ocorreu um erro ao criar o agendamento. Tente novamente.`,
    });
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Agendamento cadastrado com sucesso!`,
    });
    navigateTo('/admin/rides/open');
  }
});
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
      <Button @click="generateRideCode">Gerar codigo</Button>
    </section>
    <section>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-300">
          <CardHeader>
            <CardTitle>Dados do Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="md:grid md:grid-cols-2 gap-6">
              <!-- COLUNA DE DADOS -->
              <div class="flex flex-col gap-6">
                <div class="md:grid md:grid-cols-2 gap-6">
                  <FormField v-slot="{ componentField }" name="user">
                    <FormItem>
                      <FormLabel>Selecione o Usuário*</FormLabel>
                      <FormControl>
                        <FormSelect
                          v-bind="componentField"
                          :items="availableUsers"
                          :label="'Selecione'"
                          @on-select="setSelectedUser"
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
                <div v-if="showAvailableProducts">
                  <LoaderCircle v-if="loadingProducts" class="animate-spin" />
                  <div v-else>
                    <label class="text-sm font-medium">Selecione o Produto*</label>
                    <ul class="mt-2 flex gap-4 flex-wrap">
                      <li
                        class="flex-1"
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
                              class="w-[50px] h-[50px] rounded-md bg-zinc-200 bg-cover bg-no-repeat bg-center relative flex items-center justify-center"
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
                            <div
                              v-if="!noBranchAlert"
                              class="ml-8 flex items-center gap-2"
                            >
                              <Checkbox @update:checked="useBrachAddressOnOrigin" />
                              <small>Usar endereço da filial</small>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="destination">
                      <FormItem>
                        <FormLabel>Destino*</FormLabel>
                        <FormControl>
                          <div class="flex items-center gap-2">
                            <SquareSquare />
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
                  <Button type="button" @click.prevent="getRideCalculation">
                    <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                    <Waypoints v-else />
                    Calcular Rota
                  </Button>
                </div>
                <div v-if="selectedProduct" class="p-6 border border-zinc-900 rounded-md">
                  <FormField v-slot="{ componentField }" name="observations">
                    <FormItem>
                      <FormLabel>Instruções / Observações para o Motorista:</FormLabel>
                      <FormControl>
                        <Textarea class="resize-none bg-white" v-bind="componentField" />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>
              <!-- COLUNA MAPA E ROTA -->
              <div class="flex items-start justify-start">
                <div
                  v-if="loadingRoute"
                  class="flex flex-col gap-6 items-center justify-center w-full"
                >
                  <LoaderCircle :size="60" class="animate-spin" />
                  <small>Calculando rota...</small>
                </div>
                <div v-else class="flex flex-col items-start justify-start w-full">
                  <div v-if="showRenderedMap" class="w-full">
                    <CardTitle>Rota e Dados do Atendimento</CardTitle>
                    <GoogleMap
                      :api-key="API_KEY"
                      style="width: 100%; height: 600px"
                      :center="center"
                      :zoom="11"
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
                  <div v-if="showRenderedMap" class="mt-6 flex gap-4">
                    <div
                      class="p-6 flex flex-col items-start justify-center bg-white rounded-md"
                    >
                      <small>Distância Total</small>
                      <p class="font-bold">
                        {{ calculatedTravel?.travelDistance }}
                      </p>
                    </div>
                    <div
                      class="p-6 flex-col items-start justify-center bg-white rounded-md"
                    >
                      <small>Tempo Total</small>
                      <p class="font-bold">
                        {{ calculatedTravel?.travelTime }}
                      </p>
                    </div>
                    <div
                      class="p-6 flex-col items-start justify-center bg-white rounded-md"
                    >
                      <small>Preço Estimado*</small>
                      <p class="font-bold">
                        {{ currencyFormat(calculatedTravel?.travelPrice) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div v-if="showGenerateRide" class="mt-6 flex gap-4">
          <Button type="submit">
            <LoaderCircle v-if="loadingData" class="w-5 h-5 animate-spin" />
            Gerar Atendimento
          </Button>
          <Button type="button" variant="ghost" @click="navigateTo('/admin/rides/open')">
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
