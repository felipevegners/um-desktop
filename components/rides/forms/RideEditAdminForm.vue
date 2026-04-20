<script setup lang="ts">
import FormButtons from '@/components/forms/FormButtons.vue';
import AddExtraCharges from '@/components/shared/AddExtraCharges.vue';
import BackLink from '@/components/shared/BackLink.vue';
import PaymentStatusFlag from '@/components/shared/PaymentStatusFlag.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast/use-toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { extraChargesTypes } from '@/config/extraCharges';
import { WPP_API } from '@/config/paths';
import { paymentMethods } from '@/config/paymentMethods';
import { deleteRideService } from '@/server/services/rides';
import { useAccountStore } from '@/stores/account.store';
import { useBranchesStore } from '@/stores/branches.store';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import { DateFormatter } from '@internationalized/date';
import {
  Banknote,
  CalendarDays,
  CarFront,
  Check,
  Info,
  Link,
  LoaderCircle,
  Mail,
  Map,
  MessageCircleMore,
  MessageSquareWarning,
  Paperclip,
  Phone,
  ReceiptText,
  Save,
  SquareCheck,
  SquareDot,
  SquareSquare,
  ThumbsUp,
  Trash,
  User,
  UserPen,
  Users2,
  X,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import FormSelect from '~/components/shared/FormSelect.vue';
import RideRouteMap from '~/components/shared/RideRouteMap.vue';
import RideStepper from '~/components/shared/RideStepper.vue';
import {
  convertMetersToDistance,
  convertSecondsToTime,
  currencyFormat,
  sanitizePhone,
  sanitizeRideDate,
} from '~/lib/utils';
import {
  buildAvailableRideUsers,
  findSelectedRideUser,
  resolveRideContractId,
  resolveRideTravelCalendarDate,
} from '~/utils/rides/ridePageHelpers';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Backoffice - Editar Atendimento | Urban Mobi',
});

const { toast } = useToast();
const { isAdmin } = useSessionAccess();
const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const route = useRoute();
const router = useRouter();
const ridesStore = useRidesStore();
const { getRideByIdAction, getRideByCodeAction, updateRideAction, setRideDriverAction } =
  ridesStore;
const { ride, loadingData, capabilities } = storeToRefs(ridesStore);

const routeRideId = computed(() =>
  String(route?.params?.id || route?.params?.code || ''),
);
const isCodeRoute = computed(
  () => typeof route?.params?.code === 'string' && String(route?.params?.code).length > 0,
);

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

if (routeRideId.value !== 'current' && isCodeRoute.value) {
  await getRideByCodeAction(routeRideId.value);
} else if (routeRideId.value !== 'current') {
  await getRideByIdAction(routeRideId.value);
} else if (!ride?.value?.id) {
  navigateTo('/rides/form/new');
}

await getProductsAction();

const branchesStore = useBranchesStore();
const { getBranchByIdAction, updateBranchAction } = branchesStore;
const { branch } = storeToRefs(branchesStore);

const editDriver = ref<boolean>(false);
const selectedDriver = ref<any>();
selectedDriver.value = ride?.value.driver;
const loadingSetDriver = ref<boolean>(false);
const sendPushOnDriverAssign = ref<boolean>(false);
const selectedDriverHasValidPushToken = ref<boolean>(false);
const loadingDriverPushStatus = ref<boolean>(false);
const selectedUser = ref<any>();
const loadingSend = ref<boolean>(false);
const availableUsers = ref();
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>(ride?.value.product);
const travelDate = ref<any>();
const showRouteRecalculation = ref<boolean>(false);
const showCancelationModal = ref<boolean>(false);
const showDeleteConfirmationModal = ref<boolean>(false);
const loadingCancelAndDelete = ref<boolean>(false);
const showFinishModal = ref<boolean>(false);
const showWaypointsForm = ref<boolean>(false);
const loadingRemoveDriver = ref<boolean>(false);
const driverData = ref<any>({
  loading: true,
  location: {},
  name: '',
  picture: '',
});
const driverLocationInterval = ref<any>(null);
const extraChargesData = reactive(ride?.value.extraCharges || []);
// Track removed charges for price consistency
const removedCharges = ref<any[]>([]);

availableProducts.value = products?.value;
showWaypointsForm.value = ride?.value.travel?.stops?.length;

const waypointLocationDetails = ref<any>([]);

onBeforeMount(async () => {
  await getUsersAccountsAction();
  const { filteredUsers, options } = buildAvailableRideUsers(accounts?.value);
  availableUsers.value = options;
  selectedUser.value = findSelectedRideUser(filteredUsers, ride?.value);

  const contractId = resolveRideContractId(ride?.value);
  if (contractId) {
    await getContractByIdAction(contractId);
    availableProducts.value = contract?.value.products;
    selectedProduct.value = ride?.value?.product;
  }

  travelDate.value = resolveRideTravelCalendarDate(ride?.value?.travel?.date);

  await getDriversAction();
});

const translatePaymentMethod = computed(() => {
  const method = paymentMethods.find(
    (method) => method.id === ride?.value.billing?.paymentMethod,
  );
  return method?.label;
});

const getPaymentBranch = computed(() => {
  const paymentData = ride?.value?.billing?.paymentData;
  const branchCode = paymentData?.branchCode;
  const branchName = paymentData?.branchName;

  if (branchCode && branchName) {
    return `${branchCode} - ${branchName}`;
  }

  return branchName || branchCode || '-';
});

const getPaymentArea = computed(() => {
  const paymentData = ride?.value?.billing?.paymentData;
  const areaCode = paymentData?.areaCode;
  const areaName = paymentData?.areaName;

  if (areaCode && areaName) {
    return `${areaCode} - ${areaName}`;
  }

  return areaCode || areaName || '-';
});

const hasSplitPayment = computed(() => {
  const splitedPayment = ride?.value?.billing?.paymentData?.splitedPayment;
  return Array.isArray(splitedPayment) && splitedPayment.length > 0;
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
  void loadSelectedDriverPushStatus(findDriver?.id);
};

const clearDriverSelection = () => {
  selectedDriver.value = {};
  form.setFieldValue('driver', '');
  selectedDriverHasValidPushToken.value = false;
  sendPushOnDriverAssign.value = false;
};

const loadSelectedDriverPushStatus = async (driverId?: string) => {
  selectedDriverHasValidPushToken.value = false;
  sendPushOnDriverAssign.value = false;

  if (!driverId) return;

  try {
    loadingDriverPushStatus.value = true;
    const account = await $fetch<any>(`/api/auth/accounts?id=${driverId}`);
    const hasValidPush = !!account?.pushNotification?.expoPushToken;

    selectedDriverHasValidPushToken.value = hasValidPush;
    sendPushOnDriverAssign.value = hasValidPush;
  } catch (error) {
    selectedDriverHasValidPushToken.value = false;
    sendPushOnDriverAssign.value = false;
  } finally {
    loadingDriverPushStatus.value = false;
  }
};

const setRideDriver = async () => {
  try {
    loadingSetDriver.value = true;
    await setRideDriverAction(ride?.value.id, selectedDriver.value, {
      sendPushNotification: sendPushOnDriverAssign.value,
    });
    if (isCodeRoute.value) {
      await getRideByCodeAction(routeRideId.value);
    } else {
      await getRideByIdAction(routeRideId.value);
    }
    editDriver.value = false;
    selectedDriver.value = ride?.value.driver;
    form.setFieldValue('driver', ride?.value?.driver?.id || '');
    selectedDriverHasValidPushToken.value = false;
    sendPushOnDriverAssign.value = false;
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao atribuir o motorista. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingSetDriver.value = false;
  }

  // const message = `
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
  // const url =
  //   WPP_API.replace('[[phone]]', sanitizePhone(selectedDriver.value.phone as string)) +
  //   '&text=' +
  //   message;
  // navigateTo(url, { external: true, open: { target: '_blank' } });
};

const handleRemoveDriver = async () => {
  const payload = {
    ...ride?.value,
    status: 'created',
    accepted: false,
    driver: {},
  };
  try {
    loadingRemoveDriver.value = true;
    await updateRideAction(payload);
    editDriver.value = false;
    clearDriverSelection();
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao remover o motorista. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingRemoveDriver.value = false;
    if (isCodeRoute.value) {
      await getRideByCodeAction(routeRideId.value);
    } else {
      await getRideByIdAction(routeRideId.value);
    }
    clearDriverSelection();
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
    additionalInfo: ride?.value.additionalInfo || '',
  },
});

onMounted(async () => {
  if (selectedDriver.value?.id) {
    await loadSelectedDriverPushStatus(selectedDriver.value.id);
  }

  if (ride?.value?.status === 'in-progress') {
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

  const branchId = ride?.value?.billing?.paymentData?.branchId;
  if (branchId) {
    await getBranchByIdAction(branchId);
  }
});

onUnmounted(() => {
  if (driverLocationInterval.value) {
    clearInterval(driverLocationInterval.value);
  }
});

const onSubmit = form.handleSubmit(async (values) => {
  loadingSend.value = true;

  // Calculate sum of extra charges
  const extraChargesSum = (extraChargesData || []).reduce((sum: any, item: any) => {
    const amount =
      typeof item.amount === 'string'
        ? parseFloat(item.amount.replace(',', '.'))
        : Number(item.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Calculate sum of removed charges
  const removedChargesSum = (removedCharges.value || []).reduce((sum: any, item: any) => {
    const amount =
      typeof item.amount === 'string'
        ? parseFloat(item.amount.replace(',', '.'))
        : Number(item.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Use ride.billing.ammount as original price
  let originalPrice = ride?.value.billing?.ammount
    ? Number(ride.value.billing.ammount)
    : 0;

  // Calculate ammountWithExtras based on current extra charges
  let ammountWithExtras = originalPrice + extraChargesSum;

  // Update branch budget logic: always use branch.value.usedBudget
  let currentUsedBudget = branch?.value.usedBudget
    ? parseFloat(String(branch.value.usedBudget).replace(',', '.'))
    : 0;
  const safeExtraChargesSum = isNaN(extraChargesSum)
    ? 0
    : parseFloat(String(extraChargesSum).toString().replace(',', '.'));
  const safeRemovedChargesSum = isNaN(removedChargesSum)
    ? 0
    : parseFloat(String(removedChargesSum).toString().replace(',', '.'));

  // Only update branch budget if extra charges or removed charges changed
  if (safeExtraChargesSum > 0) {
    currentUsedBudget += safeExtraChargesSum;
  }
  if (safeRemovedChargesSum > 0) {
    currentUsedBudget -= safeRemovedChargesSum;
    if (currentUsedBudget < 0) currentUsedBudget = 0;
    ammountWithExtras -= safeRemovedChargesSum;
    if (ammountWithExtras < originalPrice) ammountWithExtras = originalPrice;
  }

  if (safeExtraChargesSum > 0 || safeRemovedChargesSum > 0) {
    const { id, ...restBranchData } = branch?.value || {};
    await updateBranchAction({
      ...restBranchData,
      branchId: id as string,
      contract: restBranchData.contractId,
      usedBudget: String(currentUsedBudget),
    });
  }

  // Calculate rideFinalPrice for completed rides
  let rideFinalPrice = ride?.value.rideFinalPrice
    ? Number(ride.value.rideFinalPrice)
    : originalPrice;
  if (ride?.value.status === 'completed') {
    rideFinalPrice = Number(ammountWithExtras);
  }

  const ridePayload = {
    ...ride?.value,
    id: ride?.value.id,
    reason: values.reason || '-',
    travel: {
      ...ride?.value.travel,
      passengers: values.passengers,
      date: values.departDate,
      departTime: values.departTime,
    },
    status: ride?.value.status,
    accepted: ride?.value.accepted,
    driver: {
      id: selectedDriver.value.id,
      name: selectedDriver.value.name,
      phone: selectedDriver.value.phone,
      email: selectedDriver.value.email,
      hasCarSelected: false,
      selectedCar: {},
    },
    observations: values.observations,
    additionalInfo: values.additionalInfo || '',
    extraCharges: extraChargesData || [],
    rideFinalPrice: rideFinalPrice.toString(),
    billing: {
      ...ride?.value.billing,
      ammountWithExtras: ammountWithExtras.toString(),
    },
  };
  try {
    await updateRideAction(ridePayload);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl hover:text-white',
      description: `Atendimento alterado com sucesso!`,
    });
    await navigateTo('/admin/rides/open');
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao editar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingSend.value = false;
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

const showRideControls = computed(() => {
  return ride?.value.status !== 'completed' && ride?.value.status !== 'cancelled';
});

const handleAcceptBudgetOverQuota = () => {
  const payload = {
    ...ride?.value,
    status: 'created',
  };
  try {
    updateRideAction(payload);
    toast({
      title: 'Atendimento liberado com sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl hover:text-white',
    });
    navigateTo('/admin/rides/open');
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao liberar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  }
};
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <div class="flex items-center justify-between gap-4">
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <CalendarDays class="w-6 h-6" />
          Editar Atendimento - #{{ ride?.code || '' }}
        </h1>
        <RideStatusFlag :ride-status="ride?.status" size="large" />
      </div>
      <div v-if="ride?.status === 'completed'" class="flex items-center self-end gap-4">
        <Button
          v-if="isAdmin"
          variant="destructive"
          @click="showDeleteConfirmationModal = true"
        >
          <Trash />
          Excluir
        </Button>
      </div>
      <div v-if="showRideControls" class="flex gap-6 items-center">
        <Button
          v-if="ride?.status === 'in-progress'"
          @click="handleCopyTrackLink"
          class="bg-blue-600 hover:bg-blue-700"
        >
          <Link />
          Copiar Link Rastreio
        </Button>

        <div class="p-2 border border-zinc-950 rounded-md flex gap-6">
          <Button @click="toggleFinishModal">
            <Check />
            FInalizar
          </Button>
          <Button
            v-if="capabilities?.canCancelRide !== false"
            @click="toggleCancelationModal"
            variant="secondary"
          >
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
    <section v-if="ride?.status === 'over_quota'" class="mb-10">
      <div class="p-4 bg-amber-300 border border-amber-600 rounded-md">
        <div class="flex flex-col gap-2">
          <MessageSquareWarning class="text-amber-900" />
          <h3 class="font-bold text-amber-900 text-xl">ATENÇÃO!</h3>
          <p v-if="ride?.status === 'over_quota'" class="text-amber-900 font-bold">
            Este atendimento excedeu o budget da filial. Entre em contato com o Gestor
            Master ({{ contract?.manager?.username }} - {{ contract?.manager?.email }})
            para mais informações.
          </p>
          <small class="block mb-6 text-amber-900">
            Atendimentos com status "BUDGET" não são confirmados e estão sujeitos a
            cancelamento automático caso o budget não seja liberado em até 48h. Ao liberar
            o atendimento o saldo negativo do budget será descontado no início do próximo
            período de faturamento.
          </small>
        </div>
        <Button
          v-if="ride?.status === 'over_quota'"
          class="mt-4 bg-amber-700 hover:bg-amber-800"
          size="lg"
          @click="handleAcceptBudgetOverQuota"
        >
          Aprovar Atendimento
        </Button>
      </div>
    </section>
    <section v-if="loadingData" class="p-6 flex items-center justify-center">
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true" class="space-y-6">
        <Card class="p-0 bg-zinc-200">
          <CardContent class="px-4 py-6">
            <div class="flex flex-col w-full gap-4">
              <div class="col-span-2 md:grid md:grid-cols-4 gap-3">
                <div class="mb-4 col-span-4 flex items-center justify-between">
                  <div class="flex gap-2">
                    <Map />
                    <h3 class="text-xl font-bold">Dados do atendimento</h3>
                  </div>
                  <div>
                    <small class="text-xs text-muted-foreground">Solicitado em</small>
                    <h3 class="font-bold">
                      {{ new Date(ride?.createdAt).toLocaleDateString('pt-BR') }}
                    </h3>
                  </div>
                </div>
                <div
                  v-if="ride.progress.steps.length"
                  class="col-span-4 p-3 bg-white rounded-md"
                >
                  <span class="text-muted-foreground text-sm">Etapas do Atendimento</span>
                  <RideStepper :steps="ride.progress.steps" theme="white" />
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
                  <span class="text-muted-foreground text-sm"> Hora do Desembarque </span>
                  <div v-if="ride?.status === 'completed'">
                    <h3 class="text-lg font-bold">
                      {{
                        new Date(ride?.progress.finishedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}H
                    </h3>
                  </div>
                  <p v-else>-</p>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">Distância estimada</span>
                  <h3 class="text-lg font-bold">
                    {{ convertMetersToDistance(ride?.travel.estimatedDistance) }}
                  </h3>
                  <div
                    v-if="
                      ride?.travel.completedData &&
                      ride?.travel.completedData?.rideExtraKms !== 0
                    "
                    class="my-3"
                  >
                    <span class="text-sm">KM Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        ride?.travel.completedData?.rideExtraKms?.toLocaleString(
                          'pt-BR',
                          {
                            maximumFractionDigits: 2,
                          },
                        )
                      }}
                    </h3>
                    <span class="text-sm">Valor Km Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        currencyFormat(ride?.travel.completedData?.rideExtraKmPrice || 0)
                      }}
                    </h3>
                  </div>
                  <div v-if="ride?.status === 'completed'">
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
                    v-if="
                      ride?.travel.completedData &&
                      ride?.travel.completedData?.rideExtraHours !== 0
                    "
                    class="my-3"
                  >
                    <span class="text-sm">Hora Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        ride?.travel.completedData?.rideExtraHours <= 9
                          ? `0${ride?.travel.completedData?.rideExtraHours?.toLocaleString(
                              'pt-BR',
                              {
                                maximumFractionDigits: 2,
                              },
                            )}`
                          : ride?.travel.completedData?.rideExtraHours
                      }}
                    </h3>
                    <span class="text-sm">Valor Hora Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        currencyFormat(
                          ride?.travel.completedData?.rideExtraHourPrice || 0,
                        )
                      }}
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
                      {{
                        convertSecondsToTime(ride?.travel.completedData?.totalTimeStopped)
                      }}
                    </h3>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-md">
                  <span class="text-muted-foreground text-sm">
                    Valor estimado (atendimento + adicionais)
                  </span>
                  <h3 class="text-lg font-bold">
                    {{ currencyFormat(ride?.estimatedPrice) }}
                  </h3>
                  <div v-if="ride?.extraCharges.length > 0">
                    <div
                      class="my-3 p-3 border border-amber-600 bg-amber-50 rounded-md flex flex-col gap-4"
                    >
                      <span class="text-sm text-amber-600 font-bold">
                        Custos extras
                      </span>
                      <div v-for="extra in ride?.extraCharges">
                        <small class="block font-bold">
                          {{ extraChargesTypes[extra.type] }}
                        </small>
                        <small class="block w-full text-muted-foreground">{{
                          extra.info
                        }}</small>
                        <small class="font-bold text-amber-600">{{
                          currencyFormat(extra.amount || '0')
                        }}</small>
                      </div>
                    </div>
                    <div v-if="ride?.billing.ammountWithExtras !== null">
                      <span class="text-muted-foreground text-sm">
                        Valor Total (estimado + custos extras)
                      </span>
                      <h3 class="text-lg font-bold text-amber-600">
                        {{ currencyFormat(ride?.billing.ammountWithExtras) }}
                      </h3>
                    </div>
                  </div>

                  <div v-if="ride?.status === 'completed'">
                    <span class="text-muted-foreground text-sm">Valor final</span>
                    <h3 class="text-lg font-bold text-green-600">
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
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <span class="text-muted-foreground text-sm">Motivo do Atendimento</span>
                  <p class="font-bold text-lg">{{ ride?.reason ?? '-' }}</p>
                </div>
              </div>
              <!-- RIDE -->
              <div class="flex flex-col md:grid md:grid-cols-2 gap-6 items-start">
                <!-- PAYMENT -->
                <div
                  class="col-span-2 p-6 flex flex-col h-full gap-6 bg-white rounded-md"
                >
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
                      <div
                        v-if="ride?.status === 'over_quota'"
                        class="mt-4 p-3 bg-red-100 rounded-md w-fit text-sm text-red-500 space-y-3"
                      >
                        <Info />
                        <p class="">
                          <span class="font-bold">Budget da filial insuficiente</span>
                          <br />
                          O gestor master deve autorizar o uso de limite excedente ou
                          cancelar o atendimento.
                        </p>
                      </div>
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
                          {{ hasSplitPayment ? 'RATEIO' : getPaymentArea }}
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
                    <div v-if="hasSplitPayment" class="w-full space-y-4">
                      <p class="font-bold">Pagamento rateado entre filiais</p>
                      <ul class="space-y-4">
                        <li
                          v-for="(splited, index) in ride?.billing?.paymentData
                            ?.splitedPayment || []"
                          :key="index"
                          class="md:grid md:grid-cols-3 gap-6"
                        >
                          <div>
                            <small class="text-xxs text-muted-foreground uppercase">
                              Cód. do CC
                            </small>
                            <p class="font-bold">
                              {{ splited?.areaCode || splited?.area || '-' }}
                            </p>
                          </div>
                          <div>
                            <small class="text-xxs text-muted-foreground uppercase">
                              Porcentagem
                            </small>
                            <p class="font-bold">{{ splited?.percentage ?? 0 }}%</p>
                          </div>
                          <div>
                            <small class="text-xxs text-muted-foreground uppercase">
                              Valor
                            </small>
                            <p class="font-bold">
                              {{ currencyFormat(splited?.amount ?? 0) }}
                            </p>
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
                <div class="p-6 col-span-1 flex flex-col gap-6 bg-white rounded-md">
                  <div class="flex flex-col gap-6">
                    <CarFront />
                    <h3 class="text-xl font-bold">Dados do Motorista</h3>
                  </div>
                  <div class="md:grid md:grid-cols-2">
                    <div class="flex flex-col gap-6">
                      <div>
                        <small>Nome</small>
                        <h2 class="font-bold text-lg">
                          {{ ride?.driver.name || 'Sem motorista' }}
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
                          v-if="
                            ride?.status === 'rejected' && ride?.driver?.rejectionReason
                          "
                          class="my-4 p-3 flex flex-col gap-2 rounded-md bg-orange-100 border border-orange-300 text-orange-700 text-sm"
                        >
                          <div class="flex items-center gap-2">
                            <MessageSquareWarning />
                            <span class="font-semibold"
                              >O motorista recusou este atendimento.</span
                            >
                          </div>
                          <div class="ml-6 p-2">
                            <p class="text-xs font-semibold text-orange-700 mb-1">
                              Motivo da Recusa:
                            </p>
                            <p class="text-sm text-orange-900">
                              {{ ride?.driver.rejectionReason }}
                            </p>
                          </div>
                        </div>
                        <div
                          v-else-if="!ride?.accepted && ride?.driver.name"
                          class="my-4 p-2 flex items-center gap-2 rounded-md bg-red-100 text-red-600 text-sm"
                        >
                          <MessageSquareWarning />
                          <span>
                            {{ ride?.driver.name }} ainda não aceitou este atendimento.
                          </span>
                        </div>
                      </div>
                      <!-- CHANGE DRIVER CONTROLS -->
                      <div
                        v-if="
                          ride?.status === 'pending' ||
                          ride?.status === 'created' ||
                          ride?.status === 'rejected'
                        "
                        class="flex gap-6"
                      >
                        <div v-if="editDriver" class="flex-1 flex flex-col gap-3">
                          <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <FormField v-slot="{ componentField, value }" name="driver">
                              <FormItem class="w-full xl:flex-1">
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
                            <div class="flex items-center gap-2 xl:self-start">
                              <Button
                                class="bg-green-600 hover:bg-green-700"
                                :disabled="
                                  loadingSetDriver ||
                                  selectedDriver.id === ride?.driver.id
                                "
                                @click.prevent="setRideDriver"
                              >
                                <LoaderCircle
                                  v-if="loadingSetDriver"
                                  class="animate-spin"
                                />
                                <Save v-else />
                                Salvar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                :disabled="loadingSetDriver"
                                @click.prevent="editDriver = false"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                          <div
                            v-if="selectedDriver.id && selectedDriverHasValidPushToken"
                            class="max-w-xl p-3 border border-zinc-200 rounded-md bg-zinc-50"
                          >
                            <label class="flex items-center gap-2 text-sm text-zinc-700">
                              <Checkbox
                                :checked="sendPushOnDriverAssign"
                                @update:checked="
                                  (checked) => (sendPushOnDriverAssign = checked === true)
                                "
                              />
                              Enviar notificação via push?
                            </label>
                            <small class="text-zinc-500 flex items-center gap-1 mt-2">
                              <ThumbsUp class="inline-block" :size="14" />
                              O motorista selecionado possui token push válido.
                            </small>
                          </div>
                          <small
                            v-else-if="selectedDriver.id && !loadingDriverPushStatus"
                            class="block max-w-xl text-xs text-red-600"
                          >
                            Motorista sem token push válido. O envio via push ficará
                            indisponível. Peça ao motorista para relogar no app.
                          </small>
                          <small
                            v-else-if="selectedDriver.id && loadingDriverPushStatus"
                            class="block max-w-xl text-xs text-zinc-500"
                          >
                            Validando token push do motorista...
                          </small>
                        </div>
                        <div v-else class="flex gap-2 self-end">
                          <Button
                            v-if="capabilities?.canAssignDriver !== false"
                            @click.prevent="editDriver = true"
                          >
                            <UserPen />
                            {{
                              !ride?.driver.name
                                ? 'Selecionar Motorista'
                                : 'Alterar Motorista'
                            }}
                          </Button>
                          <Button
                            v-if="ride?.driver.name"
                            :disabled="loadingRemoveDriver"
                            @click.prevent="handleRemoveDriver"
                            variant="destructive"
                          >
                            <LoaderCircle
                              v-if="loadingRemoveDriver"
                              class="animate-spin"
                            />
                            <X v-else />
                            Remover Motorista
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="ride?.status === 'over_quota'"
                      class="col-span-2 mt-4 p-2 bg-red-100 rounded-md w-fit text-sm text-red-500 space-y-3"
                    >
                      <Info />
                      <p>
                        <span class="font-bold">Atenção: </span>
                        o gestor master deve autorizar o atendimento para selecionar um
                        motorista.
                      </p>
                    </div>

                    <div class="flex flex-col items-end">
                      <div
                        v-if="ride?.status === 'completed'"
                        class="p-4 rounded-md bg-amber-50"
                      >
                        <h4 class="text-lg">Comissão por este atendimento</h4>
                        <h1 class="text-2xl font-bold">
                          {{
                            currencyFormat(
                              ride?.travel.completedData?.driverCommission || '0',
                            )
                          }}
                        </h1>
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
            </div>
          </CardContent>
        </Card>
        <!-- ADDITIONAL EXTRA FARES -->
        <Card v-if="ride?.status === 'completed'" class="p-0 bg-zinc-200">
          <CardHeader>
            <CardTitle class="text-xl flex flex-col gap-6">
              <ReceiptText />
              Inserir custos extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddExtraCharges
              v-model="extraChargesData"
              v-model:removedCharges="removedCharges"
            />
          </CardContent>
        </Card>
        <!-- ADDITIONAL INFO CARD -->
        <Card class="p-0 bg-zinc-200">
          <CardHeader>
            <CardTitle class="text-xl flex flex-col gap-6">
              <MessageSquareWarning />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-start gap-4">
              <FormField v-slot="{ componentField }" name="additionalInfo">
                <FormItem class="flex-1 w-full">
                  <div class="mb-3 flex items-center justify-between">
                    <FormLabel>
                      Insira informações adicionais para este atendimento caso necessário.
                    </FormLabel>
                    <Button type="button" @click.prevent="() => {}" variant="ghost">
                      <Paperclip />
                      Anexar Arquivo
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      class="resize-none bg-white min-h-[300px] w-full"
                      v-bind="componentField"
                      height="100%"
                      width="100%"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
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
    </section>
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
