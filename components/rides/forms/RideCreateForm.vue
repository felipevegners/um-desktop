<script setup lang="ts">
import CieloCheckoutUrl from '@/components/payments/CieloCheckoutUrl.vue';
import StripeCheckout from '@/components/payments/StripeCheckout.vue';
import DatePickerRange from '@/components/shared/DatePickerRange.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import NewDatePicker from '@/components/shared/NewDatePicker.vue';
import ProductTag from '@/components/shared/ProductTag.vue';
import RenderIcon from '@/components/shared/RenderIcon.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast/use-toast';
import { paymentMethods } from '@/config/paymentMethods';
import { getRideRoutesService } from '@/server/services/rides';
import { useAccountStore } from '@/stores/account.store';
import { useBranchesStore } from '@/stores/branches.store';
import { useContractsStore } from '@/stores/contracts.store';
import { useProductsStore } from '@/stores/products.store';
import { useRidesStore } from '@/stores/rides.store';
import type { Product } from '@/types/products/types';
import { toTypedSchema } from '@vee-validate/zod';
import { useMediaQuery } from '@vueuse/core';
import {
  CalendarPlus,
  CalendarRange,
  Info,
  InfoIcon,
  LoaderCircle,
  Minus,
  Percent,
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
import VisitorUserForm from '~/components/forms/VisitorUserForm.vue';
import SplitPaymentCCs from '~/components/shared/SplitPaymentCCs.vue';
import {
  convertMetersToDistance,
  convertSecondsToTime,
  currencyFormat,
  polyLineCodec,
  sanitizeRideDate,
} from '~/lib/utils';

useHead({
  title: 'Backoffice - Novo Atendimento | Urban Mobi',
});

// Component props
interface Props {
  userRole?: 'admin' | 'corporative';
}

const props = withDefaults(defineProps<Props>(), {
  userRole: 'admin',
});

// Determine if this is admin mode or corporative mode
const isAdminMode = computed(() => props.userRole === 'admin');
const isCorporativeMode = computed(() => props.userRole === 'corporative');
const isMobileViewport = useMediaQuery('(max-width: 767px)');

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

const { toast } = useToast();
const { data } = useAuth();

// Session data (used for corporative mode)
const currentUserId: string | undefined = (data.value?.user as any)?.id;
const contractId: string | undefined = (data.value?.user as any)?.contract?.contractId;
const userBranches: any[] | undefined = (data.value?.user as any)?.contract?.branches;
const userBranchIdSession: string | undefined = (data.value?.user as any)?.contract
  ?.branchId;
const role: string | undefined = (data.value?.user as any)?.role;
const name: string | undefined = (data.value?.user as any)?.name;

const contractsStore = useContractsStore();
const accountStore = useAccountStore();
const ridesStore = useRidesStore();
const productsStore = useProductsStore();
const branchesStore = useBranchesStore();

const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);
const { getUsersAccountsByContractIdAction, getUsersAccountsAction } = accountStore;
const { accounts } = storeToRefs(accountStore);
const { createRideAction } = ridesStore;
const { getBranchByIdAction, updateBranchAction } = branchesStore;
const { branch } = storeToRefs(branchesStore);
const { getProductsAction } = productsStore;
const { products } = storeToRefs(productsStore);

// State
const rideCode = ref('');
const loadingProducts = ref<boolean>(false);
const showAvailableProducts = ref<boolean>(false);
const availableProducts = ref<any>([]);
const addonProducts = ref<any>([]);
const selectedProduct = ref<any>({});
const availableUsers = ref<any>([]);
const selectedUser = ref<any>({
  id: '',
  name: '',
  email: '',
  phone: '',
  role: isAdminMode ? 'platform-user' : 'platform-corp-user',
});

const visitorUser = ref(false);
const showGenerateRide = ref<boolean>(false);
const ridePassengers = ref(1);
const paymentMethod = ref<any>('');
const paymentMethodList = ref<any>(paymentMethods);
const paymentStatus = ref<string>('unpaid');
const paymentLinkUrl = ref<string>('');
const contractBranches = ref<any>();
const contractBranchAreas = ref<any>();
const contractBranchesList = ref<any>();
const selectedUserBranchName = ref<string>();
const loadingAreas = ref<boolean>(false);
const enablePayment = ref<boolean>(false);
const showPaymentArea = ref<boolean>(false);
const splitPaymentAreas = ref<boolean>(false);
const totalRideRated = ref<any>('');
const remainingRideAmount = ref<any>('0.00');
const showAddCCToShareBtn = ref<boolean>(true);
const splitPaymentCCAreas = ref<any>([]);

const calculatedEstimates = ref({
  estimatedDistance: 0,
  estimatedDuration: 0,
  estimatedPrice: '',
  estimatedTotalPrice: '',
});

const availableContractBranchAreas = computed(() => {
  if (!contractBranchAreas.value) return [];
  const usedAreas = splitPaymentCCAreas.value
    .map((item: any) => item.area)
    .filter((area: string) => area && area !== '');
  return contractBranchAreas.value.map((item: any) => ({
    ...item,
    disabled: usedAreas.includes(item.value),
  }));
});

const showWaypointsForm = ref<boolean>(false);
const isRoundTrip = ref<boolean>(false);
const isRecurringRide = ref<boolean>(false);
const recurrenceRange = ref<any>(null);
const recurrenceWeekdays = ref<number[]>([]);
const showContractProductAlert = ref<boolean>(false);
const loadingGenerateRide = ref<boolean>(false);
const routeWaypoints = ref<any>([{ address: '' }]);
const originCoords = ref<any>({ lat: '', lng: '' });
const originLocationDetails = ref<any>({ address: '', url: '' });
const waypointCoords = ref<any>([]);
const waypointLocationDetails = ref<any>([]);
const destinationCoords = ref<any>({ lat: '', lng: '' });
const destinationLocationDetails = ref<any>({ address: '', url: '' });
const routePolyLine = ref();
const loadingRoute = ref<boolean>(false);
const mapCenter = ref<any>({ lat: -23.55012592233407, lng: -46.63425371400603 });
const mapRef = ref<any>(null);
const ridePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 5,
});
const markers = ref<any>([]);
const showRenderedMap = ref<boolean>(false);

// Computed zoom based on mode
const initialZoom = computed(() => (isAdminMode ? 1 : 2));

const recurrenceWeekdayOptions = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
];

const toggleRecurrenceWeekday = (weekday: number) => {
  if (recurrenceWeekdays.value.includes(weekday)) {
    recurrenceWeekdays.value = recurrenceWeekdays.value.filter((day) => day !== weekday);
    return;
  }
  recurrenceWeekdays.value = [...recurrenceWeekdays.value, weekday];
};

const toIsoDate = (dateValue: any): string | null => {
  if (!dateValue) return null;
  if (
    typeof dateValue === 'object' &&
    typeof dateValue.year === 'number' &&
    typeof dateValue.month === 'number' &&
    typeof dateValue.day === 'number'
  ) {
    const month = String(dateValue.month).padStart(2, '0');
    const day = String(dateValue.day).padStart(2, '0');
    return `${dateValue.year}-${month}-${day}`;
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return dateValue;
  }
  return null;
};

const resolveRecurringDates = (baseDepartDate: string): string[] => {
  if (!isRecurringRide.value) {
    return [baseDepartDate];
  }
  const startIso = toIsoDate(recurrenceRange.value?.start);
  const endIso = toIsoDate(recurrenceRange.value?.end);
  if (!startIso || !endIso || recurrenceWeekdays.value.length === 0) {
    return [baseDepartDate];
  }
  const startDate = new Date(`${startIso}T00:00:00`);
  const endDate = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [baseDepartDate];
  }
  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (recurrenceWeekdays.value.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates.length > 0 ? dates : [baseDepartDate];
};

onBeforeMount(async () => {
  // Use props.userRole directly instead of computed to avoid race conditions
  if (props.userRole === 'admin') {
    // Admin mode initialization
    await getUsersAccountsAction();

    const filteredUsers = accounts.value.filter(
      (user: any) =>
        user.enabled === true &&
        user.role !== 'admin' &&
        user.role !== 'platform-driver' &&
        user.emailConfirmed === true,
    );

    availableUsers.value = filteredUsers.map((user: any) => {
      return {
        label: user.username,
        value: user.id,
      };
    });
  } else if (props.userRole === 'corporative') {
    // Corporative mode initialization
    // Validate contractId before attempting to load
    if (!contractId || contractId === '-' || !contractId.trim()) {
      toast({
        title: 'Erro de Inicialização',
        description: 'ID de contrato inválido. Contate o administrador.',
        variant: 'destructive',
      });
      return;
    }

    await getContractByIdAction(contractId as string);
    await getUsersAccountsByContractIdAction(contractId as string);

    let managedBranches: Array<any> = [];
    const sessionBranches = userBranches;
    const sessionBranchId = userBranchIdSession;

    if (Array.isArray(sessionBranches) && sessionBranches.length > 0) {
      managedBranches = sessionBranches;
    } else if (
      sessionBranchId &&
      contract?.value?.branches &&
      contract?.value?.branches.length > 0
    ) {
      const found = contract?.value?.branches.find((b: any) => b.id === sessionBranchId);
      if (found) {
        managedBranches = [found];
      } else {
        managedBranches = [{ id: sessionBranchId }];
      }
    }

    if (role === 'branch-manager') {
      const filteredAccounts = (accounts?.value || []).filter((user: any) => {
        const accountBranchIds = [
          ...(typeof user?.contract?.branchId === 'string'
            ? [user.contract.branchId]
            : []),
          ...(Array.isArray(user?.contract?.branches)
            ? user.contract.branches
                .map((branch: any) => branch?.id)
                .filter(
                  (id: unknown): id is string => typeof id === 'string' && id.length > 0,
                )
            : []),
        ];
        if (accountBranchIds.length === 0) return false;
        return accountBranchIds.some((branchId: string) =>
          managedBranches.some((branch) => branch.id === branchId),
        );
      });

      availableUsers.value = filteredAccounts.map((user: any) => {
        const userBranchId =
          user?.contract?.branchId ??
          (Array.isArray(user?.contract?.branches) && user.contract.branches[0]?.id) ??
          undefined;
        const findBranch =
          managedBranches.find((b: any) => b.id === userBranchId) ||
          (contract?.value?.branches || []).find((b: any) => b.id === userBranchId) ||
          null;
        const branchLabel = findBranch?.fantasyName ? ' - ' + findBranch.fantasyName : '';
        const isCurrent = currentUserId === user.id;
        return {
          label: `${user.username}${branchLabel}${isCurrent ? ' - Você' : ''}`,
          value: user.id,
        };
      });
    } else {
      availableUsers.value = (accounts?.value || []).map((user: any) => {
        const isCurrent = currentUserId === user.id;
        return {
          label: `${user.username}${isCurrent ? ' - Você' : ''}`,
          value: user.id,
        };
      });
    }
  }

  await getProductsAction();
  addonProducts.value = products.value.filter(
    (product: Product) => product.type === 'addon',
  );
});

const addWaypointRow = () => {
  routeWaypoints.value.push({ address: '' });
};

const removeWaypointRow = (index: number) => {
  routeWaypoints.value.splice(index, 1);
  waypointLocationDetails.value.splice(index, 1);
  waypointCoords.value.splice(index, 1);
};

const setWaypoints = (place: any, index: number) => {
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const waypoint = {
    address: place.formatted_address,
    coords: { lat, lng },
  };
  waypointCoords.value[index] = waypoint.coords;
  waypointLocationDetails.value[index] = waypoint;
  routeWaypoints.value[index].address = place.formatted_address;
};

const addPassengers = () => {
  ridePassengers.value++;
};

const removePassengers = () => {
  if (ridePassengers.value > 1) {
    ridePassengers.value--;
  }
};

const setSelectedProduct = (value: any) => {
  if (isAdminMode) {
    showContractProductAlert.value = false;
    showRenderedMap.value = false;
    selectedProduct.value = {};
  }
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
  if (isAdminMode && value.type === 'contract') {
    showContractProductAlert.value = true;
  }
  ridePassengers.value = 1;
};

const getBranchAreas = (value: string) => {
  loadingAreas.value = true;
  const selectedBranch = contractBranches.value.find(
    (branch: any) => branch.id === value,
  );

  if (selectedBranch) {
    selectedUserBranchName.value = selectedBranch.fantasyName;
    const userBranchBudget = parseFloat(selectedBranch.budget);
    const availableBudget = userBranchBudget - parseFloat(selectedBranch.usedBudget);
    availableBranchBudget.value = availableBudget.toString();
    usedBranchBudget.value = selectedBranch.usedBudget;
  }

  contractBranchAreas.value = selectedBranch.areas.map((area: any) => {
    return {
      label: `${area.areaCode ? area.areaCode : '0000'} - ${area.areaName ? area.areaName : 'Geral'}`,
      value: area.areaCode ? area.areaCode : '0000',
    };
  });
  setTimeout(() => {
    loadingAreas.value = false;
  }, 500);
};

const availableBranchBudget = ref<string>('');
const usedBranchBudget = ref<string>('');
const showBranchBudgetAlert = ref<boolean>(false);

const setSelectedUser = async (user: any) => {
  showAvailableProducts.value = false;
  availableProducts.value = [];
  selectedProduct.value = [];
  contractBranchesList.value = [];
  contractBranchAreas.value = [];

  const userId = user?.value?.value;
  const userData: any = accounts?.value.find((account: any) => account.id === userId);

  selectedUser.value = {
    contract: { ...userData?.contract },
    id: userData.id,
    name: userData.username,
    email: userData.email,
    phone: userData.phone,
    role: userData?.role,
  };

  if (isAdminMode) {
    // Admin mode logic
    if (userData.role === 'platform-user') {
      try {
        showAvailableProducts.value = true;
        loadingProducts.value = true;
        const regularProducts = products.value.filter(
          (product: Product) => product.type !== 'addon',
        );
        availableProducts.value = regularProducts.sort(
          (a: Product, b: Product) =>
            ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(a.name) -
            ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(b.name),
        );
        loadingProducts.value = false;
        paymentMethodList.value = paymentMethods.filter(
          (method) => method.value !== 'corporative',
        );
      } catch (error) {
        toast({
          title: 'Opss!',
          class: 'bg-red-500 border-0 text-white text-2xl',
          description: `Erro ao buscar os produtos. Tente novamente.`,
        });
      }
    } else if (userData.contract.contractId !== '-') {
      try {
        showAvailableProducts.value = true;
        loadingProducts.value = true;
        await getContractByIdAction(userData.contract.contractId);
        availableProducts.value = contract?.value.products.sort(
          (a: Product, b: Product) =>
            ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(a.name) -
            ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(b.name),
        );
        contractBranches.value = contract?.value.branches;

        if (!contractBranches.value || contractBranches.value.length === 0) {
          throw new Error('Nenhuma filial disponível no contrato.');
        }

        const isMasterManager = userData.role === 'master-manager';
        let effectiveBranchId = userData?.contract?.branchId;
        const isValidBranchId =
          effectiveBranchId &&
          typeof effectiveBranchId === 'string' &&
          effectiveBranchId.trim() &&
          effectiveBranchId.trim() !== '-';

        if (!isValidBranchId) {
          effectiveBranchId = contractBranches.value[0]?.id;
        }

        if (
          !effectiveBranchId ||
          typeof effectiveBranchId !== 'string' ||
          !effectiveBranchId.trim()
        ) {
          throw new Error('Nenhuma filial disponível no contrato para faturamento.');
        }

        const filterUserBranch = contractBranches.value.find(
          (branch: any) => branch.id === effectiveBranchId,
        );

        if (!filterUserBranch) {
          throw new Error('Filial de origem do usuário não encontrada para faturamento.');
        }

        selectedUserBranchName.value = filterUserBranch.fantasyName;
        const userBranchBudget = parseFloat(filterUserBranch.budget);
        const availableBudget =
          userBranchBudget - parseFloat(filterUserBranch.usedBudget);
        availableBranchBudget.value = availableBudget.toString();
        usedBranchBudget.value = filterUserBranch.usedBudget;

        contractBranchesList.value = isMasterManager
          ? contractBranches.value.map((branch: any) => {
              return {
                label: `${branch.branchCode} - ${branch.fantasyName}`,
                value: branch.id,
              };
            })
          : [
              {
                label: `${filterUserBranch.branchCode} - ${filterUserBranch.fantasyName}`,
                value: filterUserBranch.id,
              },
            ];

        if (!isMasterManager) {
          form.setFieldValue('branch' as any, filterUserBranch.id);
          getBranchAreas(filterUserBranch.id);
        } else {
          form.setFieldValue('area' as any, contractBranchesList.value[0].value);
          getBranchAreas(contractBranchesList.value[0].value);
        }
        loadingProducts.value = false;
        paymentMethodList.value = paymentMethods;
      } catch (error) {
        toast({
          title: 'Opss!',
          class: 'bg-red-500 border-0 text-white text-2xl',
          description: `Erro ao buscar os produtos do contracto. Tente novamente.`,
        });
      }
    }
  } else {
    // Corporative mode logic - always assume contract products
    try {
      showAvailableProducts.value = true;
      loadingProducts.value = true;
      await getContractByIdAction(userData.contract.contractId);
      availableProducts.value = contract?.value.products.sort(
        (a: Product, b: Product) =>
          ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(a.name) -
          ['EASY', 'PREMIUM', 'GOLD', 'BLINDADO', 'VAN'].indexOf(b.name),
      );
      contractBranches.value = contract?.value.branches;

      if (!contractBranches.value || contractBranches.value.length === 0) {
        throw new Error('Nenhuma filial disponível no contrato.');
      }

      const isMasterManager = userData.role === 'master-manager';
      let effectiveBranchId = userData?.contract?.branchId;
      const isValidBranchId =
        effectiveBranchId &&
        typeof effectiveBranchId === 'string' &&
        effectiveBranchId.trim() &&
        effectiveBranchId.trim() !== '-';

      if (!isValidBranchId) {
        effectiveBranchId = contractBranches.value[0]?.id;
      }

      if (
        !effectiveBranchId ||
        typeof effectiveBranchId !== 'string' ||
        !effectiveBranchId.trim()
      ) {
        throw new Error('Nenhuma filial disponível no contrato para faturamento.');
      }

      const filterUserBranch = contractBranches.value.find(
        (branch: any) => branch.id === effectiveBranchId,
      );

      if (!filterUserBranch) {
        throw new Error('Filial de origem do usuário não encontrada para faturamento.');
      }

      selectedUserBranchName.value = filterUserBranch.fantasyName;
      const userBranchBudget = parseFloat(filterUserBranch.budget);
      const availableBudget = userBranchBudget - parseFloat(filterUserBranch.usedBudget);
      availableBranchBudget.value = availableBudget.toString();
      usedBranchBudget.value = filterUserBranch.usedBudget;

      contractBranchesList.value = isMasterManager
        ? contractBranches.value.map((branch: any) => {
            return {
              label: `${branch.branchCode} - ${branch.fantasyName}`,
              value: branch.id,
            };
          })
        : [
            {
              label: `${filterUserBranch.branchCode} - ${filterUserBranch.fantasyName}`,
              value: filterUserBranch.id,
            },
          ];

      if (!isMasterManager) {
        form.setFieldValue('branch', filterUserBranch.id);
        getBranchAreas(filterUserBranch.id);
      } else {
        form.setFieldValue('area', contractBranchesList.value[0].value);
        getBranchAreas(contractBranchesList.value[0].value);
      }

      loadingProducts.value = false;
      paymentMethodList.value = paymentMethods.filter((method) => method.value !== 'pix');
    } catch (error) {
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Erro ao buscar os produtos do seu contrato. Tente novamente.`,
      });
    }
  }
};

const setPaymentMethod = (value: any) => {
  paymentMethod.value = value;
  const ridePriceOverQuota =
    parseFloat(calculatedEstimates.value.estimatedTotalPrice) >
    Number(availableBranchBudget.value);
  if (value === 'corporative' && ridePriceOverQuota) {
    showBranchBudgetAlert.value = true;
  } else {
    showBranchBudgetAlert.value = false;
  }
};

const branchBudgetOverQuota = ref(false);
const handleAcceptBudgetOverQuota = () => {
  showBranchBudgetAlert.value = false;
  branchBudgetOverQuota.value = true;
};

const decodePolyline = (polyline: string) => {
  const decode: any = polyLineCodec(polyline);
  const coords = decode.map((path: any) => ({
    lat: path[0],
    lng: path[1],
  }));

  if (!coords.length) {
    ridePath.value = { ...ridePath.value, path: [] };
    markers.value = [];
    return;
  }

  ridePath.value = { ...ridePath.value, path: [...coords] };

  const centerLat =
    coords.reduce((sum: number, point: any) => sum + point.lat, 0) / coords.length;
  const centerLng =
    coords.reduce((sum: number, point: any) => sum + point.lng, 0) / coords.length;
  mapCenter.value = { lat: centerLat, lng: centerLng };

  const stopsMarkers = waypointLocationDetails.value
    .filter((waypoint: any) => waypoint?.coords?.lat && waypoint?.coords?.lng)
    .map((waypoint: any) => {
      return {
        lat: waypoint.coords.lat,
        lng: waypoint.coords.lng,
        icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStop),
      };
    });

  markers.value = [
    {
      lat: coords[0].lat,
      lng: coords[0].lng,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStart),
    },
    ...stopsMarkers,
    {
      lat: coords[coords.length - 1].lat,
      lng: coords[coords.length - 1].lng,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconEnd),
    },
  ];
};

const selectedRideAddons = ref<any>([]);
const rideExtraKms = ref<number>(0);
const rideExtraHours = ref<number>(0);
const rideExtraKmPrice = ref<string>('');
const rideExtraHourPrice = ref<string>('');

const handleRideCalculation = async () => {
  const validateForm = await form.validate();
  if (!validateForm.valid) {
    const targetElement = document.getElementById('ride-info');
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  try {
    loadingRoute.value = true;

    const locations = [
      { lat: originCoords.value.lat, lng: originCoords.value.lng },
      ...waypointLocationDetails.value.map((wp: any) =>
        wp.coords ? { lat: wp.coords.lat, lng: wp.coords.lng } : wp.address,
      ),
      { lat: destinationCoords.value.lat, lng: destinationCoords.value.lng },
      ...(isRoundTrip.value
        ? [{ lat: originCoords.value.lat, lng: originCoords.value.lng }]
        : []),
    ];
    const departDate = form.values.departDate;
    const departTime = form.values.departTime;
    const dt = new Date(`${departDate}T${departTime}:00`);
    const departureTime = dt.toISOString();

    const routeCalculation: any = await getRideRoutesService({
      locations,
      departureTime,
    });

    if (
      !routeCalculation ||
      !Array.isArray(routeCalculation) ||
      routeCalculation.length === 0
    ) {
      console.error('Route response is not an array:', routeCalculation);
      const serverMsg =
        (routeCalculation &&
          (routeCalculation.message ||
            routeCalculation.error ||
            routeCalculation.statusMessage ||
            routeCalculation.data?.message)) ||
        'Nenhuma rota retornada pelo servidor';
      throw new Error(serverMsg);
    }

    const firstRoute = routeCalculation[0] || {};
    routePolyLine.value = firstRoute?.polyline?.encodedPolyline || '';
    const basePrice = parseFloat(selectedProduct?.value.basePrice || '0');
    const durationStr = firstRoute?.duration ? String(firstRoute.duration) : null;
    if (!durationStr) throw new Error('Rota retornada sem duração');
    const sanitizeDurationResponse = durationStr.replace('s', '');
    const duration = Math.ceil(Number(sanitizeDurationResponse)) / 60;
    const distance = (firstRoute?.distanceMeters || 0) / 1000;

    if (selectedProduct.value.type === 'contract') {
      let ridePrice = parseFloat(basePrice.toFixed(2));

      if (distance > selectedProduct.value.includedKms) {
        const extraKms = distance - selectedProduct.value.includedKms;
        const diffPrice = extraKms * parseFloat(selectedProduct?.value.kmPrice);
        rideExtraKmPrice.value = diffPrice.toFixed(2).toString();
        rideExtraKms.value = extraKms;
        ridePrice += diffPrice;
      }
      if (duration > selectedProduct.value.includedHours * 60) {
        const extraMinutes = duration - selectedProduct.value.includedHours * 60;
        const extraHours = Math.ceil(extraMinutes / 60);
        const diffPriceDuration =
          extraHours * parseFloat(selectedProduct?.value.minutePrice) * 60;
        rideExtraHourPrice.value = diffPriceDuration.toFixed(2).toString();
        rideExtraHours.value = extraHours;
        ridePrice += diffPriceDuration;
      }
      calculatedEstimates.value.estimatedPrice = ridePrice.toFixed(2).toString();
      calculatedEstimates.value.estimatedTotalPrice = ridePrice.toFixed(2).toString();
      remainingRideAmount.value = ridePrice.toFixed(2).toString();
      if (isCorporativeMode) {
        showContractProductAlert.value = true;
      }
    } else {
      const ridePrice =
        basePrice +
        distance * parseFloat(selectedProduct?.value.kmPrice) +
        duration * parseFloat(selectedProduct?.value.minutePrice);
      calculatedEstimates.value.estimatedPrice = ridePrice.toFixed(2).toString();
      calculatedEstimates.value.estimatedTotalPrice = ridePrice.toFixed(2).toString();
      remainingRideAmount.value = ridePrice.toFixed(2).toString();
    }

    calculatedEstimates.value.estimatedDistance = firstRoute?.distanceMeters || 0;
    calculatedEstimates.value.estimatedDuration = parseInt(sanitizeDurationResponse);

    if (form.values.rideAddons.length) {
      const actualRidePrice = calculatedEstimates.value.estimatedPrice;
      const filteredAddons = addonProducts.value.filter((item: Product) =>
        form.values.rideAddons.includes(item.id),
      );
      selectedRideAddons.value = filteredAddons;
      const calculateAddons = filteredAddons?.reduce((acc: any, curr: any) => {
        return acc + parseFloat(curr.basePrice);
      }, 0);

      const finalPrice = parseFloat(actualRidePrice) + calculateAddons;
      calculatedEstimates.value.estimatedTotalPrice = finalPrice.toFixed(2).toString();
      remainingRideAmount.value = finalPrice.toFixed(2).toString();
    }
  } catch (error) {
    console.error('Failed to calculate route:', error);
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao calcular a rota. Tente novamente.`,
    });
    loadingRoute.value = false;
  } finally {
    if (routePolyLine.value) {
      decodePolyline(routePolyLine.value);
      showRenderedMap.value = true;
      showGenerateRide.value = true;

      const targetElement = document.getElementById('ride-map');
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }

    loadingRoute.value = false;
  }
};

watch(
  () => mapRef.value?.ready,
  (ready) => {
    if (ready) {
      const map = mapRef.value.map;
      //@ts-ignore
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(
        //@ts-ignore
        new google.maps.LatLng(originCoords.value.lat, originCoords.value.lng),
      );
      bounds.extend(
        //@ts-ignore
        new google.maps.LatLng(destinationCoords.value.lat, destinationCoords.value.lng),
      );
      map.fitBounds(bounds);
    }
  },
);

const setOriginPlace = (place: any) => {
  originCoords.value.lat = place.geometry.location.lat();
  originCoords.value.lng = place.geometry.location.lng();
  originLocationDetails.value.address = place.formatted_address;
  originLocationDetails.value.url = place.url;
  form.setValues({ origin: place.formatted_address });
};

const setDestinationPlace = (place: any) => {
  destinationCoords.value.lat = place.geometry.location.lat();
  destinationCoords.value.lng = place.geometry.location.lng();
  destinationLocationDetails.value.address = place.formatted_address;
  destinationLocationDetails.value.url = place.url;
  form.setValues({ destination: place.formatted_address });
};

const generateRideCode = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const seconds = String(today.getSeconds()).padStart(2, '0');
  const milliseconds = String(today.getMilliseconds()).padStart(3, '0');
  const randomSuffix = Math.random().toString(36).slice(2, 5).toUpperCase();

  return `UM-${day}${month}${year}${hours}${minutes}${seconds}${milliseconds}${randomSuffix}`;
};

rideCode.value = generateRideCode();

const validateDepartTime = (data: any) => {
  const { departDate, departTime } = data;
  if (!departDate || !departTime) {
    return true;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().split('T')[0];

  if (departDate === todayIso) {
    const [departHour, departMinute] = departTime.split(':').map(Number);
    const departTimeInMinutes = departHour * 60 + departMinute;
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const minimumTimeInMinutes = currentTimeInMinutes + 120;
    if (departTimeInMinutes < minimumTimeInMinutes) {
      return false;
    }
  }
  return true;
};

const dynamicSchema = computed(() => {
  const baseSchema = z.object({
    departTime: z.string(),
    departDate: z
      .string()
      .refine((v) => v, { message: 'A data do atendimento é obrigatória!' }),
    origin: z.string(),
    destination: z.string(),
    observations: z.string().optional(),
    rideAddons: z.any(),
    reason: z.string().min(1).max(100),
    branch: z.string().optional(),
    area: z.string().optional(),
  });

  let schemaToValidate = baseSchema;

  if (visitorUser.value) {
    schemaToValidate = baseSchema.extend({
      visitorName: z
        .string({ message: 'Obrigatório!' })
        .min(2, 'Insira ao menos 2 caracteres!'),
      visitorPhone: z.string().min(2, 'Insira ao menos 2 caracteres!').optional(),
      visitorCompany: z.string().optional(),
      visitorReason: z.string().optional(),
    });
  }

  return schemaToValidate.refine((data) => validateDepartTime(data), {
    message: 'Horário de embarque passado',
    path: ['departTime'],
  });
});

const newRideSchema = computed(() => toTypedSchema(dynamicSchema.value));

const form = useForm({
  validationSchema: newRideSchema,
  initialValues: {
    rideAddons: [],
  },
});

const showPaymentModal = async () => {
  const validateForm = await form.validate();
  if (validateForm.valid) {
    enablePayment.value = true;
    const targetElement = document.getElementById('payment-area');
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (paymentMethod.value === 'corporative' && form.values.branch) {
      onSubmit();
    } else {
      form.setErrors({
        area: 'Obrigatório!',
        branch: 'Obrigatório!',
      });
    }

    if (paymentMethod.value === 'pix') {
      window.alert('PAGAMENTO PIX');
      setTimeout(() => {
        onSubmit();
      }, 2000);
    }
  } else {
    const targetElement = document.getElementById('ride-info');
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast({
      title: 'Oops!',
      description: `Preencha todos os dados do atendimento!`,
      variant: 'destructive',
    });
  }
};

const showPaymentSection = async () => {
  const validateForm = await form.validate();
  if (validateForm.valid) {
    enablePayment.value = true;

    if (paymentMethod.value === 'corporative' && (form.values as any).branch) {
      onSubmit();
    } else {
      form.setErrors({
        area: 'Obrigatório!',
        branch: 'Obrigatório!',
      } as any);
    }

    if (paymentMethod.value === 'pix') {
      window.alert('PAGAMENTO PIX');
      setTimeout(() => {
        onSubmit();
      }, 2000);
    }
  } else {
    const targetElement = document.getElementById('ride-info');
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast({
      title: 'Oops!',
      description: `Preencha todos os dados do atendimento!`,
      variant: 'destructive',
    });
  }
};

const goToPaymentSection = () => {
  showPaymentArea.value = true;
  const targetElement = document.getElementById('payment-area');
  setTimeout(() => {
    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 500);
};

const handlePaymentComplete = (paymentResult: any) => {
  showGenerateRide.value = true;

  if (
    paymentResult.status === 'succeeded' ||
    paymentResult.status === 'PaymentConfirmed' ||
    paymentResult.status === 'Authorized'
  ) {
    paymentStatus.value = 'paid';
  } else {
    paymentStatus.value = 'pending';
  }

  enablePayment.value = false;
  onSubmit();
};

const handlePaymentError = (error: string) => {
  toast({
    title: 'Erro no pagamento',
    description: error,
    variant: 'destructive',
  });
};

const handleCieloCheckoutCreated = (result: {
  checkoutUrl: string;
  orderNumber: string;
}) => {
  paymentStatus.value = 'pending';
  paymentLinkUrl.value = result?.checkoutUrl;
  setTimeout(() => {
    onSubmit();
  }, 1000);
};

const buildStaticMapUrl = () => {
  const key = API_KEY;
  const size = '800x600';
  const maptype = 'roadmap';
  const originIconUrl = 'https://app.urbanmobi.com.br/icons/square-dot.png';
  const stopIconUrl = 'https://app.urbanmobi.com.br/icons/square-square.png';
  const destIconUrl = 'https://app.urbanmobi.com.br/icons/square-check.png';
  const origin = `${originCoords.value.lat},${originCoords.value.lng}`;
  const dest = `${destinationCoords.value.lat},${destinationCoords.value.lng}`;

  const stops = waypointLocationDetails.value?.length
    ? waypointLocationDetails.value
        .map((wp: any) => (wp.coords ? `${wp.coords.lat},${wp.coords.lng}` : ''))
        .filter(Boolean)
    : [];

  const path = `&path=color:0x000000FF%7Cenc:${routePolyLine.value}`;
  const markers = [`&markers=icon:${originIconUrl}|${origin}`];
  stops.forEach((stop: any) => markers.push(`&markers=icon:${stopIconUrl}|${stop}`));
  markers.push(`&markers=icon:${destIconUrl}|${dest}`);

  return `https://maps.googleapis.com/maps/api/staticmap?maptype=${maptype}&size=${size}${markers.join('')}${path}&key=${key}`;
};

const onSubmit = form.handleSubmit(async (values: any) => {
  loadingGenerateRide.value = true;
  rideCode.value = generateRideCode();

  // Validate conditional required fields
  if (visitorUser.value) {
    if (!values.visitorName || !values.visitorPhone) {
      toast({
        title: 'Dados do visitante incompletos',
        description: 'Preencha nome e celular do visitante.',
        variant: 'destructive',
      });
      loadingGenerateRide.value = false;
      return;
    }
  }

  if (selectedUser?.value.role !== 'platform-user') {
    if (!values.reason) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo do atendimento.',
        variant: 'destructive',
      });
      loadingGenerateRide.value = false;
      return;
    }
  }

  if (
    isRecurringRide.value &&
    (!recurrenceRange.value?.start ||
      !recurrenceRange.value?.end ||
      recurrenceWeekdays.value.length === 0)
  ) {
    toast({
      title: 'Recorrência incompleta',
      description: 'Selecione o período e ao menos um dia da semana.',
      variant: 'destructive',
    });
    loadingGenerateRide.value = false;
    return;
  }

  const routePreviewUrl = buildStaticMapUrl();
  const recurringDates = resolveRecurringDates(values.departDate as string);
  const recurrenceGroupId =
    recurringDates.length > 1
      ? `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      : null;
  const successfulDates: string[] = [];
  const failedDates: string[] = [];
  const failedErrors: string[] = [];

  const dispatcherBase = {
    user: data?.value?.user?.name,
    email: data?.value?.user?.email,
    dispatchDate: new Date().toLocaleDateString('pt-BR').padStart(10, '0'),
  };

  const ridePayloadBase = {
    estimatedPrice: calculatedEstimates.value.estimatedTotalPrice,
    billing: {
      paymentMethod: paymentMethod.value,
      paymentUrl: paymentLinkUrl.value,
      paymentData: {
        contract: selectedUser.value.contract.contractId,
        branchName: selectedUserBranchName.value,
        branch: values?.branch || '-',
        area:
          splitPaymentCCAreas.value.length > 0
            ? 'splited'
            : values.area
              ? values.area
              : '-',
        splitedPayment: splitPaymentCCAreas.value,
      },
      addons: selectedRideAddons.value || [],
      ammount: calculatedEstimates.value.estimatedTotalPrice,
      ammountWithExtras: null,
      status:
        paymentMethod.value === 'corporative'
          ? 'invoice'
          : paymentMethod.value === 'pix'
            ? 'unpaid'
            : paymentStatus.value,
      installments: 0,
    },
    user: {
      id: selectedUser.value.id,
      name: selectedUser.value.name,
      email: selectedUser.value.email,
      phone: selectedUser.value.phone,
      isVisitor: visitorUser.value,
      visitorData: visitorUser.value
        ? {
            name: values.visitorName,
            phone: values.visitorPhone,
            company: values.visitorCompany,
            reason: values.visitorReason,
            host: selectedUser.value.name,
          }
        : null,
    },
    product: {
      id: selectedProduct.value.id,
      code: selectedProduct.value.code,
      name: selectedProduct.value.name,
      type: selectedProduct.value.type,
      basePrice: selectedProduct.value.basePrice,
      kmPrice: selectedProduct.value.kmPrice,
      minutePrice: selectedProduct.value.minutePrice,
      includedKms: parseInt(selectedProduct.value.includedKms) || null,
      includedHours: parseInt(selectedProduct.value.includedHours) || null,
    },
    reason: values.reason || '',
    travel: {
      rideEstimatedPrice: calculatedEstimates.value.estimatedPrice,
      passengers: ridePassengers.value,
      date: toIsoDate(values.departDate),
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
      estimatedDistance: calculatedEstimates.value.estimatedDistance,
      estimatedDuration: calculatedEstimates.value.estimatedDuration,
      polyLineCoords: routePolyLine.value,
      routePreviewImg: {
        url: routePreviewUrl,
      },
      completedData: {
        rideExtraKms: rideExtraKms.value,
        rideExtraHours: rideExtraHours.value,
        rideExtraKmPrice: rideExtraKmPrice.value,
        rideExtraHourPrice: rideExtraHourPrice.value,
      },
      isRoundTrip: isRoundTrip.value,
    },
    progress: {
      steps: [],
    },
    status:
      paymentMethod.value === 'corporative' && branchBudgetOverQuota.value
        ? 'over_quota'
        : 'created',
    accepted: false,
    driver: {},
    observations: values.observations,
    additionalInfo: '',
    extraCharges: [],
    dispatcher: dispatcherBase,
  };

  for (const [index, recurringDate] of recurringDates.entries()) {
    const ridePayload = {
      ...ridePayloadBase,
      idempotencyKey: recurrenceGroupId
        ? `${recurrenceGroupId}-${recurringDate}-${index + 1}`
        : undefined,
      code:
        recurringDates.length > 1
          ? `${rideCode.value}-R${String(index + 1).padStart(2, '0')}`
          : rideCode.value,
      travel: {
        ...ridePayloadBase.travel,
        date: recurringDate,
        recurrence: recurrenceGroupId
          ? {
              groupId: recurrenceGroupId,
              index: index + 1,
              total: recurringDates.length,
              weekdays: recurrenceWeekdays.value,
              range: recurrenceRange.value,
            }
          : null,
      },
      dispatcher: {
        ...dispatcherBase,
        recurrence: recurrenceGroupId
          ? {
              groupId: recurrenceGroupId,
              index: index + 1,
              total: recurringDates.length,
            }
          : null,
      },
    };

    const result = await createRideAction(ridePayload);
    if (result?.success) {
      successfulDates.push(recurringDate);
    } else {
      failedDates.push(recurringDate);
      const errMsg =
        result?.error ??
        result?.data?.message ??
        (typeof result === 'string' ? result : 'Erro desconhecido');
      failedErrors.push(errMsg);
      console.error('createRideAction failed for date', recurringDate, result);
    }
  }

  if (successfulDates.length > 0) {
    if (paymentMethod.value === 'corporative') {
      await getBranchByIdAction(values?.branch as string);
      const { id, ...restBranchData } = branch.value;
      const totalCreatedAmount =
        parseFloat(calculatedEstimates.value.estimatedTotalPrice) *
        successfulDates.length;
      await updateBranchAction({
        ...restBranchData,
        branchId: id,
        contract: restBranchData.contractId,
        usedBudget: String(parseFloat(branch.value.usedBudget) + totalCreatedAmount),
      });
    }

    const isRecurringSuccess = recurringDates.length > 1;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: isRecurringSuccess
        ? `${successfulDates.length} atendimentos recorrentes cadastrados com sucesso${failedDates.length ? ` (${failedDates.length} falharam)` : ''}!`
        : `Atendimento cadastrado com sucesso!`,
    });
    loadingGenerateRide.value = false;
    const redirectPath = isAdminMode ? '/admin/rides/open' : '/corporative/rides/open';
    setTimeout(() => {
      navigateTo(redirectPath);
    }, 1000);
  } else {
    loadingGenerateRide.value = false;
    const message = failedErrors.length
      ? failedErrors.join('\n')
      : 'Ocorreu um erro ao criar o atendimento. Tente novamente.';
    toast({
      title: 'Oops!',
      description: message,
      variant: 'destructive',
    });
  }
});
</script>

<template>
  <main class="p-4 md:p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <CalendarPlus :size="24" />
        Criar Novo Atendimento
      </h1>
    </section>
    <section>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <section id="service-select" class="mb-10">
          <Card class="bg-zinc-300">
            <CardContent>
              <CardTitle class="mt-6 mb-10 flex items-center gap-3 font-bold">
                <span
                  class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                >
                  1
                </span>
                Selecione o Usuário e o Serviço
              </CardTitle>
              <div class="lg:mx-w-lg flex flex-col gap-6">
                <div class="flex flex-col w-full gap-6">
                  <FormField v-if="!visitorUser" v-slot="{ componentField }" name="user">
                    <FormItem>
                      <FormLabel>Usuário*</FormLabel>
                      <FormControl>
                        <SharedSelectSearchUser
                          :items="availableUsers"
                          @on-select="setSelectedUser"
                          v-bind="componentField"
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                  <VisitorUserForm
                    :users-list="availableUsers"
                    :visitor-user="visitorUser"
                    @toogle-form="visitorUser = !visitorUser"
                    @selected-user="setSelectedUser"
                  />
                </div>
                <div v-if="showAvailableProducts" class="lg:min-w-2xl">
                  <LoaderCircle v-if="loadingProducts" class="animate-spin" />
                  <div v-else>
                    <label class="text-sm font-medium">Selecione o Serviço UM*</label>
                    <ul class="mt-2 flex justify-evenly gap-4 flex-wrap">
                      <li
                        class="w-full flex"
                        v-for="product in availableProducts"
                        :key="product.id"
                      >
                        <article
                          class="flex-1 min-w-0 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-md border border-zinc-900"
                        >
                          <div class="flex items-center justify-start gap-2 min-w-0">
                            <div
                              class="min-w-0 w-full md:w-72 md:flex-none flex items-center gap-2"
                            >
                              <Checkbox
                                @update:checked="setSelectedProduct(product)"
                                :checked="selectedProduct?.id === product.id"
                              />
                              <img
                                v-if="product.image?.url"
                                :src="product.image.url"
                                alt="Product Image"
                                class="w-16 h-16 object-contain rounded-md"
                              />
                              <ProductTag :label="product.name" :type="product.name" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger as-child class="hover:cursor-pointer">
                                    <InfoIcon :size="16" class="text-zinc-500" />
                                  </TooltipTrigger>
                                  <TooltipContent class="bg-zinc-700 text-white">
                                    <p>{{ product.description }}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <div class="flex items-center shrink-0">
                                <Users :size="14" />
                                <small class="ml-1 font-bold">
                                  {{ product?.capacity }}
                                </small>
                              </div>
                            </div>
                          </div>
                          <div
                            class="w-full md:w-auto min-w-0 flex flex-wrap md:flex-nowrap items-center justify-start gap-2 sm:gap-4"
                          >
                            <div
                              class="flex-1 min-w-[5rem] md:flex-none flex flex-col items-center border border-zinc-300 rounded-md px-2 py-1"
                            >
                              <small class="text-xxs font-bold">Base</small>
                              <small class="text-xs">{{
                                currencyFormat(product.basePrice)
                              }}</small>
                            </div>
                            <div
                              class="flex-1 min-w-[5rem] md:flex-none flex flex-col items-center border border-zinc-300 rounded-md px-2 py-1"
                            >
                              <small class="text-xxs font-bold">Km</small>
                              <small class="text-xs">{{
                                currencyFormat(product.kmPrice)
                              }}</small>
                            </div>
                            <div
                              class="flex-1 min-w-[5rem] md:flex-none flex flex-col items-center border border-zinc-300 rounded-md px-2 py-1"
                            >
                              <small class="text-xxs font-bold">Min.</small>
                              <small class="text-xs">{{
                                currencyFormat(product.minutePrice)
                              }}</small>
                            </div>
                            <div
                              v-if="product.type === 'contract'"
                              class="w-full md:w-auto flex items-center justify-start gap-2 sm:gap-3"
                            >
                              <div
                                class="flex-1 min-w-[5rem] md:flex-none flex flex-col items-center border border-zinc-300 rounded-md px-2 py-1"
                              >
                                <small class="text-xxs font-bold">KM</small>
                                <small class="text-xs">{{ product.includedKms }}</small>
                              </div>
                              <div
                                class="flex-1 min-w-[5rem] md:flex-none flex flex-col items-center border border-zinc-300 rounded-md px-2 py-1"
                              >
                                <small class="text-xxs font-bold">Horas</small>
                                <small class="text-xs">
                                  {{ product.includedHours }}
                                </small>
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- FORM -->
        <section id="ride-info">
          <Card v-if="selectedProduct.name" class="mb-10 bg-zinc-200">
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
                  <div
                    class="col-span-2 rounded-md border border-zinc-900 bg-white p-4 space-y-4"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <CalendarRange :size="16" />
                        <p class="font-semibold text-sm">Atendimento recorrente</p>
                      </div>
                      <Checkbox
                        :checked="isRecurringRide"
                        @update:checked="(v) => (isRecurringRide = !!v)"
                      />
                    </div>
                    <div v-if="isRecurringRide" class="mt-4 space-y-4">
                      <DatePickerRange v-model="recurrenceRange" />
                      <div>
                        <small class="text-xs text-muted-foreground"
                          >Dias da semana</small
                        >
                        <div class="mt-2 flex flex-wrap gap-2">
                          <Button
                            v-for="weekday in recurrenceWeekdayOptions"
                            :key="weekday.value"
                            type="button"
                            size="sm"
                            :variant="
                              recurrenceWeekdays.includes(weekday.value)
                                ? 'default'
                                : 'outline'
                            "
                            @click.prevent="toggleRecurrenceWeekday(weekday.value)"
                          >
                            {{ weekday.label }}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-span-2 md:col-span-1">
                    <NewDatePicker
                      :form="form"
                      :is-recurring-ride="isRecurringRide"
                      :recurrence-range="recurrenceRange"
                    />
                  </div>
                  <FormField v-slot="{ componentField }" name="departTime">
                    <FormItem class="col-span-2 md:col-span-1">
                      <FormLabel>Hora da Partida*</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" v-maska="'##:##'" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField name="passengers">
                    <FormItem class="col-span-2 md:col-span-1">
                      <FormLabel>Passageiros*</FormLabel>
                      <FormControl>
                        <div class="mt-2 flex w-full items-center gap-3 md:max-w-xs">
                          <Button
                            type="button"
                            @click="removePassengers"
                            :disabled="ridePassengers === 1"
                            class="w-12 px-0"
                          >
                            <Minus :size="20" />
                          </Button>
                          <Input
                            v-model="ridePassengers"
                            class="flex-1 text-center font-bold"
                          />
                          <Button
                            type="button"
                            @click="addPassengers"
                            :disabled="ridePassengers === selectedProduct?.capacity"
                            class="w-12 px-0"
                          >
                            <Plus :size="20" />
                          </Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="reason">
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
                            <FormLabel class="mt-0">
                              Parada {{ Number(index) + 1 }}
                            </FormLabel>
                            <FormControl>
                              <div class="flex items-center gap-2">
                                <SquareSquare />
                                <GMapAutocomplete
                                  placeholder="Endereço da Parada"
                                  @place_changed="setWaypoints($event, Number(index))"
                                  :value="waypoint.address"
                                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button
                                  type="button"
                                  @click.prevent="removeWaypointRow(Number(index))"
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
                      <div class="mb-6">
                        <h3 class="font-bold">Serviços Opcionais</h3>
                        <small class="text-xs text-muted-foreground">
                          Os valores dos serviços opcionais serão adicionados no valor
                          total do atendimento.
                        </small>
                      </div>
                      <FormField name="rideAddons">
                        <div class="space-y-3">
                          <FormField
                            v-for="item in addonProducts"
                            v-slot="{ value, handleChange }"
                            :key="item.id"
                            type="checkbox"
                            :value="item.id"
                            :unchecked-value="false"
                            name="rideAddons"
                          >
                            <FormItem
                              class="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  @update:checked="handleChange"
                                  :checked="value.includes(item.id)"
                                />
                              </FormControl>
                              <FormLabel class="font-normal">
                                <span class="font-bold">{{ item.code }}</span> -
                                {{ item.name }}
                                <span v-if="item.price !== null" class="font-bold">
                                  - {{ currencyFormat(item.basePrice) }}
                                </span>
                              </FormLabel>
                            </FormItem>
                          </FormField>
                        </div>
                      </FormField>
                    </div>
                    <div class="rounded-md col-span-3">
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
                  <Button
                    type="button"
                    @click.prevent="handleRideCalculation"
                    class="mb-4 p-6 col-span-2 uppercase"
                  >
                    <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                    Próximo Passo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- MAP AND RIDE DETAILS -->
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
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div class="space-y-4 md:space-y-6 flex flex-col items-start w-full">
                  <h3 class="text-lg font-bold">Preview da Rota</h3>
                  <div class="p-0 md:p-4 bg-transparent md:bg-white rounded-md w-full">
                    <div class="w-full h-[420px] sm:h-[500px] md:h-[700px]">
                      <GoogleMap
                        class="w-full"
                        ref="mapRef"
                        :api-key="API_KEY"
                        style="width: 100%; height: 100%"
                        :center="mapCenter"
                        :zoom="10"
                        :zoom-control="true"
                        :map-type-control="!isMobileViewport"
                        :fullscreen-control="!isMobileViewport"
                        :street-view-control="!isMobileViewport"
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
                <div class="w-full space-y-6">
                  <h3 class="text-lg font-bold">Resumo</h3>
                  <div class="p-6 bg-white rounded-md space-y-6">
                    <div>
                      <small class="font-bold">Data e Hora</small>
                      <h2 class="font-bold text-2xl">
                        {{ sanitizeRideDate(form.values.departDate as string) }} -
                        {{ form.values.departTime }}
                      </h2>
                    </div>
                    <div>
                      <small class="font-bold">Origem</small>
                      <p>{{ originLocationDetails.address }}</p>
                    </div>
                    <div
                      v-if="
                        routeWaypoints.length > 0 && waypointLocationDetails.length > 0
                      "
                      v-for="(waypoint, index) in routeWaypoints"
                    >
                      <small class="font-bold">Parada {{ Number(index) + 1 }}</small>
                      <p>{{ waypoint.address }}</p>
                    </div>
                    <div>
                      <small class="font-bold">Destino</small>
                      <p>{{ destinationLocationDetails.address }}</p>
                    </div>
                    <div class="space-y-4">
                      <div>
                        <small class="font-bold whitespace-nowrap"
                          >Serviço selecionado</small
                        >
                        <div
                          v-if="selectedProduct"
                          class="mt-1 flex items-center gap-3 sm:gap-4"
                        >
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
                      <div class="grid grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <small class="font-bold">Distância Estimada</small>
                          <p>
                            {{
                              convertMetersToDistance(
                                calculatedEstimates.estimatedDistance,
                              )
                            }}
                          </p>
                        </div>
                        <div>
                          <small class="font-bold">Duração Estimada</small>
                          <p>
                            {{
                              convertSecondsToTime(calculatedEstimates.estimatedDuration)
                            }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="showContractProductAlert"
                      class="p-4 bg-amber-100 rounded-md border border-amber-600"
                    >
                      <h3 class="mb-2 font-bold uppercase text-amber-600">Importante</h3>
                      <p>
                        O Serviço
                        <span class="font-bold">{{ selectedProduct.name }}</span> é
                        oferecido no modelo <span class="font-bold">À Disposição</span>.
                        Confira abaixo as franquias inclusas neste serviço.
                      </p>
                    </div>
                    <div>
                      <h2 class="mb-3 pb-3 font-bold">Descrição dos Valores</h2>
                      <div v-if="showContractProductAlert">
                        <p
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> Serviço à Disposição </span>
                          <span class="font-bold">
                            {{ currencyFormat(selectedProduct.basePrice) }}
                          </span>
                        </p>
                        <p
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> Franquia de KM Inclusa </span>
                          <span class="font-bold">
                            {{ selectedProduct.includedKms }}
                          </span>
                        </p>
                        <p
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> Franquia de Horas Inclusas </span>
                          <span class="font-bold">
                            {{ selectedProduct.includedHours }}
                          </span>
                        </p>
                        <p
                          v-if="rideExtraKms > selectedProduct.includedKms"
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> KM Excedente </span>
                          <span class="font-bold text-amber-700">
                            {{ rideExtraKms.toFixed(2) }}
                          </span>
                        </p>
                        <p
                          v-if="rideExtraKms > selectedProduct.includedKms"
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> Valor KM Excedente </span>
                          <span class="font-bold text-amber-700">
                            {{ currencyFormat(rideExtraKmPrice) }}
                          </span>
                        </p>
                        <p
                          v-if="rideExtraHours > 0"
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> Hora Excedente </span>
                          <span class="font-bold text-amber-700">
                            {{ rideExtraHours }}
                          </span>
                        </p>
                        <p
                          v-if="rideExtraHours > 0"
                          class="flex items-center justify-between gap-2 py-2 border-b border-zinc-200"
                        >
                          <span> Valor Hora Excedente </span>
                          <span class="font-bold text-amber-700">
                            {{ currencyFormat(rideExtraHourPrice) }}
                          </span>
                        </p>
                      </div>
                      <div v-if="form.values.rideAddons.length" class="p-4 bg-amber-100">
                        <h2 class="mt-3 pb-3 font-bold">Adicionais</h2>
                        <p
                          v-for="item in selectedRideAddons"
                          class="flex items-center justify-between gap-2 py-2"
                        >
                          <span>{{ item.name }}</span>
                          <span
                            class="h-2 w-full border-b-2 border-dotted border-zinc-400"
                          ></span>
                          <span class="font-bold">
                            {{ currencyFormat(item.basePrice) }}
                          </span>
                        </p>
                      </div>
                      <p
                        class="mt-4 pt-8 font-bold border-t border-zinc-400 text-muted-foreground text-sm"
                      >
                        Total estimado
                      </p>
                      <p class="my-3 font-bold text-4xl">
                        {{ currencyFormat(calculatedEstimates?.estimatedTotalPrice) }}
                      </p>
                      <small class="text-muted-foreground text-[12px]">
                        * O valor total final do serviço será calculado ao término do
                        atendimento, podendo ou não haver acréscimos no valor.
                      </small>
                    </div>
                  </div>
                  <Button
                    v-if="isCorporativeMode"
                    type="button"
                    class="p-6 w-full md:w-fit uppercase"
                    @click.prevent="goToPaymentSection"
                  >
                    Prosseguir para pagamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- PAYMENT SECTION - Only for corporative mode -->
        <section v-if="isCorporativeMode" id="payment-area" class="mb-10">
          <Card v-if="showPaymentArea" class="bg-zinc-200">
            <CardContent>
              <CardTitle class="mt-6 mb-10 flex items-center gap-3 font-bold">
                <span
                  class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                >
                  4
                </span>
                Pagamento
              </CardTitle>
              <div>
                <ul class="space-y-2">
                  <li
                    v-for="method in paymentMethodList"
                    :key="method.id"
                    class="py-4 px-3 bg-white rounded-md shadow-md flex flex-col items-start gap-4 w-full"
                  >
                    <div
                      class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3"
                    >
                      <Checkbox
                        @update:checked="setPaymentMethod(method.value)"
                        :checked="paymentMethod.includes(method.value)"
                      />
                      <RenderIcon :name="method.icon" :size="24" />
                      <small class="min-w-0 flex-1 break-words">{{ method.label }}</small>
                      <div
                        v-if="method.logo?.length"
                        class="ml-auto hidden max-w-full flex-wrap items-center justify-end gap-2 lg:flex"
                      >
                        <img
                          v-for="logo in method.logo"
                          :src="logo"
                          alt=""
                          class="!mt-0 h-6 w-auto shrink-0 max-w-[2rem]"
                        />
                      </div>
                    </div>
                    <div
                      v-if="
                        method.value === 'corporative' &&
                        paymentMethod.includes(method.value)
                      "
                      class="p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
                    >
                      <div v-if="branchBudgetOverQuota" class="col-span-2">
                        <p
                          class="px-2 py-1.5 flex items-center gap-2 bg-red-100 rounded-md w-fit text-sm text-red-500"
                        >
                          <Info :size="16" />
                          Orçamento da filial insuficiente
                        </p>
                      </div>
                      <Dialog :open="showBranchBudgetAlert" :closable="false">
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle class="font-bold text-xl">
                              <Info />
                              Budget Insuficiente
                            </DialogTitle>
                            <DialogDescription>
                              <p class="text-base text-zinc-950">
                                Este atendimento ultrapassou o limite de budget disponível
                                para a filial do usuário.
                                <br />
                                <br />
                                Entre em contato com o gestor para aprovar este
                                atendimento.
                              </p>
                            </DialogDescription>
                          </DialogHeader>
                          <div class="flex items-center gap-6">
                            <div>
                              <small> Budget Disponível </small>
                              <p
                                class="font-bold"
                                :class="
                                  Number(availableBranchBudget) <
                                  Number(calculatedEstimates.estimatedTotalPrice)
                                    ? 'text-red-500'
                                    : ''
                                "
                              >
                                {{ currencyFormat(availableBranchBudget) }}
                              </p>
                            </div>
                            <div>
                              <small>Valor do Atendimento</small>
                              <p class="font-bold">
                                {{
                                  currencyFormat(calculatedEstimates.estimatedTotalPrice)
                                }}
                              </p>
                            </div>
                          </div>
                          <div class="my-6 text-zinc-950">
                            <small> Gestor Master </small>
                            <p class="font-bold">{{ contract.manager.username }}</p>
                            <p>{{ contract.manager.email }}</p>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              type="button"
                              @click.prevent="
                                () => {
                                  showBranchBudgetAlert = false;
                                }
                              "
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              @click.prevent="handleAcceptBudgetOverQuota"
                            >
                              Concordar e continuar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div v-if="visitorUser" class="col-span-2 flex items-center gap-10">
                        <div
                          class="p-4 flex flex-col border border-amber-500 rounded-md bg-amber-100 w-full"
                        >
                          <div>
                            <h3 class="mb-4 font-bold">Atendimento para visitante</h3>
                          </div>
                          <div class="flex flex-col gap-3">
                            <div>
                              <small class="text-muted-foreground"
                                >Nome do visitante</small
                              >
                              <p>{{ (form.values as any).visitorName || '-' }}</p>
                            </div>
                            <div>
                              <small class="text-muted-foreground">Empresa</small>
                              <p>{{ (form.values as any).visitorCompany || '-' }}</p>
                            </div>
                            <div>
                              <small class="text-muted-foreground"
                                >Motivo da visita</small
                              >
                              <p>{{ (form.values as any).visitorReason || '-' }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <FormField v-slot="{ componentField, value }" name="branch">
                        <FormItem>
                          <FormLabel>Filial*</FormLabel>
                          <FormControl>
                            <FormSelect
                              :value="value"
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
                        v-if="(form.values as any).branch"
                        class="col-span-2 p-4 border border-zinc-950 rounded-md bg-white"
                      >
                        <p class="font-bold">{{ selectedUserBranchName }}</p>
                        <small>Budget Utilizado</small>
                        <p class="font-bold text-xl text-amber-600">
                          {{ currencyFormat(usedBranchBudget) }}
                        </p>
                        <small>Budget Disponível</small>
                        <p
                          class="font-bold text-2xl"
                          :class="availableBranchBudget <= '0' && 'text-red-500'"
                        >
                          {{ currencyFormat(availableBranchBudget) }}
                        </p>
                      </div>
                      <div class="col-span-2">
                        <div
                          v-if="!splitPaymentAreas"
                          class="flex w-full flex-col lg:flex-row lg:items-end gap-3 lg:gap-6"
                        >
                          <FormField v-slot="{ componentField }" name="area">
                            <FormItem class="w-full min-w-0">
                              <FormLabel>Centro de Custo*</FormLabel>
                              <FormControl>
                                <FormSelect
                                  v-bind="componentField"
                                  :items="contractBranchAreas"
                                  :loading="loadingAreas"
                                  label="Selecione"
                                />
                              </FormControl>
                              <FormMessage class="text-xs" />
                            </FormItem>
                          </FormField>
                          <Button
                            v-if="contractBranchAreas?.length > 0"
                            type="button"
                            class="w-full lg:w-auto"
                            @click.prevent="splitPaymentAreas = !splitPaymentAreas"
                          >
                            <Percent />
                            Ratear entre CCs
                          </Button>
                        </div>
                      </div>
                      <SplitPaymentCCs
                        v-if="splitPaymentAreas"
                        :branch-areas="contractBranchAreas"
                        :contract-branches="contractBranchesList"
                        :estimates="calculatedEstimates"
                        @toogle-split-payment="splitPaymentAreas = !splitPaymentAreas"
                        v-model="splitPaymentCCAreas"
                        :form="form"
                      />
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <!-- PAYMENT SECTION - For admin mode -->
        <section v-if="isAdminMode" id="payment" class="mb-10">
          <Card v-if="showRenderedMap" class="bg-zinc-200">
            <CardContent>
              <CardTitle class="mt-6 mb-10 flex items-center gap-3 font-bold">
                <span
                  class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                >
                  4
                </span>
                Pagamento
              </CardTitle>
              <div>
                <ul class="space-y-2">
                  <li
                    v-for="method in paymentMethodList"
                    :key="method.id"
                    class="p-6 bg-white rounded-md shadow-md flex flex-col items-start gap-4 w-full"
                  >
                    <div
                      class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3"
                    >
                      <Checkbox
                        @update:checked="setPaymentMethod(method.value)"
                        :checked="paymentMethod.includes(method.value)"
                      />
                      <RenderIcon :name="method.icon" :size="24" />
                      <small class="min-w-0 flex-1 break-words">{{ method.label }}</small>
                      <div
                        v-if="method.logo?.length"
                        class="ml-auto hidden max-w-full flex-wrap items-center justify-end gap-2 lg:flex"
                      >
                        <img
                          v-for="logo in method.logo"
                          :src="logo"
                          alt=""
                          class="!mt-0 h-6 w-auto shrink-0 max-w-[2rem]"
                        />
                      </div>
                    </div>
                    <div
                      v-show="
                        method.value === 'corporative' &&
                        paymentMethod.includes(method.value)
                      "
                      class="p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
                    >
                      <div v-if="branchBudgetOverQuota" class="col-span-2">
                        <p
                          class="px-2 py-1.5 flex items-center gap-2 bg-red-100 rounded-md w-fit text-sm text-red-500"
                        >
                          <Info :size="16" />
                          Orçamento da filial insuficiente
                        </p>
                      </div>
                      <Dialog :open="showBranchBudgetAlert" :closable="false">
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle class="font-bold text-xl">
                              <Info />
                              Budget Insuficiente
                            </DialogTitle>
                            <DialogDescription>
                              <p class="text-base text-zinc-950">
                                Este atendimento ultrapassou o limite de budget disponível
                                para a filial do usuário.
                                <br />
                                <br />
                                Entre em contato com o gestor para aprovar este
                                atendimento.
                              </p>
                            </DialogDescription>
                          </DialogHeader>
                          <div class="flex items-center gap-6">
                            <div>
                              <small> Budget Disponível </small>
                              <p
                                class="font-bold"
                                :class="
                                  Number(availableBranchBudget) <
                                  Number(calculatedEstimates.estimatedTotalPrice)
                                    ? 'text-red-500'
                                    : ''
                                "
                              >
                                {{ currencyFormat(availableBranchBudget) }}
                              </p>
                            </div>
                            <div>
                              <small>Valor do Atendimento</small>
                              <p class="font-bold">
                                {{
                                  currencyFormat(calculatedEstimates.estimatedTotalPrice)
                                }}
                              </p>
                            </div>
                          </div>
                          <div class="my-6 text-zinc-950">
                            <small> Gestor Master </small>
                            <p class="font-bold">{{ contract.manager.username }}</p>
                            <p>{{ contract.manager.email }}</p>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              type="button"
                              @click.prevent="
                                () => {
                                  showBranchBudgetAlert = false;
                                  navigateTo('/admin/rides/open');
                                }
                              "
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              @click.prevent="handleAcceptBudgetOverQuota"
                            >
                              Concordar e continuar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div v-if="visitorUser" class="col-span-2 flex items-center gap-10">
                        <div
                          class="p-4 flex flex-col border border-amber-500 rounded-md bg-amber-100 w-full"
                        >
                          <div>
                            <h3 class="mb-4 font-bold">Atendimento para visitante</h3>
                          </div>
                          <div class="flex flex-col gap-3">
                            <div>
                              <small class="text-muted-foreground"
                                >Nome do visitante</small
                              >
                              <p>{{ (form.values as any).visitorName || '-' }}</p>
                            </div>
                            <div>
                              <small class="text-muted-foreground">Empresa</small>
                              <p>{{ (form.values as any).visitorCompany || '-' }}</p>
                            </div>
                            <div>
                              <small class="text-muted-foreground"
                                >Motivo da visita</small
                              >
                              <p>{{ (form.values as any).visitorReason || '-' }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <FormField v-slot="{ componentField, value }" name="branch">
                        <FormItem>
                          <FormLabel>Filial*</FormLabel>
                          <FormControl>
                            <FormSelect
                              :value="value"
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
                        v-if="(form.values as any).branch"
                        class="col-span-2 p-4 border border-zinc-950 rounded-md bg-white"
                      >
                        <p class="font-bold">{{ selectedUserBranchName }}</p>
                        <small>Budget Utilizado</small>
                        <p class="font-bold text-xl text-amber-600">
                          {{ currencyFormat(usedBranchBudget) }}
                        </p>
                        <small>Budget Disponível</small>
                        <p
                          class="font-bold text-2xl"
                          :class="availableBranchBudget <= '0' && 'text-red-500'"
                        >
                          {{ currencyFormat(availableBranchBudget) }}
                        </p>
                      </div>
                      <div class="col-span-2">
                        <div
                          v-if="!splitPaymentAreas"
                          class="flex w-full flex-col lg:flex-row lg:items-end gap-3 lg:gap-6"
                        >
                          <FormField v-slot="{ componentField }" name="area">
                            <FormItem class="w-full min-w-0">
                              <FormLabel>Centro de Custo*</FormLabel>
                              <FormControl>
                                <FormSelect
                                  v-bind="componentField"
                                  :items="availableContractBranchAreas"
                                  :loading="loadingAreas"
                                  label="Selecione"
                                />
                              </FormControl>
                              <FormMessage class="text-xs" />
                            </FormItem>
                          </FormField>
                          <Button
                            v-if="contractBranchAreas.length > 0"
                            type="button"
                            class="w-full lg:w-auto"
                            @click.prevent="splitPaymentAreas = !splitPaymentAreas"
                          >
                            <Percent />
                            Ratear entre CCs
                          </Button>
                        </div>
                      </div>
                      <SplitPaymentCCs
                        v-if="splitPaymentAreas"
                        :contract-branches="contractBranchesList"
                        :branch-areas="contractBranchAreas"
                        :estimates="calculatedEstimates"
                        @toogle-split-payment="splitPaymentAreas = !splitPaymentAreas"
                        v-model="splitPaymentCCAreas"
                        :form="form"
                      />
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <div
          v-if="paymentMethod && calculatedEstimates.estimatedPrice"
          class="my-6 flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:gap-6"
        >
          <Button
            type="button"
            class="w-full p-6 px-6 uppercase lg:w-auto lg:px-10"
            @click.prevent="isAdminMode ? showPaymentSection() : showPaymentModal()"
          >
            <LoaderCircle v-if="loadingGenerateRide" class="animate-spin" />

            {{
              paymentMethod === 'corporative' && form.values.branch
                ? 'Gerar atendimento corporativo'
                : 'Gerar atendimento'
            }}
          </Button>
          <Button
            type="button"
            variant="secondary"
            class="w-full p-6 uppercase lg:w-auto"
            @click.prevent="
              () => {
                navigateTo(isAdminMode ? '/admin/rides/open' : '/corporative/rides/open');
              }
            "
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  </main>

  <Dialog
    :open="paymentMethod === 'creditcard' && enablePayment"
    @update:open="enablePayment = $event"
  >
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle class="mb-6">Gerar Pagamento - Crédito À Vista</DialogTitle>
      </DialogHeader>
      <StripeCheckout
        :amount="calculatedEstimates?.estimatedPrice || 1.0"
        currency="brl"
        :metadata="{ id: selectedUser.id, name: selectedUser.name }"
        @paymentComplete="handlePaymentComplete"
        @paymentError="handlePaymentError"
      />
    </DialogContent>
  </Dialog>

  <Dialog
    :open="paymentMethod === 'cielo' && enablePayment"
    @update:open="enablePayment = $event"
  >
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle class="mb-6">Efetuar Pagamento - Crédito Parcelado</DialogTitle>
      </DialogHeader>
      <CieloCheckoutUrl
        :admin="isAdminMode"
        :rideData="{
          code: rideCode,
          selectedProduct: selectedProduct,
          calculatedEstimates: calculatedEstimates,
          userData: selectedUser,
          originAddress: originLocationDetails.address,
          stops: waypointLocationDetails,
          destinationAddress: destinationLocationDetails.address,
          departDate: form.values.departDate,
          departTime: form.values.departTime,
          passengers: ridePassengers,
          dispatcher: {
            user: (data as any)?.user?.name as string,
            email: (data as any)?.user?.email as string,
            dispatchDate: new Date().toLocaleDateString('pt-BR').padStart(10, '0'),
          },
        }"
        @checkoutCreated="handleCieloCheckoutCreated"
        @checkoutError="handlePaymentError"
      />
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
