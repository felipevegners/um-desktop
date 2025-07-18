<script setup lang="ts">
import DatePicker from '@/components/shared/DatePicker.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { getRideCalculationService, getRideRoutesService } from '@/server/services/rides';
import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
import {
  ArrowRight,
  Building,
  CalendarDays,
  CreditCard,
  LoaderCircle,
  Minus,
  Plus,
  SquareDot,
  SquareSquare,
  Users,
  Waypoints,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import FormSelect from '~/components/shared/FormSelect.vue';
import { currencyFormat, polyLineCodec } from '~/lib/utils';
import { useProductsStore } from '~/stores/products.store';
import { useRidesStore } from '~/stores/rides.store';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Backoffice - Novo Atendimento | Urban Mobi',
});

const ridesStore = useRidesStore();
const { createRideAction, loadingData } = ridesStore;

const productsStore = useProductsStore();
const { getProductsAction } = productsStore;
const { isLoading, products } = storeToRefs(productsStore);

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-square-icon lucide-square-square"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`;

onBeforeMount(async () => {
  await getProductsAction();
});

const form = useForm();
const { toast } = useToast();
const { data } = useAuth();
const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const selectedProduct = ref<any>();
const travelDate = ref<any>();
const selectedUser = ref<any>();
const showGenerateRide = ref<boolean>(false);
const enableRouteCalculation = ref<boolean>(true);
const ridePassengers = ref(1);
const enablePayment = ref<boolean>(false);
const viewCorpPaymentForm = ref<boolean>(false);

const showCorpPaymentForm = (value: any) => {
  console.log('-> ', value);
  viewCorpPaymentForm.value = !viewCorpPaymentForm.value;
};

const addPassengers = () => {
  ridePassengers.value++;
};

const removePassengers = () => {
  if (ridePassengers.value > 1) {
    ridePassengers.value--;
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

const setSelectedProduct = (value: any) => {
  selectedProduct.value = value;
  ridePassengers.value = 1;
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

    const distance = travelCalculation?.rows[0]?.elements[0]?.distance.value / 1000;
    const ridePrice = distance * parseFloat(selectedProduct?.value?.basePrice);

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

  enableRouteCalculation.value = false;
};

const onSubmit = form.handleSubmit(async (values) => {
  const ridePayload = {
    billing: {
      paymentMethod: 'credit-card',
      ammount: '0.00',
    },
    user: {
      id: values.user,
      name: selectedUser.value.name,
      email: selectedUser.value.email,
      phone: selectedUser.value.phone,
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
      passengers: ridePassengers,
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
    // navigateTo('/personal/rides/active');
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
    </section>
    <section>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <div class="space-y-6">
          <Card class="mb-6 bg-zinc-300">
            <CardHeader>
              <CardTitle>Dados da Viagem</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="md:grid md:grid-cols-2 gap-6">
                <!-- COLUNA DE DADOS -->
                <div class="flex flex-col gap-6">
                  <div
                    class="p-6 flex flex-col items-start gap-6 border border-zinc-900 rounded-md"
                  >
                    <div class="flex flex-col gap-6 w-full">
                      <div>
                        <LoaderCircle v-if="isLoading" class="animate-spin" />
                        <div v-else>
                          <label class="text-sm font-medium">
                            Selecione o Serviço UM*
                          </label>
                          <ul class="mt-2 flex justify-evenly gap-4 flex-wrap">
                            <li
                              class="w-full"
                              v-for="product in products"
                              :key="product.id"
                            >
                              <article
                                class="p-4 flex items-center justify-between gap-4 bg-white rounded-md border border-zinc-900"
                              >
                                <div
                                  class="font-normal uppercase flex items-center justify-start gap-2"
                                >
                                  <Checkbox
                                    @update:checked="setSelectedProduct(product)"
                                    :checked="selectedProduct?.id === product.id"
                                  />
                                  <div
                                    class="w-[50px] h-[50px] rounded-md bg-zinc-200 bg-cover bg-no-repeat bg-center relative flex items-center justify-center"
                                    :style="{
                                      backgroundImage: `url(${product.image?.url})`,
                                    }"
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
                                    <small class="ml-1 font-bold">
                                      {{ product?.capacity }}
                                    </small>
                                  </div>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger as-child class="hover:cursor-pointer">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="text-zinc-700 lucide lucide-circle-question-mark-icon lucide-circle-question-mark"
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <path d="M12 17h.01" />
                                      </svg>
                                    </TooltipTrigger>
                                    <TooltipContent class="bg-zinc-700 text-white">
                                      <p>{{ product.description }}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </article>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div v-if="selectedProduct" class="flex flex-col gap-6 items-start">
                        <div class="flex flex-col">
                          <label class="mb-2 text-sm font-medium">Data*</label>
                          <DatePicker v-model="travelDate" />
                        </div>
                        <div class="md:grid md:grid-cols-3 gap-6">
                          <FormField v-slot="{ componentField }" name="departTime">
                            <FormItem>
                              <FormLabel>Hora da Partida*</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  v-bind="componentField"
                                  v-maska="'##:##'"
                                />
                              </FormControl>
                            </FormItem>
                          </FormField>
                          <div v-if="selectedProduct">
                            <label class="text-sm font-medium leading-none">
                              Passageiros*
                            </label>
                            <div class="mt-2 flex items-center justify-start gap-3">
                              <Button type="button" @click="removePassengers">
                                <Minus :size="20" />
                              </Button>
                              <span
                                class="py-1.5 px-2 bg-white border border-zinc-950 rounded-md w-20 text-center"
                              >
                                {{ ridePassengers }}
                              </span>
                              <Button
                                v-if="
                                  selectedProduct.capacity &&
                                  ridePassengers !== selectedProduct.capacity
                                "
                                type="button"
                                @click="addPassengers"
                              >
                                <Plus :size="20" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <FormField v-slot="{ componentField, value }" name="origin">
                          <FormItem class="w-full">
                            <FormLabel>Origem*</FormLabel>
                            <FormControl>
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
                              <div class="flex flex-col items-start gap-2"></div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField, value }" name="destination">
                          <FormItem class="w-full">
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
                        <Button
                          type="button"
                          @click.prevent="getRideCalculation"
                          :disabled="enableRouteCalculation"
                          class="mt-4 p-6"
                        >
                          <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                          <Waypoints v-else />
                          Calcular Meu Trajeto
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div class="md:grid md:grid-cols-2 gap-6"></div>
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
                      <CardTitle class="mb-6">Rota e Dados do Atendimento</CardTitle>
                      <div class="p-6 bg-white rounded-md overflow-hidden">
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
                    </div>

                    <div v-if="showRenderedMap" class="mt-6 flex gap-4 w-full">
                      <div
                        class="p-6 flex-grow flex flex-col items-start justify-center text-center bg-white rounded-md shadow-md"
                      >
                        <small>Distância Total</small>
                        <p class="font-bold text-lg">
                          {{ calculatedTravel?.travelDistance || '0' }}
                        </p>
                      </div>
                      <div
                        class="p-6 flex-grow flex flex-col items-start justify-center text-center bg-white rounded-md shadow-md"
                      >
                        <small>Tempo Total</small>
                        <p class="font-bold text-lg">
                          {{ calculatedTravel?.travelTime || '0' }}
                        </p>
                      </div>
                      <div
                        class="p-6 flex-grow flex-col items-start justify-center text-center bg-white rounded-md shadow-md"
                      >
                        <small>Preço Estimado*</small>
                        <p class="font-bold text-lg">
                          {{ currencyFormat(calculatedTravel?.travelPrice || '0,00') }}
                        </p>
                      </div>
                      <div
                        class="p-6 flex-grow flex-col items-start justify-center text-center bg-white rounded-md shadow-md"
                      >
                        <small>Passageiros</small>
                        <p class="font-bold text-lg">
                          {{ ridePassengers }}
                        </p>
                      </div>
                    </div>
                    <div v-if="showRenderedMap" class="py-10">
                      <Button
                        type="button"
                        @click.prevent="
                          {
                            enablePayment = !enablePayment;
                            navigateTo('#payment');
                          }
                        "
                        class="p-6"
                      >
                        Realizar Pagamento
                        <ArrowRight />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card id="payment" v-if="!enablePayment" class="mb-6 bg-zinc-300">
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="lg:grid lg:grid-cols-2 gap-6">
                <div>
                  <h2 class="mb-6 text-lg font-medium">
                    Como deseja pagar seu agendamento?
                  </h2>
                  <ul class="space-y-2">
                    <li
                      class="py-4 px-3 bg-white rounded-md shadow-md flex items-center gap-4 w-full"
                    >
                      <FormField
                        v-slot="{ value, handleChange }"
                        type="checkbox"
                        name="pix"
                      >
                        <FormItem
                          class="flex flex-row items-center justify-center gap-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              :model-value="value"
                              @update:model-value="handleChange"
                            />
                          </FormControl>
                          <FormLabel class="!mt-0 flex items-center gap-x-3">
                            À vista (PIX)
                            <img
                              src="/images/logos/logo_pix.svg"
                              alt=""
                              class="!mt-0 w-20"
                            />
                          </FormLabel>
                        </FormItem>
                      </FormField>
                    </li>
                    <li
                      class="py-4 px-3 bg-white rounded-md shadow-md flex items-center gap-3 w-full"
                    >
                      <FormField
                        v-slot="{ value, handleChange }"
                        type="checkbox"
                        name="creditcard"
                      >
                        <FormItem class="flex flex-row items-center gap-x-3">
                          <FormControl>
                            <Checkbox
                              :model-value="value"
                              @update:model-value="handleChange"
                            />
                          </FormControl>
                          <FormLabel class="!mt-0 flex items-center gap-x-3">
                            <CreditCard :size="24" />
                            Cartão de Crédito
                            <img
                              src="/images/logos/mastercard.svg"
                              alt="mastercard"
                              class="w-10"
                            />
                            <img src="/images/logos/visa.svg" alt="visa" class="w-10" />
                            <img src="/images/logos/elo.svg" alt="elo" class="w-10" />
                            <img
                              src="/images/logos/hypercard.svg"
                              alt="hipercard"
                              class="w-10"
                            />
                          </FormLabel>
                        </FormItem>
                      </FormField>
                    </li>
                    <li
                      class="py-4 px-3 bg-white rounded-md shadow-md flex flex-col gap-3 w-full"
                    >
                      <FormField
                        v-slot="{ value, handleChange }"
                        type="checkbox"
                        name="creditcard"
                      >
                        <FormItem class="flex flex-row items-center gap-x-3">
                          <FormControl>
                            <Checkbox
                              :model-value="value"
                              @update:model-value="handleChange"
                              @update:checked="showCorpPaymentForm"
                            />
                          </FormControl>
                          <FormLabel class="!mt-0 flex items-center gap-x-3">
                            <Building :size="24" />
                            Pagamento Corporativo
                          </FormLabel>
                        </FormItem>
                      </FormField>
                      <div
                        v-show="viewCorpPaymentForm"
                        class="md:grid md:grid-cols-3 gap-6"
                      >
                        <FormField v-slot="{ componentField }" name="contract">
                          <FormItem>
                            <FormLabel>Empresa*</FormLabel>
                            <FormControl>
                              <FormSelect
                                v-bind="componentField"
                                :items="[]"
                                :label="'Selecione'"
                                @on-select="() => {}"
                              />
                            </FormControl>
                            <FormMessage class="text-xs" />
                          </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField }" name="branch">
                          <FormItem>
                            <FormLabel>Filial*</FormLabel>
                            <FormControl>
                              <FormSelect
                                v-bind="componentField"
                                :items="[]"
                                :label="'Selecione'"
                                @on-select="() => {}"
                              />
                            </FormControl>
                            <FormMessage class="text-xs" />
                          </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField }" name="area">
                          <FormItem>
                            <FormLabel>Centro de Custo*</FormLabel>
                            <FormControl>
                              <FormSelect
                                v-bind="componentField"
                                :items="[]"
                                :label="'Selecione'"
                                @on-select="() => {}"
                              />
                            </FormControl>
                            <FormMessage class="text-xs" />
                          </FormItem>
                        </FormField>
                      </div>
                    </li>
                  </ul>
                </div>
                <div>
                  <h2 class="mb-6 text-lg font-medium">Resumo</h2>
                  <div class="p-6 bg-white rounded-md space-y-6">
                    <div>
                      <small class="font-bold">Data e Hora</small>
                      <h2 class="font-bold text-2xl">
                        {{ df.format(travelDate?.toDate(getLocalTimeZone())) }}
                        -
                        {{ form.values.departTime }}
                      </h2>
                    </div>
                    <div>
                      <small class="font-bold">Origem</small>
                      <p>{{ originLocationDetails.address }}</p>
                    </div>
                    <div>
                      <small class="font-bold">Destino</small>
                      <p>{{ destinationLocationDetails.address }}</p>
                    </div>
                    <div>
                      <small class="font-bold">Serviço selecionado</small>
                      <p
                        class="px-2 py-1 uppercase text-white text-center rounded-md w-fit"
                        :class="`${selectedProduct?.type === 'contract' ? 'bg-zinc-800' : selectedProduct?.type === 'free-km' ? 'bg-orange-400' : 'bg-purple-400'}`"
                      >
                        {{ selectedProduct?.name }}
                      </p>
                    </div>
                    <div class="border-t border-zinc-900">
                      <small class="font-bold">Total</small>
                      <p class="font-bold text-2xl">
                        {{ currencyFormat(calculatedTravel?.travelPrice) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div v-if="showGenerateRide" class="mt-6 flex gap-4">
          <Button type="submit" class="p-6">
            <LoaderCircle v-if="loadingData" class="w-5 h-5 animate-spin" />
            Solicitar Atendimento
          </Button>
          <Button
            type="button"
            variant="ghost"
            class="p-6"
            @click="navigateTo('/admin/rides/open')"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
