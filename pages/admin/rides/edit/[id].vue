<script setup lang="ts">
import FormButtons from '@/components/forms/FormButtons.vue';
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import PaymentStatusFlag from '@/components/shared/PaymentStatusFlag.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { WPP_API } from '@/config/paths';
import { deleteRideService } from '@/server/services/rides';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import { CalendarDate, DateFormatter } from '@internationalized/date';
import {
  Banknote,
  CalendarDays,
  CarFront,
  Check,
  LoaderCircle,
  Mail,
  Map,
  MessageCircleMore,
  MessageSquareWarning,
  Phone,
  SquareCheck,
  SquareDot,
  SquareSquare,
  Trash,
  User,
  UserPen,
  Users2,
  X,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import {
  convertMetersToDistance,
  convertSecondsToTime,
  currencyFormat,
  polyLineCodec,
  sanitizePhone,
  sanitizeRideDate,
} from '~/lib/utils';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

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
//@ts-ignore
const { user } = data.value;

const isAdmin = computed(() => {
  return user?.role === 'admin';
});

const route = useRoute();
const router = useRouter();
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
const loadingRoute = ref<boolean>(false);
const availableUsers = ref();
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>(ride?.value.product);
const travelDate = ref<any>();
const showRenderedMap = ref<boolean>(false);
const showGenerateRide = ref<boolean>(false);
const showRouteRecalculation = ref<boolean>(false);
const showCancelationModal = ref<boolean>(false);
const showDeleteConfirmationModal = ref<boolean>(false);
const loadingCancelAndDelete = ref<boolean>(false);
const showFinishModal = ref<boolean>(false);
const showWaypointsForm = ref<boolean>(false);
const loadingRemoveDriver = ref<boolean>(false);
const finalRideCalculation = ref<any>({});

availableProducts.value = products?.value;
showWaypointsForm.value = ride?.value.travel.stops.length;

const waypointLocationDetails = ref<any>([]);

const routePolyLine = ref();
const markers = ref<any>([]);

const center = ref<any>({ lat: 0, lng: 0 });
const initialZoom = ref(1);
const mapRef = ref<any>(null);

const ridePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 0.8,
  strokeWeight: 5,
  zIndex: 9,
});
const finalRidePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#33ffcc',
  strokeOpacity: 0.8,
  strokeWeight: 7,
  zIndex: 10,
});

const origin = ride?.value.travel.origin;
const destination = ride?.value.travel.destination;

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (ready) {
      const map = mapRef.value.map;
      //@ts-ignore
      const bounds = new google.maps.LatLngBounds();
      //@ts-ignore
      bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
      //@ts-ignore
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));

      map.fitBounds(bounds);
    }
  },
);

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

  const finalDecode = polyLineCodec(ride?.value.travel.finalPolyline);
  const finalCoords = finalDecode.map((path) => ({
    lat: path[0],
    lng: path[1],
  }));

  finalRidePath.value = {
    ...finalRidePath.value,
    path: [...finalCoords],
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

onMounted(() => {
  decodePolyline(ride?.value.travel.polyLineCoords);
  routePolyLine.value = ride?.value.travel.polyLineCoords;
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

waypointLocationDetails.value = ride?.value.travel.stops || [];

const setNewDriver = (driverId: string) => {
  const findDriver = drivers.value.find((driver) => driver.id === driverId);
  selectedDriver.value = findDriver;
};

const contactDriver = async () => {
  await setRideDriverAction(ride?.value.id, selectedDriver.value);
  await getRideByIdAction(route?.params?.id as string);
  editDriver.value = false;
  selectedDriver.value = ride?.value.driver;

  //   const message = `
  //   *Novo Atendimento - ${ride?.value?.code}*
  //   %0A*Passageiro*: ${ride?.value.user.name}
  //   %0A*Celular*: ${ride?.value.user.phone}
  //   %0A*Data/Hora*: ${ride?.value.travel.date} / ${ride?.value.travel.departTime}
  //   %0A------------------------------
  //   %0A*Dados da Viagem*
  //   %0A%0A*Origem*: ${ride?.value.travel.originAddress}
  // ${
  //   ride?.value.travel.stops.length
  //     ? ride?.value.travel.stops.map((stop: any, index: any) => {
  //         return `%0A%0A*Parada ${index + 1}*: ${stop.address}`;
  //       })
  //     : ''
  // }
  //   %0A%0A*Destino*: ${ride?.value.travel.destinationAddress}
  //   %0A%0A*Despachado por*: ${ride?.value.dispatcher.user} - ${ride?.value.dispatcher.email}`;
  //   const url =
  //     WPP_API.replace('[[phone]]', sanitizePhone(selectedDriver.value.phone as string)) +
  //     '&text=' +
  //     message;
  //   navigateTo(url, { external: true, open: { target: '_blank' } });
};

const handleRemoveRider = async () => {
  const payload = {
    ...ride?.value,
    status: 'created',
    driver: {},
  };
  try {
    loadingRemoveDriver.value = true;
    await updateRideAction(payload);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao remover o motorista. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingRemoveDriver.value = false;
    editDriver.value = false;
    await getRideByIdAction(route?.params?.id as string);
  }
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

const handleDeleteRide = async () => {
  try {
    loadingCancelAndDelete.value = true;
    await deleteRideService(ride?.value.id);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao deletar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    setTimeout(() => {
      loadingCancelAndDelete.value = false;
      showCancelationModal.value = false;
      navigateTo('/admin/rides/open');
    }, 1500);
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

onMounted(() => {
  if (ride?.value.status === 'completed') {
    handleCalculateFinalPrice();
  }
});

const handleCalculateFinalPrice = async () => {
  try {
    await $fetch('/api/rides-calculate', {
      method: 'POST',
      body: {
        ...ride?.value,
      },
    });
  } catch (error) {
    console.error('ERROR -> ', error);
  }
};

const onSubmit = form.handleSubmit(async (values) => {
  const ridePayload = {
    id: ride?.value.id,
    ...ride?.value,
    reason: values.reason || '-',
    travel: {
      ...ride?.value.travel,
      passengers: values.passengers,
      date: values.departDate,
      departTime: values.departTime,
    },
    status: selectedDriver.value.name ? 'pending' : ride?.value.status,
    driver: {
      id: selectedDriver.value.id,
      name: selectedDriver.value.name,
      phone: selectedDriver.value.phone,
      email: selectedDriver.value.email,
      hasCarSelected: false,
      selectedCar: {},
    },
    observations: values.observations,
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
      <div class="flex items-center justify-center gap-4">
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <CalendarDays class="w-6 h-6" />
          Editar Atendimento - #{{ ride?.code || '' }}
        </h1>
      </div>
      <div class="flex gap-6 items-center">
        <Button @click="toggleFinishModal">
          <Check />
          FInalizar
        </Button>
        <Button @click="toggleCancelationModal" variant="secondary">
          <X />
          Cancelar
        </Button>
        <Button
          v-if="isAdmin"
          variant="destructive"
          @click="showDeleteConfirmationModal = true"
        >
          <Trash />
          Excluir
        </Button>
      </div>
    </section>
    <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
      <Card class="p-0 bg-zinc-200">
        <CardContent class="p-4">
          <div class="p-4 flex flex-col gap-4 border border-zinc-300 rounded-md">
            <!-- RIDE -->
            <div class="grid grid-cols-2 gap-6 items-start">
              <div class="col-span-2 flex items-start justify-between gap-4">
                <div class="flex items-center gap-2">
                  <Map />
                  <h3 class="text-sm font-bold">Dados do atendimento</h3>
                </div>
                <RideStatusFlag :ride-status="ride?.status" />
              </div>

              <div class="col-span-2 grid grid-cols-4 gap-3">
                <div
                  class="col-span-2 row-span-4 p-4 bg-white rounded-md w-full overflow-hidden"
                >
                  <GoogleMap
                    ref="mapRef"
                    :api-key="API_KEY"
                    style="width: 100%; height: 450px"
                    :center="center"
                    :zoom="initialZoom"
                    :zoom-control="true"
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
                    <Polyline :options="ridePath" />
                    <Polyline :options="finalRidePath" />
                  </GoogleMap>
                </div>
                <div class="p-3 border border-zinc-400 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Data do embarque</span>
                  <h3 class="text-lg font-bold">
                    {{ sanitizeRideDate(ride?.travel.date) }}
                  </h3>
                </div>
                <div class="p-3 border border-zinc-400 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Hora do embarque</span>
                  <h3 class="text-lg font-bold">
                    {{ ride?.travel.departTime }}
                  </h3>
                </div>
                <div class="p-3 border border-zinc-400 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Distância estimada</span>
                  <h3 class="text-lg font-bold">
                    {{ convertMetersToDistance(ride?.travel.estimatedDistance) }}
                  </h3>
                </div>
                <div class="p-3 border border-zinc-400 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Duração estimada</span>
                  <h3 class="text-lg font-bold">
                    {{ convertSecondsToTime(ride?.travel.estimatedDuration) }}
                  </h3>
                </div>
                <div class="p-3 border border-zinc-400 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Valor estimado</span>
                  <h3 class="text-lg font-bold">
                    {{ currencyFormat(ride?.estimatedPrice) }}
                  </h3>
                </div>
                <div
                  class="p-3 flex flex-col items-start gap-2 border border-zinc-400 bg-white rounded-md"
                >
                  <span class="text-muted-foreground text-sm">Serviço</span>
                  <div class="flex items-center gap-2">
                    <SharedProductTag
                      :label="ride?.product.name"
                      :type="ride?.product.name"
                    />
                    <small>{{ ride?.product.code }}</small>
                  </div>
                </div>
                <div
                  class="p-3 flex flex-col items-start gap-2 border border-zinc-400 bg-white rounded-md"
                >
                  <span class="text-muted-foreground text-sm">Passageiros</span>
                  <div class="flex items-center gap-2">
                    <Users2 :size="16" />
                    <p class="font-bold text-lg">{{ ride?.travel.passengers }}</p>
                  </div>
                </div>
                <div
                  class="p-3 flex flex-col items-start gap-2 border border-zinc-400 bg-white rounded-md"
                >
                  <span class="text-muted-foreground text-sm">Solicitante</span>
                  <div class="flex flex-col items-start">
                    <p class="font-bold">{{ ride?.dispatcher.user }}</p>
                    <small>em: {{ ride?.dispatcher.dispatchDate }}</small>
                  </div>
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 border border-zinc-400 bg-white rounded-md"
                >
                  <div class="flex items-center gap-2">
                    <SquareDot :size="16" />
                    <span class="text-muted-foreground text-sm">Origem</span>
                  </div>
                  <p class="font-bold text-lg">{{ ride?.travel.originAddress }}</p>
                </div>
                <div
                  v-if="ride?.travel.stops.length > 0"
                  class="col-span-4 p-3 flex flex-col items-start gap-2 border border-zinc-400 bg-white rounded-md"
                >
                  <div v-for="(stop, index) in ride?.travel.stops" :key="index">
                    <div class="flex items-center gap-2">
                      <SquareSquare :size="16" />
                      <span class="text-muted-foreground text-sm">
                        Parada {{ index + 1 }}
                      </span>
                    </div>
                    <p class="font-bold text-lg">{{ stop.address }}</p>
                  </div>
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 border border-zinc-400 bg-white rounded-md"
                >
                  <div class="flex items-center gap-2">
                    <SquareCheck :size="16" />
                    <span class="text-muted-foreground text-sm">Destino</span>
                  </div>
                  <p class="font-bold text-lg">{{ ride?.travel.destinationAddress }}</p>
                </div>
              </div>
            </div>
            <!-- USER -->
            <div
              class="p-6 flex flex-col gap-6 bg-white border border-zinc-900 rounded-md"
            >
              <div class="flex items-center gap-2">
                <User />
                <div>
                  <h3 class="text-sm font-bold">Dados do usuário</h3>
                </div>
              </div>
              <div class="space-y-2">
                <h2 class="font-bold text-lg">{{ ride?.user.name }}</h2>
                <p class="flex items-center gap-2 text-sm">
                  <Phone :size="16" />
                  <a
                    :href="
                      WPP_API.replace(
                        '[[phone]]',
                        sanitizePhone(ride?.user.phone as string),
                      )
                    "
                    class="flex items-center gap-2"
                    target="_blank"
                  >
                    {{ ride?.user.phone }}
                    <MessageCircleMore :size="18" class="text-green-500" />
                  </a>
                </p>
                <p class="flex items-center gap-2 text-sm">
                  <Mail :size="16" />{{ ride?.user.email }}
                </p>
              </div>
            </div>
            <!-- DRIVER  -->
            <div
              class="p-6 grid grid-cols-2 gap-6 items-start bg-white border border-zinc-900 rounded-md"
            >
              <div class="flex items-start gap-4">
                <CarFront />
                <div>
                  <h3 class="mb-6 text-sm font-bold">Dados do Motorista</h3>
                  <h2 class="font-bold text-lg">
                    {{ ride?.driver.name || 'Sem motorista' }}
                  </h2>
                  <div
                    v-if="!ride?.accepted && ride?.driver.name"
                    class="my-4 p-2 flex items-center gap-2 rounded-md bg-red-100 text-red-600 text-sm"
                  >
                    <MessageSquareWarning />
                    <span>
                      {{ ride?.driver.name }} ainda não aceitou este atendimento.
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex flex-col items-start justify-center gap-6 h-full">
                <div v-if="editDriver" class="w-full justify-self-center">
                  <FormField v-slot="{ componentField, value }" name="driver">
                    <FormItem class="w-full">
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
                  <div class="space-x-2">
                    <Button
                      class="mt-3 bg-green-800 hover:bg-green-700"
                      :disabled="selectedDriver.id === ride?.driver.id"
                      @click.prevent="contactDriver"
                    >
                      Acionar
                    </Button>
                    <Button variant="ghost" @click.prevent="editDriver = false">
                      Cancelar
                    </Button>
                  </div>
                </div>
                <div v-else class="flex gap-2 self-end">
                  <Button @click.prevent="editDriver = true">
                    <UserPen />
                    {{ !ride?.driver.name ? 'Acionar' : 'Alterar' }}
                  </Button>
                  <Button
                    v-if="ride?.driver.name"
                    @click.prevent="handleRemoveRider"
                    variant="destructive"
                  >
                    <X />
                    Remover
                  </Button>
                </div>
              </div>
              <div class="col-span-2 p-4 border border-zinc-900 rounded-md bg-amber-100">
                <FormField v-slot="{ componentField }" name="observations">
                  <FormItem>
                    <FormLabel>Instruções / Observações para o Motorista</FormLabel>
                    <FormControl>
                      <Textarea class="resize-none bg-white" v-bind="componentField" />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
            <!-- PAYMENT -->
            <div
              class="p-6 flex flex-col gap-6 bg-white border border-zinc-900 rounded-md"
            >
              <div class="flex items-center gap-4">
                <Banknote />
                <div class="flex items-center justify-between w-full">
                  <h3 class="text-sm font-bold">Dados do Pagamento</h3>
                  <PaymentStatusFlag
                    :payment-status="ride?.billing.status"
                    :payment-url="ride?.billing.paymentUrl"
                  />
                </div>
              </div>
              <div class="flex items-start justify-between">
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">MEIO DE PAGAMENTO</small>
                  <p class="text-center uppercase font-bold">
                    {{ ride?.billing.paymentMethod }}
                  </p>
                </div>
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">DATA DO PAGAMENTO</small>
                  <p class="text-center uppercase font-bold">
                    {{ ride?.billing.date || '-' }}
                  </p>
                </div>
                <div class="space-y-2 text-center">
                  <small class="text-xs text-muted-foreground">PARCELAS</small>
                  <p class="text-center uppercase font-bold">
                    {{ ride?.billing.installments || '-' }}
                  </p>
                </div>
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
    <!-- <SharedRideRouteMap
      v-if="ride?.status === 'completed'"
      :origin-coords="{
        lat: ride.travel.origin.lat,
        lng: ride.travel.origin.lng,
      }"
      :stops-coords="ride.travel.stops"
      :destination-coords="{
        lat: ride.travel.destination.lat,
        lng: ride.travel.destination.lng,
      }"
      :rideRealCoords="ride.progress"
    /> -->
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
  <Dialog
    :open="showDeleteConfirmationModal"
    @update:open="showDeleteConfirmationModal = $event"
  >
    <DialogContent class="space-y-4">
      <DialogHeader>
        <DialogTitle>Deseja exluir este atendimento?</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        Essa ação irá excluir o atendimento
        <span class="font-bold"> #{{ ride?.code }} </span> e notificar o usuário
        motorista.
      </DialogDescription>
      <DialogFooter>
        <div class="flex items-start justify-center gap-4 w-full">
          <Button
            type="button"
            variant="secondary"
            @click="() => (showDeleteConfirmationModal = false)"
          >
            Voltar
          </Button>
          <Button type="button" variant="destructive" @click="handleDeleteRide">
            <LoaderCircle v-if="loadingCancelAndDelete" class="animate-spin" />
            Excluir
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
