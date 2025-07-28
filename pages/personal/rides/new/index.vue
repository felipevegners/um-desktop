<script setup lang="ts">
import StripeCheckout from '@/components/payments/StripeCheckout.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import NewDatePicker from '@/components/shared/NewDatePicker.vue';
import ProductTag from '@/components/shared/ProductTag.vue';
import RenderIcon from '@/components/shared/RenderIcon.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { paymentMethods } from '@/config/paymentMethods';
import { getRideCalculationService, getRideRoutesService } from '@/server/services/rides';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import type { Product } from '@/types/products/types';
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date';
import { toTypedSchema } from '@vee-validate/zod';
import {
  CalendarPlus,
  LoaderCircle,
  Minus,
  Plus,
  SquareCheck,
  SquareDot,
  SquareSquare,
  Users,
  Waypoints,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import * as z from 'zod';
import {
  convertMetersToDistance,
  convertSecondsToTime,
  currencyFormat,
  polyLineCodec,
} from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Solicitar Novo Atendimento | Urban Mobi',
});

const ridesStore = useRidesStore();
const { createRideAction, getRidesAction, loadingData } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const productsStore = useProductsStore();
const { getProductsAction } = productsStore;
const { isLoading, products } = storeToRefs(productsStore);

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-square-icon lucide-square-square"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`;

const { toast } = useToast();
const { data } = useAuth();

const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const selectedProduct = ref<any>();
const travelDate = ref<any>();
const showGenerateRide = ref<boolean>(false);
const enableRouteCalculation = ref<boolean>(true);
const ridePassengers = ref(1);
const enablePayment = ref<boolean>(false);
const contractBranches = ref<any>();
const contractBranchAreas = ref<any>();
const contractBranchesList = ref<any>();
const loadingAreas = ref<boolean>(false);
const paymentMethod = ref<any>('');
const paymentStatus = ref<string>('unpaid');
const paymentMethodList = ref<any>();
const showWaypointsForm = ref<boolean>(false);
const availableProducts = ref<any>([]);

onBeforeMount(async () => {
  await getProductsAction();
  availableProducts.value = products.value.sort(
    (a: Product, b: Product) =>
      ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(a.name) -
      ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(b.name),
  );
});

const isCorpAccount = computed(() => {
  const corpRoles = [
    'master-manager',
    'branch-manager',
    'platform-admin',
    'platform-corp-user',
  ];
  //@ts-ignore
  const { role } = data?.value?.user;
  return corpRoles.includes(role);
});

onMounted(async () => {
  //@ts-ignore

  if (isCorpAccount.value) {
    //@ts-ignore
    await getContractByIdAction(data?.value?.user?.contract?.contractId);
    contractBranches.value = contract?.value.branches;
    contractBranchesList.value = contract?.value.branches.map((branch: any) => {
      return {
        label: `${branch.branchCode} - ${branch.name}`,
        value: branch.id,
      };
    });

    paymentMethodList.value = paymentMethods;
  } else {
    paymentMethodList.value = paymentMethods.filter(
      (method) => method.value !== 'corporative',
    );
  }
});

const getBranchAreas = (value: string) => {
  loadingAreas.value = true;
  const selectedBranch = contractBranches.value.find(
    (branch: any) => branch.id === value,
  );
  contractBranchAreas.value = selectedBranch.areas.map((area: any) => {
    return {
      label: `${area.areaCode} - ${area.areaName}`,
      value: area.areaCode,
    };
  });
  setTimeout(() => {
    loadingAreas.value = false;
  }, 500);
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

const waypointCoords = ref<any>({
  lat: '',
  lng: '',
});

const waypointLocationDetails = ref<any>([]);

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

const setSelectedProduct = async (value: any) => {
  const targetElement = document.getElementById('ride-info');
  if (targetElement) {
    setTimeout(() => {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }
  selectedProduct.value = value;
  ridePassengers.value = 1;
};

const setPaymentMethod = (value: any) => {
  paymentMethod.value = value;
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
    waypoints: [...waypointLocationDetails.value],
  };

  try {
    loadingRoute.value = true;

    const routeCalculation: any = await getRideRoutesService(rideData);
    // const {polyline, duration, distanceMeters} = routeCalculation[0]
    routePolyLine.value = routeCalculation[0]?.polyline?.encodedPolyline;
    const basePrice = parseFloat(selectedProduct?.value.basePrice);
    const sanitizeDurationResponse = routeCalculation[0].duration.replace('s', '');
    const duration = parseInt(sanitizeDurationResponse) / 60;
    const distance = routeCalculation[0].distanceMeters / 1000;

    const ridePrice =
      basePrice +
      parseFloat(distance.toFixed(2)) * parseFloat(selectedProduct?.value.kmPrice) +
      duration * parseFloat(selectedProduct?.value.minutePrice);

    calculatedTravel.value.travelDistance = convertMetersToDistance(
      routeCalculation[0].distanceMeters,
    );
    //@ts-ignore
    calculatedTravel.value.travelTime = convertSecondsToTime(duration);
    calculatedTravel.value.travelPrice = ridePrice.toFixed(2).toString();
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

    const targetElement = document.getElementById('ride-map');
    if (targetElement) {
      setTimeout(() => {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
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

const routeWaypoints = ref<any>([
  {
    address: '',
  },
]);

const addWaypointRow = () => {
  routeWaypoints.value.push({
    address: '',
  });
};

const removeWaypointRow = (index: number) => {
  routeWaypoints.value.splice(index, 1);
};

// // Set the waypoints of the ride
const setWaypoints = (place: any) => {
  waypointCoords.value.lat = place.geometry.location.lat();
  waypointCoords.value.lng = place.geometry.location.lng();

  const waypoint = { address: place.formatted_address };
  waypointLocationDetails.value.push(waypoint);
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

const userData = computed(() => {
  return {
    //@ts-ignore
    id: data.value?.user?.id,
    name: data.value?.user?.name,
    email: data.value?.user?.email,
    //@ts-ignore
    phone: data.value?.user?.phone,
  };
});

const generateRideCode = async () => {
  await getRidesAction();
  const ridesLength = rides?.value.length;
  const today = new Date();

  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

  return `UM-${day}${month}${year}${ridesLength + 1}`;
};

const dynamicSchema = computed(() => {
  const baseSchema = z.object({
    origin: z.string(),
    destination: z.string(),
    departTime: z.string(),
    departDate: z
      .string()
      .refine((v) => v, { message: 'A data do atendimento é obrigatória!' }),
    observations: z.string().optional(),
  });

  if (isCorpAccount.value) {
    return baseSchema.extend({
      reason: z.string().min(1).max(100),
      branch: z.string(),
      area: z.string(),
    });
  } else {
    return baseSchema.extend({
      reason: z.string().optional(),
      branch: z.string().optional(),
      area: z.string().optional(),
    });
  }
});

const newRideSchema = toTypedSchema(dynamicSchema.value);

const form = useForm({
  validationSchema: newRideSchema,
});

const showPaymentSection = async () => {
  enablePayment.value = true;
  const targetElement = document.getElementById('payment');
  targetElement?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });

  if (paymentMethod.value === 'corporative' && form.values.area && form.values.branch) {
    onSubmit();
  } else {
    form.setErrors({
      area: 'Obrigatório!',
      branch: 'Obrigatório!',
    });
  }
};

const onSubmit = form.handleSubmit(async (values) => {
  const ridePayload = {
    code: await generateRideCode(),
    billing: {
      paymentMethod: paymentMethod.value,
      paymentData: {
        branch: values?.branch || '-',
        area: values?.area || '-',
      },
      ammount: calculatedTravel.value.travelPrice,
      status: paymentMethod.value === 'corporative' ? 'invoice' : paymentStatus.value,
    },
    user: {
      id: userData.value.id,
      name: userData.value.name,
      email: userData.value.email,
      phone: userData.value.phone,
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
      passengers: ridePassengers.value,
      //@ts-ignore
      date: values.departDate,
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
      stops: waypointLocationDetails.value,
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
      description: `Ocorreu um erro ao criar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Atendimento cadastrado com sucesso!`,
    });
    navigateTo('/personal/rides/open');
  }
});

// Stripe payment handlers
const handlePaymentComplete = (paymentResult: any) => {
  // Update the payment method to reflect Stripe payment
  paymentMethod.value = 'creditcard';

  // Enable the ride generation
  showGenerateRide.value = true;
  paymentStatus.value = paymentResult.status === 'succeeded' ? 'paid' : 'pending';
  enablePayment.value = false;

  // Submit the form to generate new ride
  onSubmit();
};

const handlePaymentError = (error: string) => {
  toast({
    title: 'Erro no pagamento',
    description: error,
    variant: 'destructive',
  });
};
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-10 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <CalendarPlus :size="24" />
        Solicitar Atendimento
      </h1>
    </section>
    <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
      <!-- SERVICES -->
      <section id="service-select" class="mb-10">
        <Card class="bg-zinc-200">
          <CardContent>
            <CardTitle class="mt-6 mb-10 flex items-center gap-3 font-bold">
              <span
                class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
              >
                1
              </span>
              Selecione o Serviço UM
            </CardTitle>
            <div class="lg:max-w-lg">
              <LoaderCircle v-if="isLoading" class="animate-spin" :size="48" />
              <div v-else>
                <ul class="mt-2 flex justify-evenly gap-4 flex-wrap">
                  <li
                    class="w-full"
                    v-for="product in availableProducts"
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
                          class="w-[50px] h-[50px] rounded-md bg-zinc-200 bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
                          :style="{
                            backgroundImage: `url(${product.image?.url})`,
                          }"
                        />
                        <ProductTag :label="product.name" :type="product.name" />
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
          </CardContent>
        </Card>
      </section>
      <!-- FORM -->
      <section id="ride-info">
        <Card v-if="selectedProduct" class="mb-10 bg-zinc-200">
          <CardContent>
            <CardTitle class="mt-6 mb-10 flex items-center gap-3 font-bold">
              <span
                class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
              >
                2
              </span>
              Preencha os dados do Atendimento
            </CardTitle>
            <div class="lg:max-w-lg">
              <div class="grid grid-cols-2 gap-6">
                <NewDatePicker :form="form" />
                <FormField v-slot="{ componentField }" name="departTime">
                  <FormItem>
                    <FormLabel>Hora da Partida*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" v-maska="'##:##'" />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField name="passengers">
                  <FormItem>
                    <FormLabel>Passageiros*</FormLabel>
                    <FormControl>
                      <div class="mt-2 flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          @click="removePassengers"
                          :disabled="ridePassengers === 1"
                        >
                          <Minus :size="20" />
                        </Button>
                        <Input v-model="ridePassengers" class="text-center font-bold" />
                        <Button
                          type="button"
                          @click="addPassengers"
                          :disabled="ridePassengers === selectedProduct?.capacity"
                        >
                          <Plus :size="20" />
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-if="isCorpAccount" v-slot="{ componentField }" name="reason">
                  <FormItem class="col-span-2">
                    <FormLabel>Motivo / Justificativa*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormDescription>
                      Uso exclusivo e obrigatório para usuários corporativos
                    </FormDescription>
                  </FormItem>
                </FormField>
                <div class="space-y-6 col-span-2">
                  <FormField v-slot="{ componentField, value }" name="origin">
                    <FormItem>
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
                  <div class="flex flex-col items-start gap-4">
                    <Button
                      v-if="!showWaypointsForm"
                      type="button"
                      @click.prevent="showWaypointsForm = true"
                    >
                      <Waypoints />
                      Adicionar Paradas
                    </Button>
                    <div
                      v-if="showWaypointsForm"
                      v-for="(waypoint, index) in routeWaypoints"
                      :key="index"
                      class="w-full px-4 pt-2 pb-4 border border-zinc-900 rounded-md"
                    >
                      <FormField name="waypoint">
                        <FormItem class="w-full">
                          <FormLabel class="mt-0">Parada {{ index + 1 }}</FormLabel>
                          <FormControl>
                            <div class="flex items-center gap-2">
                              <SquareSquare />
                              <GMapAutocomplete
                                placeholder="Insira a parada"
                                @place_changed="setWaypoints"
                                v-model="waypoint.address"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <Button
                                type="button"
                                @click.prevent="removeWaypointRow(index)"
                                size="icon"
                              >
                                <X />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </div>
                    <Button
                      type="button"
                      v-if="showWaypointsForm"
                      @click.prevent="addWaypointRow"
                    >
                      <Plus />
                      Adicionar Parada
                    </Button>
                  </div>
                  <FormField v-slot="{ componentField }" name="destination">
                    <FormItem class="col-span-3">
                      <FormLabel>Destino*</FormLabel>
                      <FormControl>
                        <div class="flex items-center gap-2">
                          <SquareCheck />
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
                  <div class="p-4 border border-zinc-900 rounded-md col-span-3">
                    <FormField v-slot="{ componentField }" name="observations">
                      <FormItem>
                        <FormLabel>
                          Instruções / Observações para o Motorista:
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            class="resize-none bg-white"
                            v-bind="componentField"
                          />
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </div>
                </div>
                <!-- :disabled="enableRouteCalculation" -->
                <Button
                  type="button"
                  @click.prevent="getRideCalculation"
                  class="mb-4 p-6 col-span-2 uppercase"
                >
                  <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                  Calcular Rota
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="ride-map" class="mb-10">
        <Card v-if="showRenderedMap" class="bg-zinc-200">
          <CardContent>
            <CardTitle class="mt-6 mb-10 flex items-center gap-3 font-bold">
              <span
                class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
              >
                3
              </span>
              Rota e Resumo do Atendimento
            </CardTitle>
            <div
              v-if="loadingRoute"
              class="flex flex-col gap-6 items-center justify-center w-full h-full"
            >
              <LoaderCircle :size="60" class="animate-spin" />
              <small class="text-muted-foreground uppercase">Calculando rota</small>
            </div>
            <div v-else class="md:grid md:grid-cols-2 gap-10">
              <div class="p-2 rounded-md overflow-hidden">
                <GoogleMap
                  :api-key="API_KEY"
                  style="width: 100%; height: 700px"
                  :center="center"
                  :zoom="11"
                  :zoom-control="true"
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
              <div class="w-full space-y-6">
                <h3 class="text-lg font-bold">Resumo</h3>
                <div class="p-6 bg-white rounded-md space-y-6 border border-zinc-900">
                  <div>
                    <small class="font-bold">Data e Hora</small>
                    <h2 class="font-bold text-2xl">
                      {{ df.format(travelDate?.toDate(getLocalTimeZone())) }} -
                      {{ form.values.departTime }}
                    </h2>
                  </div>
                  <div>
                    <small class="font-bold">Origem</small>
                    <p>{{ originLocationDetails.address }}</p>
                  </div>
                  <div
                    v-if="waypointLocationDetails"
                    v-for="(waypoint, index) in waypointLocationDetails"
                  >
                    <small class="font-bold">Parada {{ index + 1 }}</small>
                    <p>{{ waypoint.address }}</p>
                  </div>
                  <div>
                    <small class="font-bold">Destino</small>
                    <p>{{ destinationLocationDetails.address }}</p>
                  </div>
                  <div class="flex flex-col gap-2">
                    <small class="font-bold">Serviço selecionado</small>
                    <div v-if="selectedProduct" class="flex items-center gap-4">
                      <div
                        class="w-[50px] h-[50px] rounded-md bg-zinc-200 bg-cover bg-no-repeat bg-center relative flex items-center justify-center"
                        :style="{
                          backgroundImage: `url(${selectedProduct?.image?.url})`,
                        }"
                      />
                      <ProductTag
                        :label="selectedProduct?.name"
                        :type="selectedProduct?.name"
                      />
                    </div>
                  </div>
                  <div class="border-t border-zinc-900">
                    <small class="font-bold">Total</small>
                    <p class="font-bold text-2xl">
                      {{ currencyFormat(calculatedTravel?.travelPrice) }}
                    </p>
                  </div>
                </div>
                <div>
                  <h2 class="mb-6 font-bold">Como deseja pagar seu atendimento?</h2>
                  <ul class="space-y-2">
                    <li
                      v-for="method in paymentMethodList"
                      :key="method.id"
                      class="py-4 px-3 bg-white rounded-md shadow-md flex flex-col items-start gap-4 w-full"
                    >
                      <div class="flex flex-row items-center gap-x-3">
                        <Checkbox
                          @update:checked="setPaymentMethod(method.value)"
                          :checked="paymentMethod.includes(method.value)"
                        />
                        <RenderIcon :name="method.icon" :size="24" />
                        <small>{{ method.label }}</small>
                        <img
                          v-for="logo in method.logo"
                          :src="logo"
                          alt=""
                          class="!mt-0 w-8"
                        />
                      </div>
                      <div
                        v-show="
                          method.value === 'corporative' &&
                          paymentMethod.includes(method.value)
                        "
                        class="md:grid md:grid-cols-2 gap-6 w-full"
                      >
                        <FormField v-slot="{ componentField }" name="branch">
                          <FormItem>
                            <FormLabel>Filial*</FormLabel>
                            <FormControl>
                              <FormSelect
                                v-bind="componentField"
                                :items="contractBranchesList"
                                label="Selecione"
                                @on-select="getBranchAreas"
                              />
                            </FormControl>
                            <FormMessage class="text-xs" />
                          </FormItem>
                        </FormField>
                        <div
                          v-if="loadingAreas"
                          class="flex items-center bg-white rounded-md"
                        >
                          <LoaderCircle class="animate-spin" :size="24" />
                        </div>
                        <FormField v-else v-slot="{ componentField }" name="area">
                          <FormItem>
                            <FormLabel>Centro de Custo*</FormLabel>
                            <FormControl>
                              <FormSelect
                                v-bind="componentField"
                                :items="contractBranchAreas"
                                label="Selecione"
                              />
                            </FormControl>
                            <FormMessage class="text-xs" />
                          </FormItem>
                        </FormField>
                      </div>
                    </li>
                  </ul>
                </div>
                <Button
                  v-if="paymentMethod && calculatedTravel.travelPrice"
                  type="button"
                  class="py-8 w-full uppercase"
                  @click.prevent="showPaymentSection"
                >
                  {{
                    paymentMethod === 'corporative'
                      ? 'Solicitar atendimento faturado'
                      : 'Efetuar pagamento'
                  }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog
        :open="paymentMethod === 'creditcard' && enablePayment"
        @update:open="enablePayment = $event"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle class="mb-6">Efetuar Pagamento</DialogTitle>
          </DialogHeader>
          <StripeCheckout
            :amount="calculatedTravel?.travelPrice || 1.0"
            currency="brl"
            :metadata="{ id: userData.id, name: userData.name }"
            @paymentComplete="handlePaymentComplete"
            @paymentError="handlePaymentError"
          />
          <!-- <DialogFooter>
            <DialogClose as-child>
              <Button variant="destructive">
                Custom Close
              </Button>
            </DialogClose>
          </DialogFooter> -->
        </DialogContent>
      </Dialog>
    </form>
  </main>
</template>
<style scoped></style>
