<script setup lang="ts">
import FormButtons from '@/components/forms/FormButtons.vue';
import BackLink from '@/components/shared/BackLink.vue';
import RideRouteMap from '@/components/shared/RideRouteMap.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { extraChargesTypes } from '@/config/extraCharges';
import { WPP_API } from '@/config/paths';
import { paymentMethods } from '@/config/paymentMethods';
import { deleteRideService, getRideRoutesService } from '@/server/services/rides';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  Building,
  CalendarDays,
  CarFront,
  Check,
  Edit,
  Link,
  LoaderCircle,
  Mail,
  Map,
  MessageCircleMore,
  MessageSquareWarning,
  Phone,
  Plus,
  Settings,
  SquareCheck,
  SquareDot,
  SquareSquare,
  User,
  Users2,
  Waypoints,
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
import {
  resolveDisplayExtraHourPrice,
  resolveDisplayExtraHours,
} from '~/utils/rides/billingExtras';
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
const { toast } = useToast();
const { isMasterManager, role } = useSessionAccess();

const EDITABLE_CORPORATIVE_ROLES = ['master-manager', 'branch-manager'] as const;

const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction, getRideByCodeAction, updateRideAction } = ridesStore;
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
const { getDriversAction } = driversStore;
const { drivers } = storeToRefs(driversStore);

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
const showWaypointsForm = ref<boolean>(false);

availableProducts.value = products?.value;
showWaypointsForm.value = ride?.value.travel?.stops?.length;

const waypointLocationDetails = ref<any>([]);

type EditableRideCard =
  | 'departTime'
  | 'passengers'
  | 'product'
  | 'stops'
  | 'destination'
  | 'reason'
  | 'paymentArea';

const NON_EDITABLE_RIDE_STATUSES = [
  'completed',
  'in-progress',
  'in_progress',
  'accepted',
];

const canEditRideData = computed(() => {
  const status = String(ride?.value?.status || '');
  const canEditByRole = EDITABLE_CORPORATIVE_ROLES.includes(
    String(role.value || '') as (typeof EDITABLE_CORPORATIVE_ROLES)[number],
  );
  return canEditByRole && !NON_EDITABLE_RIDE_STATUSES.includes(status);
});

const editingCards = reactive<Record<EditableRideCard, boolean>>({
  departTime: false,
  passengers: false,
  product: false,
  stops: false,
  destination: false,
  reason: false,
  paymentArea: false,
});

const hasEditingBlocks = computed(() => Object.values(editingCards).some(Boolean));
const hasPendingRouteBlocks = computed(
  () => editingCards.destination || editingCards.stops,
);

const draftRideData = reactive({
  departTime: '',
  passengers: 1,
  productId: '',
  destinationAddress: '',
  reason: '',
  paymentAreaCode: '',
});

const editableStops = ref<Array<{ address: string; lat?: number; lng?: number }>>([]);
const showRouteRecalculation = ref<boolean>(false);
const loadingRouteRecalculation = ref<boolean>(false);
const recalculationPreview = ref<any>(null);
const pendingRecalculationAction = ref<(() => void) | null>(null);

type RideAdditionalInfoAttachment = {
  name: string;
  url: string;
  key?: string;
  type?: string;
};

type RideAdditionalInfoValue = {
  text: string;
  attachments: RideAdditionalInfoAttachment[];
};

const normalizeAdditionalInfoAttachment = (
  attachment: Partial<RideAdditionalInfoAttachment> | null | undefined,
): RideAdditionalInfoAttachment | null => {
  const url = String(attachment?.url || '').trim();
  const name = String(attachment?.name || '').trim();

  if (!url && !name) return null;

  return {
    name,
    url,
    key: String(attachment?.key || '').trim() || undefined,
    type: String(attachment?.type || '').trim() || undefined,
  };
};

const parseAdditionalInfoValue = (value: unknown): RideAdditionalInfoValue => {
  if (!value) {
    return { text: '', attachments: [] };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (typeof parsed === 'string') {
        return {
          text: parsed,
          attachments: [],
        };
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const parsedValue = parsed as Partial<RideAdditionalInfoValue>;
        const attachments = Array.isArray(parsedValue?.attachments)
          ? parsedValue.attachments
              .map((item) => normalizeAdditionalInfoAttachment(item))
              .filter((item): item is RideAdditionalInfoAttachment => Boolean(item))
          : [];

        return {
          text: String(parsedValue?.text || '').trim(),
          attachments,
        };
      }

      return {
        text: value,
        attachments: [],
      };
    } catch {
      return {
        text: value,
        attachments: [],
      };
    }
  }

  if (typeof value === 'object') {
    const parsed = value as Partial<RideAdditionalInfoValue>;
    const attachments = Array.isArray(parsed.attachments)
      ? parsed.attachments
          .map((item) => normalizeAdditionalInfoAttachment(item))
          .filter((item): item is RideAdditionalInfoAttachment => Boolean(item))
      : [];

    return {
      text: String(parsed.text || '').trim(),
      attachments,
    };
  }

  return { text: '', attachments: [] };
};

const additionalInfoContent = computed(() =>
  parseAdditionalInfoValue(ride?.value?.additionalInfo),
);

const hasAdditionalInfoContent = computed(() => {
  return (
    String(additionalInfoContent.value.text || '').trim().length > 0 ||
    additionalInfoContent.value.attachments.length > 0
  );
});

const paymentAreaOptions = computed(() => {
  const branchId =
    ride?.value?.billing?.paymentData?.branchId ||
    ride?.value?.billing?.paymentData?.branch;
  const contractBranches = Array.isArray(contract?.value?.branches)
    ? contract.value.branches
    : [];
  const selectedBranch = contractBranches.find((item: any) => item?.id === branchId);
  const branchAreas = Array.isArray(selectedBranch?.areas) ? selectedBranch.areas : [];

  return branchAreas
    .filter((item: any) => item?.areaCode)
    .map((item: any) => ({
      code: String(item.areaCode),
      name: String(item.areaName || item.areaCode),
      label: `${item.areaCode} - ${item.areaName || item.areaCode}`,
    }));
});

const openCardEdition = (card: EditableRideCard) => {
  if (!canEditRideData.value) return;
  editingCards[card] = true;

  draftRideData.departTime = String(
    form.values.departTime || ride?.value?.travel?.departTime || '',
  );
  draftRideData.passengers = Number(
    form.values.passengers || ride?.value?.travel?.passengers || 1,
  );
  draftRideData.productId = String(ride?.value?.product?.id || '');
  draftRideData.destinationAddress = String(
    ride?.value?.travel?.destinationAddress || '',
  );
  draftRideData.reason = String(form.values.reason || ride?.value?.reason || '');
  draftRideData.paymentAreaCode = String(
    ride?.value?.billing?.paymentData?.areaCode ||
      ride?.value?.billing?.paymentData?.area ||
      '',
  );
  editableStops.value = Array.isArray(ride?.value?.travel?.stops)
    ? ride.value.travel.stops.map((stop: any) => ({
        address: String(stop?.address || ''),
        lat: typeof stop?.lat === 'number' ? stop.lat : undefined,
        lng: typeof stop?.lng === 'number' ? stop.lng : undefined,
      }))
    : [];
};

const closeCardEdition = (card: EditableRideCard) => {
  editingCards[card] = false;
};

const toCoordsOrAddress = (input: any) => {
  const lat = Number(input?.lat);
  const lng = Number(input?.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return String(input?.address || '').trim();
};

const normalizeAddressForComparison = (value: unknown) => {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeStopsForComparison = (stops: any[]) => {
  if (!Array.isArray(stops)) return [] as string[];
  return stops
    .map((item: any) => normalizeAddressForComparison(item?.address))
    .filter((address: string) => address.length > 0);
};

const didStopsChange = (nextStops: any[], currentStops: any[]) => {
  const normalizedNext = normalizeStopsForComparison(nextStops);
  const normalizedCurrent = normalizeStopsForComparison(currentStops);

  if (normalizedNext.length !== normalizedCurrent.length) return true;
  return normalizedNext.some((address, index) => address !== normalizedCurrent[index]);
};

const didDestinationChange = (nextDestination: string, currentDestination: string) => {
  return (
    normalizeAddressForComparison(nextDestination) !==
    normalizeAddressForComparison(currentDestination)
  );
};

const resolveEstimatedPrice = (
  product: any,
  estimatedDistanceMeters: number,
  estimatedDurationSeconds: number,
) => {
  const parsedDistanceKm = (estimatedDistanceMeters || 0) / 1000;
  const parsedDurationMinutes = Math.ceil(estimatedDurationSeconds || 0) / 60;
  const basePrice = Number(product?.basePrice || 0);

  if (product?.type === 'contract') {
    let price = basePrice;
    const includedKms = Number(product?.includedKms || 0);
    const includedHours = Number(product?.includedHours || 0);
    const kmPrice = Number(product?.kmPrice || 0);
    const minutePrice = Number(product?.minutePrice || 0);

    if (parsedDistanceKm > includedKms) {
      price += (parsedDistanceKm - includedKms) * kmPrice;
    }

    if (parsedDurationMinutes > includedHours * 60) {
      const extraMinutes = parsedDurationMinutes - includedHours * 60;
      const extraHours = Math.ceil(extraMinutes / 60);
      price += extraHours * minutePrice * 60;
    }

    return price;
  }

  return (
    basePrice +
    parsedDistanceKm * Number(product?.kmPrice || 0) +
    parsedDurationMinutes * Number(product?.minutePrice || 0)
  );
};

const requestRideRecalculation = async ({
  nextProduct,
  nextStops,
  nextDestination,
  onAccept,
}: {
  nextProduct: any;
  nextStops: Array<{ address: string; lat?: number; lng?: number }>;
  nextDestination: { address: string; lat?: number; lng?: number };
  onAccept: () => void;
}) => {
  try {
    showRouteRecalculation.value = true;
    loadingRouteRecalculation.value = true;
    recalculationPreview.value = null;

    const originInput = toCoordsOrAddress(ride?.value?.travel?.origin);
    const stopsInput = nextStops
      .map((item) => toCoordsOrAddress(item))
      .filter((item) => Boolean(item));
    const destinationInput = toCoordsOrAddress(nextDestination);

    const departDate = String(form.values.departDate || ride?.value?.travel?.date || '');
    const departTime = String(
      form.values.departTime || ride?.value?.travel?.departTime || '',
    );
    const departureTime = new Date(`${departDate}T${departTime}:00`).toISOString();

    const routeResponse: any = await getRideRoutesService({
      locations: [originInput, ...stopsInput, destinationInput],
      departureTime,
    });

    if (!Array.isArray(routeResponse) || routeResponse.length === 0) {
      throw new Error('Não foi possível recalcular a rota deste atendimento.');
    }

    const firstRoute = routeResponse[0] || {};
    const routeDistance = Number(firstRoute?.distanceMeters || 0);
    const routeDuration = Number(String(firstRoute?.duration || '0').replace('s', ''));
    const estimatedPrice = resolveEstimatedPrice(
      nextProduct,
      routeDistance,
      routeDuration,
    );

    recalculationPreview.value = {
      estimatedDistance: routeDistance,
      estimatedDuration: routeDuration,
      estimatedPrice,
      encodedPolyline: firstRoute?.polyline?.encodedPolyline || '',
    };

    pendingRecalculationAction.value = () => {
      if (!ride?.value) return;
      onAccept();
      if (ride?.value?.travel) {
        ride.value.travel.estimatedDistance = routeDistance;
        ride.value.travel.estimatedDuration = routeDuration;
        ride.value.travel.polyLineCoords = firstRoute?.polyline?.encodedPolyline || '';
      }

      ride.value.estimatedPrice = String(estimatedPrice.toFixed(2));
      if (ride?.value?.billing) {
        ride.value.billing.ammount = String(estimatedPrice.toFixed(2));
      }
      showRouteRecalculation.value = false;
    };
  } catch (error) {
    showRouteRecalculation.value = false;
    toast({
      title: 'Oops!',
      description: 'Não foi possível recalcular o atendimento. Tente novamente.',
      variant: 'destructive',
    });
  } finally {
    loadingRouteRecalculation.value = false;
  }
};

const acceptRideRecalculation = () => {
  pendingRecalculationAction.value?.();
  pendingRecalculationAction.value = null;
};

const rejectRideRecalculation = () => {
  pendingRecalculationAction.value = null;
  showRouteRecalculation.value = false;
};

const saveDepartTimeCard = () => {
  form.setFieldValue('departTime', draftRideData.departTime);
  if (ride?.value?.travel) {
    ride.value.travel.departTime = draftRideData.departTime;
  }
  closeCardEdition('departTime');
};

const savePassengersCard = () => {
  const passengers = Math.max(1, Number(draftRideData.passengers || 1));
  form.setFieldValue('passengers', passengers);
  if (ride?.value?.travel) {
    ride.value.travel.passengers = passengers;
  }
  closeCardEdition('passengers');
};

const saveReasonCard = () => {
  if (!ride?.value) return;
  form.setFieldValue('reason', draftRideData.reason || '-');
  ride.value.reason = draftRideData.reason || '-';
  closeCardEdition('reason');
};

const savePaymentAreaCard = () => {
  if (!ride?.value) return;
  const option = paymentAreaOptions.value.find(
    (item: { code: string }) => item.code === draftRideData.paymentAreaCode,
  );
  if (!option) return;

  if (!ride?.value?.billing?.paymentData) {
    ride.value.billing.paymentData = {} as any;
  }

  ride.value.billing.paymentData.areaCode = option.code;
  ride.value.billing.paymentData.area = option.code;
  ride.value.billing.paymentData.areaName = option.name;
  closeCardEdition('paymentArea');
};

const saveProductCard = async () => {
  if (!ride?.value) return;
  const selected = availableProducts.value.find(
    (item: any) => item?.id === draftRideData.productId,
  );
  if (!selected) return;

  if (String(selected?.id || '') === String(ride?.value?.product?.id || '')) {
    closeCardEdition('product');
    return;
  }

  await requestRideRecalculation({
    nextProduct: selected,
    nextStops: Array.isArray(ride?.value?.travel?.stops) ? ride.value.travel.stops : [],
    nextDestination: {
      address: String(ride?.value?.travel?.destinationAddress || ''),
      lat: ride?.value?.travel?.destination?.lat,
      lng: ride?.value?.travel?.destination?.lng,
    },
    onAccept: () => {
      ride.value.product = selected;
      selectedProduct.value = selected;
      closeCardEdition('product');
    },
  });
};

const addEditableStop = () => {
  editableStops.value.push({ address: '' });
};

const setEditableWaypoint = (place: any, index: number) => {
  const lat = place?.geometry?.location?.lat?.();
  const lng = place?.geometry?.location?.lng?.();
  const address = String(place?.formatted_address || '').trim();

  if (!address) return;

  editableStops.value[index] = {
    address,
    lat: typeof lat === 'number' ? lat : undefined,
    lng: typeof lng === 'number' ? lng : undefined,
  };
};

const setEditableDestinationPlace = (place: any) => {
  const address = String(place?.formatted_address || '').trim();
  if (!address) return;
  draftRideData.destinationAddress = address;
};

const removeEditableStop = (index: number) => {
  editableStops.value.splice(index, 1);
};

const saveStopsCard = async () => {
  if (!ride?.value) return;
  const validStops = editableStops.value
    .map((item) => ({ ...item, address: String(item.address || '').trim() }))
    .filter((item) => item.address.length > 0);

  const currentStops = Array.isArray(ride?.value?.travel?.stops)
    ? ride.value.travel.stops
    : [];
  if (!didStopsChange(validStops, currentStops)) {
    closeCardEdition('stops');
    return;
  }

  await requestRideRecalculation({
    nextProduct: ride?.value?.product,
    nextStops: validStops,
    nextDestination: {
      address: String(ride?.value?.travel?.destinationAddress || ''),
      lat: ride?.value?.travel?.destination?.lat,
      lng: ride?.value?.travel?.destination?.lng,
    },
    onAccept: () => {
      ride.value.travel.stops = validStops as any;
      closeCardEdition('stops');
    },
  });
};

const saveDestinationCard = async () => {
  if (!ride?.value) return;
  const destinationAddress = String(draftRideData.destinationAddress || '').trim();
  if (!destinationAddress) return;

  const currentDestination = String(ride?.value?.travel?.destinationAddress || '');
  if (!didDestinationChange(destinationAddress, currentDestination)) {
    closeCardEdition('destination');
    return;
  }

  await requestRideRecalculation({
    nextProduct: ride?.value?.product,
    nextStops: Array.isArray(ride?.value?.travel?.stops) ? ride.value.travel.stops : [],
    nextDestination: {
      address: destinationAddress,
    },
    onAccept: () => {
      ride.value.travel.destinationAddress = destinationAddress;
      ride.value.travel.destination = {
        ...(ride?.value?.travel?.destination || {}),
        address: destinationAddress,
      };
      form.setFieldValue('destination', destinationAddress);
      closeCardEdition('destination');
    },
  });
};

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
});

const displayExtraHours = computed(() => resolveDisplayExtraHours(ride?.value));
const displayExtraHourPrice = computed(() => resolveDisplayExtraHourPrice(ride?.value));

waypointLocationDetails.value = ride?.value.travel.stops || [];

const toggleCancelationModal = () => {
  showCancelationModal.value = !showCancelationModal.value;
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

const onSubmit = form.handleSubmit(async (values) => {
  if (!canEditRideData.value) {
    toast({
      title: 'Edição indisponível para este status',
      description:
        'Atendimentos com status completed, in-progress ou accepted não podem ser editados.',
      variant: 'destructive',
    });
    return;
  }

  if (hasEditingBlocks.value) {
    toast({
      title: 'Finalize as edições pendentes',
      description: hasPendingRouteBlocks.value
        ? 'Salve as alterações de destino e/ou paradas antes de enviar o atendimento.'
        : 'Existe um bloco em modo de edição. Salve os cards pendentes antes de enviar.',
      variant: 'destructive',
    });
    return;
  }

  loadingSend.value = true;

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
    loadingSend.value = false;
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

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const splitPaymentFinalBaseAmount = computed(() => {
  return (
    toNumber(ride?.value?.billing?.totals?.customerChargeAmount) ||
    toNumber(ride?.value?.billing?.realized?.serviceTotal) ||
    toNumber(ride?.value?.billing?.ammountWithExtras) ||
    toNumber(ride?.value?.billing?.ammount)
  );
});

const resolveSplitEstimatedAmount = (splited: any): number => {
  const fromSplit = toNumber(splited?.amount);
  if (fromSplit > 0) {
    return fromSplit;
  }

  const baseAmount = toNumber(ride?.value?.billing?.ammount);
  const percentage = toNumber(splited?.percentage);
  return (baseAmount * percentage) / 100;
};

const resolveSplitFinalAmount = (splited: any): number => {
  const percentage = toNumber(splited?.percentage);
  return (splitPaymentFinalBaseAmount.value * percentage) / 100;
};

const shouldShowSplitEstimatedAmount = computed(() => {
  return (
    ride?.value?.status === 'completed' &&
    splitPaymentFinalBaseAmount.value > 0 &&
    splitPaymentFinalBaseAmount.value !== toNumber(ride?.value?.billing?.ammount)
  );
});

const isPartiallyInvoicedBilling = computed(
  () => String(ride?.value?.billing?.status || '') === 'partially_invoiced',
);

const splitInvoicingEntries = computed(() => {
  const entries = ride?.value?.billing?.splitInvoicing;
  return Array.isArray(entries) ? entries : [];
});

const resolveSplitInvoicingStatus = (splited: any, index: number) => {
  const targetCode = String(splited?.areaCode || splited?.area || '')
    .trim()
    .toLowerCase();

  const matchedByCode = splitInvoicingEntries.value.find((entry: any) => {
    const entryCode = String(
      entry?.areaCode || entry?.area || entry?.costCenterCode || '',
    )
      .trim()
      .toLowerCase();
    return !!targetCode && targetCode === entryCode;
  });

  const fallbackByIndex = splitInvoicingEntries.value[index];
  const resolvedEntry = matchedByCode || fallbackByIndex;

  return Boolean(resolvedEntry?.invoiced);
};

const showRideControls = computed(() => {
  return ride?.value.status !== 'completed' && ride?.value.status !== 'cancelled';
});

const canCancelRideInCorporative = computed(() => {
  const status = ride?.value?.status;
  return (
    capabilities?.value?.canCancelRide !== false &&
    status !== 'in-progress' &&
    status !== 'in_progress' &&
    status !== 'completed'
  );
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
    navigateTo('/corporative/rides/open');
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
  <main class="p-4 md:p-6">
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
          <Button
            v-if="canCancelRideInCorporative"
            @click="toggleCancelationModal"
            variant="destructive"
          >
            <X />
            Cancelar
          </Button>
        </div>
      </div>
    </section>
    <section v-if="ride?.status === 'over_quota'" class="mb-10">
      <div class="p-4 bg-amber-100 border border-amber-600 rounded-md">
        <div class="flex flex-col gap-2">
          <MessageSquareWarning class="text-amber-900" />
          <h3 class="font-bold text-amber-900 text-xl">ATENÇÃO!</h3>
          <p
            v-if="ride?.status === 'over_quota' && isMasterManager"
            class="text-amber-900 font-bold"
          >
            Este atendimento excedeu o budget da filial e está aguardando sua aprovação
            para ser confirmado.
          </p>
          <p v-else>
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
          v-if="ride?.status === 'over_quota' && isMasterManager"
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
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="p-0 bg-zinc-200">
          <CardContent class="px-4 py-6">
            <div class="flex flex-col gap-4">
              <!-- RIDE -->
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
                  v-if="ride?.status === 'in_progress' && ride?.progress?.steps?.length"
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
                    :real-polyline="
                      ride?.travel.polyLineCoords ||
                      ride?.travel.finalPolyline ||
                      ride?.travel.polyline
                    "
                    :ride-status="ride?.status"
                    :map-theme="'light'"
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
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-muted-foreground text-sm">
                      Hora de embarque (estimado)
                    </span>
                    <Button
                      v-if="canEditRideData"
                      type="button"
                      size="icon"
                      variant="ghost"
                      @click="
                        editingCards.departTime
                          ? saveDepartTimeCard()
                          : openCardEdition('departTime')
                      "
                    >
                      <Check v-if="editingCards.departTime" :size="16" />
                      <Edit v-else :size="16" />
                    </Button>
                  </div>
                  <h3 v-if="!editingCards.departTime" class="text-lg font-bold">
                    {{ ride?.travel.departTime }}
                  </h3>
                  <Input
                    v-else
                    type="time"
                    v-model="draftRideData.departTime"
                    class="mt-2 bg-white"
                  />
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
                      }}
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
                      }}
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

                  <div v-if="displayExtraHours > 0" class="my-3">
                    <span class="text-sm text-muted-foreground">Hora Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{
                        Math.ceil(displayExtraHours) <= 9
                          ? `0${Math.ceil(displayExtraHours)}`
                          : Math.ceil(displayExtraHours)
                      }}
                    </h3>
                    <span class="text-sm text-muted-foreground">Valor Hora Extra</span>
                    <h3 class="text-lg font-bold text-amber-600">
                      {{ currencyFormat(displayExtraHourPrice) }}
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
                    class="my-3 p-3 border border-amber-600 bg-amber-50 rounded-md flex flex-col gap-4"
                  >
                    <span class="text-sm text-amber-600 font-bold"> Custos extras </span>
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
                  <div class="flex w-full items-center justify-between gap-2">
                    <span class="text-muted-foreground text-sm">Serviço</span>
                    <Button
                      v-if="canEditRideData"
                      type="button"
                      size="icon"
                      variant="ghost"
                      @click="
                        editingCards.product
                          ? saveProductCard()
                          : openCardEdition('product')
                      "
                    >
                      <Check v-if="editingCards.product" :size="16" />
                      <Edit v-else :size="16" />
                    </Button>
                  </div>
                  <div v-if="!editingCards.product" class="flex items-center gap-2">
                    <SharedProductTag
                      :label="ride?.product.name"
                      :type="ride?.product.name"
                    />
                    <small>{{ ride?.product.code }}</small>
                  </div>
                  <select
                    v-else
                    v-model="draftRideData.productId"
                    class="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option
                      v-for="item in availableProducts"
                      :key="item.id"
                      :value="item.id"
                    >
                      {{ item.code }} - {{ item.name }}
                    </option>
                  </select>
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
                  <div class="flex w-full items-center justify-between gap-2">
                    <span class="text-muted-foreground text-sm">Passageiros</span>
                    <Button
                      v-if="canEditRideData"
                      type="button"
                      size="icon"
                      variant="ghost"
                      @click="
                        editingCards.passengers
                          ? savePassengersCard()
                          : openCardEdition('passengers')
                      "
                    >
                      <Check v-if="editingCards.passengers" :size="16" />
                      <Edit v-else :size="16" />
                    </Button>
                  </div>
                  <div v-if="!editingCards.passengers" class="flex items-center gap-2">
                    <Users2 :size="16" />
                    <p class="font-bold text-lg">{{ ride?.travel.passengers }}</p>
                  </div>
                  <Input
                    v-else
                    type="number"
                    min="1"
                    v-model="draftRideData.passengers"
                    class="bg-white"
                  />
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
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <Waypoints :size="16" />
                      <span class="text-muted-foreground text-sm">Paradas</span>
                    </div>
                    <Button
                      v-if="canEditRideData"
                      type="button"
                      size="icon"
                      variant="ghost"
                      @click="
                        editingCards.stops ? saveStopsCard() : openCardEdition('stops')
                      "
                    >
                      <Check v-if="editingCards.stops" :size="16" />
                      <Edit v-else :size="16" />
                    </Button>
                  </div>
                  <template v-if="!editingCards.stops">
                    <div v-if="ride?.travel?.stops?.length > 0">
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
                    <p v-else class="text-muted-foreground text-sm">Sem paradas</p>
                  </template>
                  <template v-else>
                    <div class="w-full space-y-3">
                      <div
                        v-for="(stop, index) in editableStops"
                        :key="index"
                        class="flex items-center gap-2"
                      >
                        <GMapAutocomplete
                          placeholder="Endereço da Parada"
                          @place_changed="setEditableWaypoint($event, Number(index))"
                          :value="stop.address"
                          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          @click="removeEditableStop(Number(index))"
                        >
                          <X :size="16" />
                        </Button>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" @click="addEditableStop">
                      <Plus :size="16" />
                      Adicionar parada
                    </Button>
                  </template>
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <SquareCheck :size="16" />
                      <span class="text-muted-foreground text-sm">Destino</span>
                    </div>
                    <Button
                      v-if="canEditRideData"
                      type="button"
                      size="icon"
                      variant="ghost"
                      @click="
                        editingCards.destination
                          ? saveDestinationCard()
                          : openCardEdition('destination')
                      "
                    >
                      <Check v-if="editingCards.destination" :size="16" />
                      <Edit v-else :size="16" />
                    </Button>
                  </div>
                  <p v-if="!editingCards.destination" class="font-bold text-lg">
                    {{ ride?.travel.destinationAddress }}
                  </p>
                  <GMapAutocomplete
                    v-else
                    placeholder="Insira o Destino"
                    @place_changed="setEditableDestinationPlace"
                    :value="draftRideData.destinationAddress"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div
                  class="col-span-4 p-3 flex flex-col items-start gap-2 bg-white rounded-md"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <span class="text-muted-foreground text-sm"
                      >Motivo do Atendimento</span
                    >
                    <Button
                      v-if="canEditRideData"
                      type="button"
                      size="icon"
                      variant="ghost"
                      @click="
                        editingCards.reason ? saveReasonCard() : openCardEdition('reason')
                      "
                    >
                      <Check v-if="editingCards.reason" :size="16" />
                      <Edit v-else :size="16" />
                    </Button>
                  </div>
                  <p v-if="!editingCards.reason" class="font-bold text-lg">
                    {{ ride?.reason ?? '-' }}
                  </p>
                  <Input v-else v-model="draftRideData.reason" class="bg-white" />
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
                        {{ ride?.billing?.paymentData?.branchCode }} -
                        {{ ride?.billing?.paymentData?.branchName }}
                      </p>
                    </div>
                    <div class="space-y-2">
                      <small class="text-[10px] text-muted-foreground">
                        CENTRO DE CUSTO
                      </small>
                      <div class="flex items-center gap-2">
                        <p
                          v-if="!editingCards.paymentArea"
                          class="text-sm uppercase font-bold"
                        >
                          {{
                            ride?.billing.paymentData.splitedPayment.length
                              ? 'RATEIO'
                              : ride?.billing.paymentData.areaCode
                          }}
                        </p>
                        <select
                          v-else
                          v-model="draftRideData.paymentAreaCode"
                          class="h-9 rounded-md border border-input bg-white px-2 text-xs"
                        >
                          <option
                            v-for="option in paymentAreaOptions"
                            :key="option.code"
                            :value="option.code"
                          >
                            {{ option.label }}
                          </option>
                        </select>
                        <Button
                          v-if="
                            canEditRideData &&
                            !ride?.billing?.paymentData?.splitedPayment?.length
                          "
                          type="button"
                          size="icon"
                          variant="ghost"
                          @click="
                            editingCards.paymentArea
                              ? savePaymentAreaCard()
                              : openCardEdition('paymentArea')
                          "
                        >
                          <Check v-if="editingCards.paymentArea" :size="14" />
                          <Edit v-else :size="14" />
                        </Button>
                      </div>
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
                    v-if="ride?.billing.paymentData.splitedPayment.length"
                    class="p-4 border border-zinc-950 rounded-md w-full space-y-4"
                  >
                    <p class="font-bold">Faturamento rateado entre filiais</p>
                    <ul class="space-y-4">
                      <li
                        v-for="(splited, index) in ride?.billing.paymentData
                          .splitedPayment"
                        :key="index"
                        class="md:grid md:grid-cols-3 gap-6"
                      >
                        <div>
                          <small class="text-xxs text-muted-foreground uppercase">
                            Cód. do CC
                          </small>
                          <p class="font-bold">
                            {{ splited.areaCode || splited.area || '-' }}
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
                          <p
                            v-if="shouldShowSplitEstimatedAmount"
                            class="text-sm text-muted-foreground line-through"
                          >
                            {{ currencyFormat(resolveSplitEstimatedAmount(splited)) }}
                          </p>
                          <p class="font-bold">
                            {{
                              currencyFormat(
                                shouldShowSplitEstimatedAmount
                                  ? resolveSplitFinalAmount(splited)
                                  : resolveSplitEstimatedAmount(splited),
                              )
                            }}
                          </p>
                          <span
                            v-if="isPartiallyInvoicedBilling"
                            class="mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                            :class="
                              resolveSplitInvoicingStatus(splited, Number(index))
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            "
                          >
                            {{
                              resolveSplitInvoicingStatus(splited, Number(index))
                                ? 'Faturado'
                                : 'Não Faturado'
                            }}
                          </span>
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
                <div
                  v-if="ride.user.isVisitor && ride.user.isVisitor === true"
                  class="space-y-2"
                >
                  <span
                    class="block w-fit my-3 px-2 py-1.5 bg-green-600 text-xs text-white rounded-md uppercase"
                  >
                    visitante
                  </span>
                  <h2 class="font-bold text-lg">{{ ride?.user.visitorData.name }}</h2>
                  <p class="flex items-center gap-2 text-sm">
                    <Phone :size="16" />
                    <a
                      :href="
                        WPP_API.replace(
                          '[[phone]]',
                          sanitizePhone(ride?.user.visitorData.phone as string),
                        )
                      "
                      class="flex items-center gap-2"
                      target="_blank"
                    >
                      {{ ride?.user.visitorData.phone }}
                      <MessageCircleMore :size="18" class="text-green-500" />
                    </a>
                  </p>
                  <p class="flex items-center gap-2 text-sm">
                    <Building :size="16" />{{ ride?.user.visitorData.company }}
                  </p>
                  <p class="flex items-center gap-2 text-sm">
                    <span class="font-bold">Motivo da visita:</span>
                    {{ ride?.user.visitorData.reason }}
                  </p>
                  <p class="flex items-center gap-2 text-sm">
                    <span class="font-bold">Responsável:</span>
                    {{ ride?.user.visitorData.host }}
                  </p>
                </div>
                <div v-else class="space-y-2">
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
              <div
                v-if="hasAdditionalInfoContent"
                class="p-4 rounded-md border border-zinc-400 bg-white space-y-4"
              >
                <div class="flex items-center gap-2">
                  <MessageSquareWarning />
                  <h4 class="text-lg font-bold">Informações Adicionais</h4>
                </div>
                <div
                  v-if="additionalInfoContent.text"
                  class="rounded-md bg-zinc-50 p-4 text-sm text-zinc-800 whitespace-pre-line"
                >
                  {{ additionalInfoContent.text }}
                </div>
                <div v-if="additionalInfoContent.attachments.length" class="space-y-3">
                  <p class="text-sm font-semibold text-zinc-700">Arquivos anexados</p>
                  <div
                    v-for="(attachment, index) in additionalInfoContent.attachments"
                    :key="`${attachment.url}-${index}`"
                    class="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 bg-zinc-50"
                  >
                    <a
                      :href="attachment.url"
                      target="_blank"
                      class="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 underline"
                    >
                      {{ attachment.name || `Anexo ${Number(index) + 1}` }}
                    </a>
                    <a
                      :href="attachment.url"
                      target="_blank"
                      class="rounded-md p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Link :size="16" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <FormButtons
          :cancel="'/corporative/rides/open'"
          :loading="loadingSend"
          :disabled="loadingSend || hasEditingBlocks || !canEditRideData"
          sbm-label="Salvar Atendimento"
          cnc-label="Cancelar"
        />
      </form>
    </section>
  </main>
  <Dialog :open="showRouteRecalculation" @update:open="showRouteRecalculation = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="text-center">Recalcular Atendimento</DialogTitle>
      </DialogHeader>

      <DialogDescription v-if="loadingRouteRecalculation">
        <div class="py-8 flex flex-col gap-3 items-center">
          <LoaderCircle class="animate-spin text-zinc-900" :size="48" />
          <p class="text-xs">Calculando novos valores...</p>
        </div>
      </DialogDescription>

      <DialogDescription v-else-if="recalculationPreview" class="space-y-3">
        <p class="text-sm text-zinc-900">
          Foram detectadas mudanças estruturais no atendimento. Confira os novos valores
          antes de salvar.
        </p>
        <div class="p-3 rounded-md border border-zinc-200 bg-zinc-50 space-y-2">
          <p class="text-sm">
            Distância estimada:
            <span class="font-bold">
              {{ convertMetersToDistance(recalculationPreview.estimatedDistance) }}
            </span>
          </p>
          <p class="text-sm">
            Duração estimada:
            <span class="font-bold">
              {{ convertSecondsToTime(recalculationPreview.estimatedDuration) }}
            </span>
          </p>
          <p class="text-sm">
            Valor estimado:
            <span class="font-bold">
              {{ currencyFormat(recalculationPreview.estimatedPrice) }}
            </span>
          </p>
        </div>
      </DialogDescription>

      <DialogFooter>
        <div class="w-full flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            :disabled="loadingRouteRecalculation"
            @click="rejectRideRecalculation"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            :disabled="loadingRouteRecalculation || !recalculationPreview"
            @click="acceptRideRecalculation"
          >
            Aceitar novos valores
          </Button>
        </div>
      </DialogFooter>
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
</template>

<style scoped></style>
