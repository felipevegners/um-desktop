<script setup lang="ts">
import FormButtons from '@/components/forms/FormButtons.vue';
import BackLink from '@/components/shared/BackLink.vue';
import RideRouteMap from '@/components/shared/RideRouteMap.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { extraChargesTypes } from '@/config/extraCharges';
import { WPP_API } from '@/config/paths';
import { paymentMethods } from '@/config/paymentMethods';
import { deleteRideService } from '@/server/services/rides';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import { CalendarDate, DateFormatter } from '@internationalized/date';
import {
  CalendarDays,
  CarFront,
  Link,
  LoaderCircle,
  Mail,
  Map,
  MessageCircleMore,
  MessageSquareWarning,
  Phone,
  Settings,
  SquareCheck,
  SquareDot,
  SquareSquare,
  Trash,
  User,
  Users2,
  X,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import PaymentStatusFlag from '~/components/shared/PaymentStatusFlag.vue';
import {
  convertMetersToDistance,
  convertSecondsToTime,
  currencyFormat,
  sanitizePhone,
  sanitizeRideDate,
} from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
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
const ridesStore = useRidesStore();
const { getRideByIdAction, updateRideAction, setRideDriverAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

const accountStore = useAccountStore();
const { getUsersAccountsAction } = accountStore;
const { accounts } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

const driversStore = useDriverStore();
const { getDriversAction, getDriverByIdAction } = driversStore;
const { drivers, driver } = storeToRefs(driversStore);

const productsStore = useProductsStore();
const { getProductsAction } = productsStore;
const { products } = storeToRefs(productsStore);
await getRideByIdAction(route?.params?.id as string);
await getProductsAction();

useHead({
  title: `${ride?.value.status === 'completed' ? 'Visualizar' : 'Editar'} Atendimento | Urban Mobi`,
});
const selectedUser = ref<any>();
const loadingSend = ref<boolean>(false);
const availableUsers = ref();
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>(ride?.value.product);
const travelDate = ref<any>();
const showCancelationModal = ref<boolean>(false);
const showDeleteConfirmationModal = ref<boolean>(false);
const loadingCancelAndDelete = ref<boolean>(false);
const showFinishModal = ref<boolean>(false);
const showWaypointsForm = ref<boolean>(false);
const driverData = ref<any>({
  loading: true,
  location: {},
  name: '',
  picture: '',
});
const driverLocationInterval = ref<any>(null);

availableProducts.value = products?.value;
showWaypointsForm.value = ride?.value.travel?.stops?.length;

const waypointLocationDetails = ref<any>([]);

onBeforeMount(async () => {
  await getUsersAccountsAction();
  const filteredUsers = accounts?.value.filter(
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
});

waypointLocationDetails.value = ride?.value.travel.stops || [];

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
      navigateTo('/corporative/rides/open');
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

onMounted(async () => {
  if (ride?.value.status === 'in-progress') {
    driverLocationInterval.value = setInterval(async () => {
      driverData.value = {
        loading: driverData.value.loading,
        location: driverData.value.location,
        name: driverData.value.name,
        picture: driverData.value.picture,
      };
      await getDriverByIdAction(ride?.value.driver.id);
      driverData.value = {
        loading: false,
        location: driver?.value.location,
        name: driver?.value.name,
        picture: driver?.value.driverFiles.picture.url,
      };
    }, 10000);
  }
});

onUnmounted(() => {
  if (driverLocationInterval.value) {
    clearInterval(driverLocationInterval.value);
  }
});

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
    status: ride?.value.status,
    driver: {},
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

const handleCopyTrackLink = async () => {
  const url = `https://app.urbanmobi.com.br/trackRide?rideId=${ride?.value.id}`;
  try {
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado com sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl hover:text-white',
    });
  } catch (err) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao copiar o link. Tente novamente.`,
      variant: 'destructive',
    });
  }
};

const translatePaymentMethod = computed(() => {
  const method = paymentMethods.find(
    (method) => method.id === ride?.value.billing?.paymentMethod,
  );
  return method?.label;
});

const getPaymentBranch = computed(() => {
  if (contract?.value) {
    const findBranch = contract?.value.branches?.find(
      (branch: any) => branch.id === ride?.value.billing?.paymentData?.branch,
    );
    return `${findBranch?.branchCode} - ${findBranch?.fantasyName}`;
  }
});

const showRideControls = computed(() => {
  return ride?.value.status !== 'completed' && ride?.value.status !== 'cancelled';
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
          {{ ride.status === 'completed' ? 'Visualizar' : 'Editar' }} Atendimento - #{{
            ride?.code || ''
          }}
        </h1>
        <RideStatusFlag :ride-status="ride?.status" />
      </div>
      <div v-if="showRideControls" class="flex gap-6 items-center">
        <div class="p-2 border border-zinc-950 rounded-md flex gap-6">
          <div class="pr-2 flex items-center gap-2 border-r border-zinc-950">
            <Settings />
            <span>Ações</span>
          </div>
          <Button
            v-if="ride.status === 'in-progress'"
            @click="handleCopyTrackLink"
            class="bg-violet-600 hover:bg-violet-700"
          >
            <Link />
            Copiar Link de Rastreio
          </Button>
          <Button @click="toggleCancelationModal" variant="destructive">
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
      </div>
    </section>
    <section v-if="loadingData" class="p-6 flex items-center justify-center">
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="p-0 bg-zinc-200">
          <CardContent class="px-4 py-6">
            <div class="flex flex-col gap-4">
              <!-- RIDE -->
              <div class="col-span-2 md:grid md:grid-cols-4 gap-3">
                <div class="mb-6 flex items-center gap-2">
                  <Map />
                  <h3 class="text-xl font-bold">Dados do atendimento</h3>
                </div>
                <div
                  class="relative col-span-4 row-span-4 border-4 border-white rounded-md w-full overflow-hidden"
                >
                  <RideRouteMap
                    :origin-coords="{
                      lat: ride?.travel.origin.lat,
                      lng: ride?.travel.origin.lng,
                    }"
                    :stops-coords="ride?.travel.stops"
                    :destination-coords="{
                      lat: ride?.travel.destination.lat,
                      lng: ride?.travel.destination.lng,
                    }"
                    :ride-progress="ride?.status === 'completed' ? ride?.progress : {}"
                    :driverData="ride?.status === 'in-progress' ? driverData : {}"
                    :real-polyline="ride?.travel.finalPolyline"
                    :ride-status="ride?.status"
                  />
                  <div
                    v-if="ride?.status === 'completed'"
                    class="absolute p-2 bg-white/90 bottom-0 space-y-2"
                  >
                    <small class="text-muted-foreground text-xs">Legenda</small>
                    <div class="mb-2 flex items-center gap-3">
                      <div class="flex items-center gap-2">
                        <span class="block w-5 h-1 bg-black"></span>
                        <small>Rota Inicial</small>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="block w-5 h-1 bg-[#f0f]"></span>
                        <small>Motorista</small>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="block w-5 h-1 bg-[#33ccff]"></span>
                        <small>Rota Realizada</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Data do embarque</span>
                  <h3 class="text-lg font-bold">
                    {{ sanitizeRideDate(ride?.travel.date) }}
                  </h3>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">
                    Hora de embarque (estimado)
                  </span>
                  <h3 class="text-lg font-bold">{{ ride?.travel.departTime }}H</h3>
                  <div v-if="ride.status === 'completed'">
                    <span class="text-muted-foreground text-sm">
                      Hora de embarque (realizado)
                    </span>
                    <h3 class="text-lg font-bold">
                      {{
                        new Date(ride?.progress.startedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}H
                    </h3>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <div>
                    <span class="text-muted-foreground text-sm">
                      Hora do Desembarque
                    </span>
                    <h3 v-if="ride.status === 'completed'" class="text-lg font-bold">
                      {{
                        new Date(ride?.progress.finishedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}H
                    </h3>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Distância estimada</span>
                  <h3 class="text-lg font-bold">
                    {{ convertMetersToDistance(ride?.travel.estimatedDistance) }}
                  </h3>
                  <div v-if="ride?.travel.completedData.rideExtraKms !== 0" class="my-3">
                    <span class="text-sm text-muted-foreground">KM Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        ride?.travel.completedData.rideExtraKms.toLocaleString('pt-BR', {
                          maximumFractionDigits: 2,
                        })
                      }}
                    </h3>
                    <span class="text-sm text-muted-foreground">Valor Km Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{ currencyFormat(ride?.travel.completedData.rideExtraKmPrice) }}
                    </h3>
                  </div>
                  <div v-if="ride.status === 'completed'">
                    <span class="text-muted-foreground text-sm">
                      Distância realizada
                    </span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        convertMetersToDistance(ride?.travel.completedData?.finalDistance)
                      }}
                    </h3>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Duração estimada</span>
                  <h3 class="text-lg font-bold">
                    {{ convertSecondsToTime(ride?.travel.estimatedDuration) }}
                  </h3>

                  <div
                    v-if="ride?.travel.completedData.rideExtraHours !== 0"
                    class="my-3"
                  >
                    <span class="text-sm text-muted-foreground">Hora Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        ride?.travel.completedData.rideExtraHours <= 9
                          ? `0${ride?.travel.completedData.rideExtraHours}`
                          : ride?.travel.completedData.rideExtraHours
                      }}
                    </h3>
                    <span class="text-sm text-muted-foreground">Valor Hora Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{ currencyFormat(ride?.travel.completedData.rideExtraHourPrice) }}
                    </h3>
                  </div>
                  <div v-if="ride?.status === 'completed'">
                    <span class="text-muted-foreground text-sm">Duração real</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        convertSecondsToTime(
                          ride?.travel.completedData?.finalDuration || 0,
                        )
                      }}
                    </h3>
                  </div>
                  <div
                    v-if="ride?.status === 'completed' && ride?.progress?.stops?.length"
                  >
                    <span class="text-muted-foreground text-sm">
                      Tempo em Paradas ({{ ride?.progress?.stops?.length }})
                    </span>
                    <h3 class="text-lg font-bold text-red-600">
                      {{ convertSecondsToTime(ride?.travel.totalTimeStopped) }}
                    </h3>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">
                    Valor estimado (atendimento + adicionais)
                  </span>
                  <h3 class="text-lg font-bold text-amber-600">
                    {{ currencyFormat(ride?.estimatedPrice) }}
                  </h3>
                  <div
                    v-if="ride?.extraCharges.length"
                    class="my-3 p-3 border border-amber-600 rounded-md flex flex-col gap-4"
                  >
                    <span class="text-sm text-amber-600"> Custos extras </span>
                    <div v-for="extra in ride?.extraCharges">
                      <small class="block font-bold">
                        {{ extraChargesTypes[extra.type] }}
                      </small>
                      <small class="block w-full text-muted-foreground">{{
                        extra.info
                      }}</small>
                      <small class="font-bold text-amber-600">{{
                        currencyFormat(extra.amount)
                      }}</small>
                    </div>
                  </div>
                  <div v-if="ride.status === 'completed'">
                    <span class="text-muted-foreground text-sm">Valor final</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{ currencyFormat(ride?.rideFinalPrice) }}
                    </h3>
                  </div>
                </div>
                <div class="p-3 flex flex-col items-start gap-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Serviço</span>
                  <div class="flex items-center gap-2">
                    <SharedProductTag
                      :label="ride?.product.name"
                      :type="ride?.product.name"
                    />
                    <small>{{ ride?.product.code }}</small>
                  </div>
                  <div v-if="ride?.billing.addons?.length">
                    <span class="text-muted-foreground text-sm">Adicionais</span>
                    <p v-for="item in ride?.billing.addons" class="text-sm">
                      <span class="font-bold">{{ item.code }}</span> - {{ item.name }}
                      <span> - </span>
                      <span class="font-bold">
                        {{ currencyFormat(item.basePrice) }}
                      </span>
                    </p>
                  </div>
                </div>
                <div class="p-3 flex flex-col items-start gap-2 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Passageiros</span>
                  <div class="flex items-center gap-2">
                    <Users2 :size="16" />
                    <p class="font-bold text-lg">{{ ride?.travel.passengers }}</p>
                  </div>
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <span class="text-muted-foreground text-sm">Solicitante</span>
                  <div class="flex flex-col items-start">
                    <p class="font-bold">{{ ride?.dispatcher.user }}</p>
                    <small>em: {{ ride?.dispatcher.dispatchDate }}</small>
                  </div>
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <div class="flex items-center gap-2">
                    <SquareDot :size="16" />
                    <span class="text-muted-foreground text-sm">Origem</span>
                  </div>
                  <p class="font-bold text-lg">{{ ride?.travel.originAddress }}</p>
                </div>
                <div
                  v-if="ride?.travel.stops.length > 0"
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <div v-for="(stop, index) in ride?.travel.stops" :key="index">
                    <div class="flex items-center gap-2">
                      <SquareSquare :size="16" />
                      <span class="text-muted-foreground text-sm">
                        Parada {{ Number(index) + 1 }}
                      </span>
                    </div>
                    <p class="font-bold text-lg">{{ stop.address }}</p>
                  </div>
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <div class="flex items-center gap-2">
                    <SquareCheck :size="16" />
                    <span class="text-muted-foreground text-sm">Destino</span>
                  </div>
                  <p class="font-bold text-lg">{{ ride?.travel.destinationAddress }}</p>
                </div>
              </div>
              <!-- PAYMENT -->
              <div class="col-span-2 p-6 flex flex-col h-full gap-6 bg-white rounded-md">
                <div class="flex flex-col gap-6">
                  <Banknote />
                  <div class="flex items-center justify-start gap-3 w-full">
                    <h3 class="text-xl font-bold">Dados do Pagamento</h3>
                  </div>
                  <div>
                    <small>Status</small>
                    <PaymentStatusFlag
                      :payment-status="ride?.billing.status"
                      :payment-url="ride?.billing.paymentUrl"
                    />
                  </div>
                </div>
                <div class="flex flex-col items-start gap-10">
                  <div class="flex justify-between gap-6 w-full">
                    <div class="space-y-2">
                      <small class="text-xxs text-muted-foreground">
                        MÉTODO DE PAGAMENTO
                      </small>
                      <p class="text-sm uppercase font-bold">
                        {{ translatePaymentMethod }}
                      </p>
                    </div>
                    <div class="space-y-2">
                      <small class="text-[10px] text-muted-foreground"> FILIAL </small>
                      <p class="text-sm uppercase font-bold">
                        {{ getPaymentBranch }}
                      </p>
                    </div>
                    <div class="space-y-2">
                      <small class="text-[10px] text-muted-foreground">
                        CENTRO DE CUSTO
                      </small>
                      <p class="text-sm uppercase font-bold">
                        {{
                          ride?.billing.paymentData.area === 'splited'
                            ? 'RATEIO'
                            : ride?.billing.paymentData.area
                        }}
                      </p>
                    </div>
                    <div class="space-y-2">
                      <small class="text-[10px] text-muted-foreground">
                        DATA DO PAGAMENTO
                      </small>
                      <p class="text-center uppercase font-bold">
                        {{
                          ride?.billing.paymentMethod === 'corporative'
                            ? contract?.comercialConditions?.paymentDueDate + ' dias'
                            : ride?.billing.date || '-'
                        }}
                      </p>
                    </div>
                  </div>
                  <div v-if="ride?.billing.installments" class="space-y-2">
                    <small class="text-[10px] text-muted-foreground">PARCELAS</small>
                    <p class="text-center uppercase font-bold">
                      {{ ride?.billing.installments || '-' }}
                    </p>
                  </div>
                  <div
                    v-if="ride?.billing.paymentData.area === 'splited'"
                    class="p-4 border border-amber-500 bg-amber-100 rounded-md w-full space-y-4"
                  >
                    <p class="font-bold">Pagamento rateado entre filiais</p>
                    <ul class="space-y-4">
                      <li
                        v-for="splited in ride?.billing.paymentData.splitedPayment"
                        class="md:grid md:grid-cols-3 gap-6"
                      >
                        <div>
                          <small class="text-xxs text-muted-foreground uppercase">
                            Cód. do CC
                          </small>
                          <p class="font-bold">
                            {{ splited.area }}
                          </p>
                        </div>
                        <div>
                          <small class="text-xxs text-muted-foreground uppercase">
                            Porcentagem
                          </small>
                          <p class="font-bold">{{ splited.percentage }}%</p>
                        </div>
                        <div>
                          <small class="text-xxs text-muted-foreground uppercase">
                            Valor
                          </small>
                          <p class="font-bold">{{ currencyFormat(splited.amount) }}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <!-- USER -->
              <div class="p-6 flex flex-col h-full gap-6 bg-white rounded-md">
                <User />
                <h3 class="text-xl font-bold">Dados do Usuário</h3>
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
              <div class="p-6 col-span-2 flex flex-col gap-6 bg-white rounded-md">
                <div class="flex flex-col gap-6">
                  <CarFront />
                  <h3 class="text-xl font-bold">Dados do Motorista</h3>
                </div>
                <div class="md:grid md:grid-cols-2">
                  <div class="flex flex-col gap-6">
                    <div>
                      <small>Nome</small>
                      <h2
                        class="font-bold text-lg"
                        :class="!ride?.driver.name && 'text-amber-500'"
                      >
                        {{ ride?.driver.name || 'Não definido' }}
                      </h2>
                      <div v-if="ride?.driver.hasCarSelected">
                        <small>Veículo</small>
                        <p class="font-bold uppercase">
                          {{ ride?.driver.selectedCar.model }} -
                          {{ ride?.driver.selectedCar.color }}
                        </p>
                        <span
                          class="block w-fit my-2 px-1 pt-1 pb-0.5 bg-white font-mono font-bold text-xl uppercase border border-zinc-950 rounded-md"
                        >
                          {{ ride?.driver.selectedCar.plate }}
                        </span>
                      </div>
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
                </div>
                <div class="p-4 rounded-md border border-zinc-400">
                  <FormField v-slot="{ componentField }" name="observations">
                    <FormItem>
                      <FormLabel>Instruções / Observações para o Motorista</FormLabel>
                      <FormControl>
                        <Textarea
                          class="resize-none bg-white h-full"
                          v-bind="componentField"
                          height="100%"
                          :disabled="ride?.status === 'completed'"
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <FormButtons
          :cancel="'/corporative/rides/open'"
          :loading="loadingSend"
          sbm-label="Salvar Atendimento"
          cnc-label="Cancelar"
        />
      </form>
    </section>
  </main>
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
