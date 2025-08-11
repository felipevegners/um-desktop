<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  CalendarDate,
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from '@internationalized/date';
import {
  CalendarDays,
  Check,
  ConciergeBell,
  LoaderCircle,
  Mail,
  Phone,
  Plus,
  SquareCheck,
  SquareDot,
  SquareSquare,
  Trash,
  UserPen,
  Users,
  Waypoints,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import FormButtons from '~/components/forms/FormButtons.vue';
import { WPP_API } from '~/config/paths';
import { currencyFormat, polyLineCodec, sanitizePhone } from '~/lib/utils';
import { getRideCalculationService, getRideRoutesService } from '~/server/services/rides';
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

const { toast } = useToast();
const { data } = useAuth();
const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction, updateRideAction, setRideDriverAction } = ridesStore;
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

const productsStore = useProductsStore();
const { getProductsAction } = productsStore;
const { products } = storeToRefs(productsStore);
await getRideByIdAction(route?.params?.id as string);
await getProductsAction();

const editDriver = ref<boolean>(false);
const selectedDriver = ref<any>();
selectedDriver.value = ride?.value.driver;
const selectedUser = ref<any>();
const loadingSend = ref<boolean>(false);
const loadingProducts = ref<boolean>(false);
const loadingRoute = ref<boolean>(false);
const availableUsers = ref();
const showAvailableProducts = ref<boolean>(true);
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>(ride?.value.product);
const travelDate = ref<any>();
const showRenderedMap = ref<boolean>(false);
const showGenerateRide = ref<boolean>(false);
const showRouteRecalculation = ref<boolean>(false);
const showCancelationModal = ref<boolean>(false);
const loadingCancelAndDelete = ref<boolean>(false);
const showFinishModal = ref<boolean>(false);
const showWaypointsForm = ref<boolean>(false);

availableProducts.value = products?.value;
showWaypointsForm.value = ride?.value.travel.stops.length;

const originCoords = ref<any>({
  lat: '',
  lng: '',
});
const originLocationDetails = ref<any>({
  address: ride?.value.travel.originAddress,
  url: '',
});
const destinationCoords = ref<any>({
  lat: '',
  lng: '',
});
const destinationLocationDetails = ref<any>({
  address: ride?.value.travel.destinationAddress,
  url: '',
});

const waypointCoords = ref<any>({
  lat: '',
  lng: '',
});

const waypointLocationDetails = ref<any>([]);

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
    (user: any) =>
      user.enabled === true && user.role !== 'admin' && user.role !== 'platform-driver',
  );
  availableUsers.value = filteredUsers.map((user: any) => {
    return {
      label: user.username,
      value: user.id,
    };
  });

  selectedUser.value = filteredUsers.find((user: any) => user.id === ride?.value.user.id);

  if (ride?.value.billing.paymentData.contract !== '-') {
    await getContractByIdAction(ride?.value.billing.paymentData.contract);
    availableProducts.value = contract?.value.products;
    selectedProduct.value = ride?.value?.product;
  }

  const splitDate = ride?.value.travel.date.split('/').reverse();
  const dateNumbers = splitDate.map((str: string) => Number(str));
  travelDate.value = new CalendarDate(dateNumbers[0], dateNumbers[1], dateNumbers[2]);

  await getDriversAction();
});

const sanitizeDrivers = computed(() => {
  const availableDrivers = drivers?.value.filter(
    (driver: any) => driver.scheduleOpen === true,
  );
  return availableDrivers?.map((driver) => {
    return {
      label: driver.name,
      value: driver.id,
    };
  });
});

const calculatedTravel = ref({
  travelDistance: ride?.value.travel.distance,
  travelTime: ride?.value.travel.duration,
  travelPrice: ride?.value.price,
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

const setSelectedProduct = async (value: any) => {
  if (selectedProduct.value.id !== value.id) {
    selectedProduct.value = value;
    showRouteRecalculation.value = true;
    await getRideCalculation();
    showRouteRecalculation.value = false;
  }
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

waypointLocationDetails.value = ride?.value.travel.stops || [];

// const addWaypointRow = () => {
//   waypointLocationDetails.value.push({
//     address: '',
//   });
// };

// const removeWaypointRow = (index: number) => {
//   waypointLocationDetails.value.splice(index, 1);
// };

// // Set the waypoints of the ride
const setWaypoints = (place: any, index: any) => {
  console.log(waypointLocationDetails.value[index].address);
  waypointLocationDetails.value[index].address = place.formatted_address;
};

const setNewDriver = (driverId: string) => {
  const findDriver = drivers.value.find((driver) => driver.id === driverId);
  selectedDriver.value = findDriver;
};

const setNewUser = (userId: string) => {
  const newUser = accounts.value.find((user: any) => user.id === userId);
  selectedUser.value = newUser;
};

const contactDriver = async () => {
  await setRideDriverAction(ride?.value.id, selectedDriver.value);
  const message = `
  *Novo Atendimento - ${ride?.value?.code}*
  %0A*Passageiro*: ${ride?.value.user.name}
  %0A*Celular*: ${ride?.value.user.phone}
  %0A*Data/Hora*: ${ride?.value.travel.date} / ${ride?.value.travel.departTime}
  %0A------------------------------
  %0A*Dados da Viagem* 
  %0A%0A*Origem*: ${ride?.value.travel.originAddress}
${
  ride?.value.travel.stops.length
    ? ride?.value.travel.stops.map((stop: any, index: any) => {
        return `%0A%0A*Parada ${index + 1}*: ${stop.address}`;
      })
    : ''
}
  %0A%0A*Destino*: ${ride?.value.travel.destinationAddress}
  %0A%0A*Despachado por*: ${ride?.value.dispatcher.user} - ${ride?.value.dispatcher.email}`;
  const url =
    WPP_API.replace('[[phone]]', sanitizePhone(selectedDriver.value.phone as string)) +
    '&text=' +
    message;
  navigateTo(url, { external: true, open: { target: '_blank' } });
};

const toggleCancelationModal = () => {
  showCancelationModal.value = !showCancelationModal.value;
};

const toggleFinishModal = () => {
  showFinishModal.value = !showFinishModal.value;
};

const handleCancelRide = async () => {
  const payload = {
    ...ride?.value,
    status: 'cancelled',
  };
  try {
    loadingCancelAndDelete.value = true;
    await updateRideAction(payload);
    setTimeout(() => {
      loadingCancelAndDelete.value = false;
      showCancelationModal.value = false;
      navigateTo('/admin/rides/open');
    }, 1500);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao cancelar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  }
};
const handleFinishRide = async () => {
  const payload = {
    ...ride?.value,
    status: 'completed',
  };
  try {
    loadingCancelAndDelete.value = true;
    await updateRideAction(payload);
    setTimeout(() => {
      loadingCancelAndDelete.value = false;
      showCancelationModal.value = false;
      navigateTo('/admin/rides/open');
    }, 1500);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao cancelar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  }
};

const form = useForm({
  validationSchema: '',
  keepValuesOnUnmount: true,
  initialValues: {
    user: ride?.value.user.id,
    reason: ride?.value.reason,
    passengers: ride?.value.travel.passengers,
    departDate: ride?.value.travel.date,
    departTime: ride?.value.travel.departTime,
    origin: ride?.value.travel.originAddress,
    destination: ride?.value.travel.destinationAddress,
    driver: ride?.value.driver.id,
    observations: ride?.value.observations,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const ridePayload = {
    id: ride?.value.id,
    billing: {
      paymentMethod: ride?.value.billing.paymentMethod,
      paymentUrl: ride?.value.billing.paymentUrl,
      paymentData: {
        contract: selectedUser.value.contract.contractId || '-',
        branch: selectedUser.value.contract.branchId || '-',
        area: selectedUser.value.contract.area || '-',
      },
      ammount: calculatedTravel.value.travelPrice,
      status: ride?.value.billing.status,
      installments: ride?.value.billing.installments,
    },
    user: {
      id: selectedUser.value.id,
      name: selectedUser.value.username,
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
    reason: values.reason || '-',
    travel: {
      passengers: values.passengers,
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
      stops: waypointLocationDetails.value || [],
      distance: calculatedTravel.value.travelDistance,
      duration: calculatedTravel.value.travelTime,
      polyLineCoors: routePolyLine.value,
    },
    status: selectedDriver.value.name ? 'accepted' : ride?.value.status,
    accepted: selectedDriver.value.name ? true : false,
    price: calculatedTravel.value.travelPrice,
    driver: {
      id: selectedDriver.value.id,
      name: selectedDriver.value.name,
      phone: selectedDriver.value.phone,
      email: selectedDriver.value.email,
      hasCarSelected: false,
      selectedCar: {},
    },
    observations: values.observations,
    dispatcher: {
      user: data?.value?.user?.name,
      email: data?.value?.user?.email,
      dispatchDate: new Date().toLocaleDateString('pt-BR').padStart(10, '0'),
    },
  };
  try {
    await updateRideAction(ridePayload);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao editar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl hover:text-white',
      description: `Atendimento alterado com sucesso!`,
    });
    navigateTo('/admin/rides/open');
  }
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
        Editar Atendimento - #{{ ride?.code || '' }}
      </h1>
      <div class="flex gap-6 items-center">
        <Button @click="toggleFinishModal">
          <Check />
          FInalizar Atendimento
        </Button>
        <Button @click="toggleCancelationModal" variant="destructive">
          <X />
          Cancelar Atendimento
        </Button>
        <!-- <Button variant="destructive" @click="">
          <Trash />
          Excluir Atendimento
        </Button> -->
      </div>
    </section>
    <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
      <Card class="py-6 bg-zinc-200">
        <CardHeader>
          <CardTitle> Dados do Atendimento </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="md:grid md:grid-cols-2 gap-6">
            <!-- COLUNA DE DADOS -->
            <div class="flex flex-col gap-6">
              <div>
                <small class="text-xs text-muted-foreground">STATUS</small>
                <SharedRideStatusFlag :ride-status="ride?.status" />
              </div>
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
                        <FormLabel>Motorista Acionado</FormLabel>
                        <FormControl>
                          <FormSelect
                            v-bind="componentField"
                            :items="sanitizeDrivers"
                            :label="'Selecione'"
                            @on-select="setNewDriver"
                            :disabled="!editDriver"
                          />
                        </FormControl>
                      </FormItem>
                    </FormField>
                    <Button
                      v-if="!editDriver"
                      class="mt-3 w-full"
                      @click.prevent="editDriver = true"
                    >
                      <UserPen class="mr-2" />
                      Alterar Motorista
                    </Button>
                    <Button
                      v-if="editDriver"
                      class="mt-3 w-full bg-green-600 hover:bg-green-700"
                      :disabled="selectedDriver.id === ride.driver.id"
                      @click.prevent="contactDriver"
                    >
                      <ConciergeBell class="w-5 h-5 mr-2" />
                      Acionar Novo Motorista
                    </Button>
                  </div>
                </div>
                <div class="col-span-2 grid grid-cols-3 gap-3">
                  <div class="p-3 border border-zinc-400 bg-white rounded-md">
                    <span class="text-muted-foreground text-sm">Distância</span>
                    <h3 class="text-lg font-bold">
                      {{ calculatedTravel?.travelDistance }}
                    </h3>
                  </div>
                  <div class="p-3 border border-zinc-400 bg-white rounded-md">
                    <span class="text-muted-foreground text-sm">Duração</span>
                    <h3 class="text-lg font-bold">{{ calculatedTravel?.travelTime }}</h3>
                  </div>
                  <div class="p-3 border border-zinc-400 bg-white rounded-md">
                    <span class="text-muted-foreground text-sm">Valor</span>
                    <h3 class="text-lg font-bold">
                      {{ currencyFormat(calculatedTravel?.travelPrice) || '' }}
                    </h3>
                  </div>
                </div>
              </div>
              <div
                class="p-6 flex items-start justify-between bg-white border border-zinc-900 rounded-md"
              >
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">PAGAMENTO</small>
                  <SharedPaymentStatusFlag
                    :payment-status="ride?.billing.status"
                    :payment-url="ride?.billing.paymentUrl"
                  />
                </div>
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">MEIO DE PAGAMENTO</small>
                  <p class="text-center uppercase font-bold">
                    {{ ride?.billing.paymentMethod }}
                  </p>
                </div>
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">DATA DO PAGAMENTO</small>
                  <p class="text-center uppercase font-bold">
                    {{ ride?.billing.date }}
                  </p>
                </div>
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">PARCELAS</small>
                  <p class="text-center uppercase font-bold">
                    {{ ride?.billing.installments }}
                  </p>
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
                          @on-select="setNewUser"
                          :disabled="true"
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
                  <ul class="mt-2 flex flex-wrap gap-4">
                    <li class="flex-1" v-for="product in products" :key="product.id">
                      <article
                        class="p-4 flex items-center justify-start gap-4 bg-white rounded-md border"
                        :class="`${selectedProduct?.id === product.id ? 'border-2 border-zinc-900 bg-zinc-100' : 'border-zinc-300'}`"
                      >
                        <Checkbox
                          @update:checked="setSelectedProduct(product)"
                          :checked="selectedProduct?.id === product.id"
                          disabled
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
                    <SharedNewDatePicker :form="form" />
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
                            <Input type="text" v-bind="componentField" disabled />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <!-- Route Waypoints -->
                  <div class="flex flex-col items-start gap-4">
                    <div
                      v-if="ride?.travel.stops"
                      v-for="(waypoint, index) in waypointLocationDetails"
                      :key="index"
                      class="w-full px-4 pt-2 pb-4 border border-zinc-900 rounded-md"
                    >
                      <FormField name="waypoint">
                        <FormItem class="w-full">
                          <FormLabel class="mt-0">Parada {{ index + 1 }}</FormLabel>
                          <FormControl>
                            <div class="flex items-center gap-2">
                              <SquareSquare />
                              <Input type="text" v-model="waypoint.address" disabled />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </div>
                  </div>
                  <FormField v-slot="{ componentField, value }" name="destination">
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <div class="flex items-center gap-2">
                          <SquareCheck />
                          <Input type="text" v-bind="componentField" disabled />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <small> *Não é permitido alterar as rotas para este atendimento </small>
                </div>
                <!-- <Button
                  type="button"
                  @click.prevent="getRideCalculation"
                  :disabled="form.values.origin === ride?.travel.originAddress"
                >
                  <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                  <Waypoints v-else />
                  {{
                    form.values.origin !== ride?.travel.originAddress
                      ? 'Recalcular Rota'
                      : 'Calcular Rota'
                  }}
                </Button> -->
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
            <div class="flex flex-col items-start justify-start w-full">
              <div class="w-full">
                <CardTitle class="mb-6">Mapa e Rota</CardTitle>
                <GoogleMap
                  :api-key="API_KEY"
                  style="width: 100%; height: 600px"
                  :center="center"
                  :zoom="11.98"
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
  <Dialog :open="showRouteRecalculation">
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="text-center">Recalculando Rota</DialogTitle>
        <DialogDescription>
          <div class="py-8 flex flex-col gap-3 items-center">
            <LoaderCircle class="animate-spin text-zinc-900" :size="48" />
            <p class="text-xs">Calculando...</p>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter> </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog :open="showCancelationModal" @update:open="showCancelationModal = $event">
    <DialogContent class="space-y-4">
      <DialogHeader>
        <DialogTitle>Deseja Cancelar este Atendimento?</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        Essa ação irá cancelar o atendimento e notificar o usuário sobre o cancelamento.
      </DialogDescription>
      <DialogFooter>
        <div class="flex items-start justify-center gap-4 w-full">
          <Button type="button" variant="secondary" @click="toggleCancelationModal">
            Voltar
          </Button>
          <Button type="button" variant="destructive" @click="handleCancelRide">
            <LoaderCircle v-if="loadingCancelAndDelete" class="animate-spin" />
            Cancelar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog :open="showFinishModal" @update:open="showFinishModal = $event">
    <DialogContent class="space-y-4">
      <DialogHeader>
        <DialogTitle>Deseja Finalizar este Atendimento?</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        Essa ação irá finalizar o atendimento e notificar o usuário.
      </DialogDescription>
      <DialogFooter>
        <div class="flex items-start justify-center gap-4 w-full">
          <Button type="button" variant="secondary" @click="toggleFinishModal">
            Voltar
          </Button>
          <Button type="button" @click="handleFinishRide">
            <LoaderCircle v-if="loadingCancelAndDelete" class="animate-spin" />
            Finalizar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
