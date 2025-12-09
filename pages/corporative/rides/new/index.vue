<script setup lang="ts">
import CieloCheckoutUrl from '@/components/payments/CieloCheckoutUrl.vue';
import StripeCheckout from '@/components/payments/StripeCheckout.vue';
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
import {
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
  sanitizeRideDate,
} from '~/lib/utils';

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
const { getUsersAccountsAction } = accountStore;
const { accounts } = storeToRefs(accountStore);
const { createRideAction, getRidesAction, loadingData } = ridesStore;
const { rides } = storeToRefs(ridesStore);
const { getProductsAction } = productsStore;
const { products } = storeToRefs(productsStore);

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

const { toast } = useToast();
const { data } = useAuth();
//@ts-ignore
const contractId = data.value?.user.contract?.contractId;

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
  role: 'platform-corp-user',
});
const showGenerateRide = ref<boolean>(false);
const ridePassengers = ref(1);
const paymentMethod = ref<any>('');
const paymentMethodList = ref<any>(paymentMethods);
const paymentStatus = ref<string>('unpaid');
const paymentLinkUrl = ref<string>('');
const contractBranches = ref<any>();
const contractBranchAreas = ref<any>();
const contractBranchesList = ref<any>();
const loadingAreas = ref<boolean>(false);
const enablePayment = ref<boolean>(false);
const showPaymentArea = ref<boolean>(false);
const showWaypointsForm = ref<boolean>(false);
const showContractProductAlert = ref<boolean>(false);
const loadingGenerateRide = ref<boolean>(false);
const routeWaypoints = ref<any>([
  {
    address: '',
  },
]);
const originCoords = ref<any>({
  lat: '',
  lng: '',
});
const originLocationDetails = ref<any>({
  address: '',
  url: '',
});
const waypointCoords = ref<any>([]);
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
const mapCenter = ref<any>({ lat: -23.55012592233407, lng: -46.63425371400603 });
const mapRef = ref<any>(null);
const initialZoom = ref(1);
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
      user.enabled === true &&
      user.role !== 'admin' &&
      user.role !== 'platform-driver' &&
      user.emailConfirmed === true &&
      user.contract.contractId === contractId,
  );
  availableUsers.value = filteredUsers.map((user: any) => {
    return {
      label: user.username,
      value: user.id,
    };
  });

  await getProductsAction();
  addonProducts.value = products.value.filter(
    (product: Product) => product.type === 'addon',
  );
});

const addWaypointRow = () => {
  routeWaypoints.value.push({
    address: '',
  });
};

const removeWaypointRow = (index: number) => {
  routeWaypoints.value.splice(index, 1);
  waypointLocationDetails.value.splice(index, 1);
  waypointCoords.value.splice(index, 1);
};

// // Set the waypoints of the ride
const setWaypoints = (place: any, index: number) => {
  waypointCoords.value.lat = place.geometry.location.lat();
  waypointCoords.value.lng = place.geometry.location.lng();

  const waypoint = {
    address: place.formatted_address,
    coords: {
      lat: waypointCoords.value.lat,
      lng: waypointCoords.value.lng,
    },
  };
  waypointCoords.value.push(waypoint.coords);
  waypointLocationDetails.value.push(waypoint);
  routeWaypoints.value[index].address = place.formatted_address;
};

const getBranchAreas = (value: string) => {
  loadingAreas.value = true;
  const selectedBranch = contractBranches.value.find(
    (branch: any) => branch.id === value,
  );
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

const addPassengers = () => {
  ridePassengers.value++;
};

const removePassengers = () => {
  if (ridePassengers.value > 1) {
    ridePassengers.value--;
  }
};

const setSelectedProduct = (value: any) => {
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

const setSelectedUser = async (user: any) => {
  // reseting state to show another products list
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
      contractBranchesList.value = contract?.value.branches.map((branch: any) => {
        return {
          label: `${branch.branchCode} - ${branch.name}`,
          value: branch.id,
        };
      });
      loadingProducts.value = false;
      paymentMethodList.value = paymentMethods.filter(
        (method) => method.value === 'corporative',
      );
    } catch (error) {
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Erro ao buscar os produtos do contracto. Tente novamente.`,
      });
    }
  }
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
  mapCenter.value = {
    lat: coords[parseCenterCoord].lat,
    lng: coords[parseCenterCoord].lng,
  };

  const stopsMarkers = waypointCoords.value.map((waypoint: any) => {
    return {
      ...waypoint,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customIconStop),
    };
  });

  // Set the markers on the map
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

const calculatedEstimates = ref({
  estimatedDistance: 0,
  estimatedDuration: 0,
  estimatedPrice: '',
  // Ride Price + Addons
  estimatedTotalPrice: '',
});

const selectedRideAddons = ref<any>([]);

const handleRideCalculation = async () => {
  const validateForm = await form.validate();
  if (!validateForm.valid) {
    const targetElement = document.getElementById('ride-info');
    targetElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    return;
  }

  try {
    loadingRoute.value = true;

    // Build a locations array for the complete route
    const locations = [
      { lat: originCoords.value.lat, lng: originCoords.value.lng },
      ...waypointLocationDetails.value.map((wp: any) =>
        wp.coords ? { lat: wp.coords.lat, lng: wp.coords.lng } : wp.address,
      ),
      { lat: destinationCoords.value.lat, lng: destinationCoords.value.lng },
    ];
    const departDate = form.values.departDate;
    const departTime = form.values.departTime;
    const dt = new Date(`${departDate}T${departTime}:00`);
    const departureTime = dt.toISOString();

    const routeCalculation: any = await getRideRoutesService({
      locations,
      departureTime,
    });

    routePolyLine.value = routeCalculation[0]?.polyline?.encodedPolyline;
    const basePrice = parseFloat(selectedProduct?.value.basePrice);
    const sanitizeDurationResponse = routeCalculation[0].duration.replace('s', '');
    const duration = Math.ceil(sanitizeDurationResponse) / 60;
    const distance = routeCalculation[0].distanceMeters / 1000;

    if (selectedProduct.value.type === 'contract') {
      const ridePrice = parseFloat(basePrice.toFixed(2));
      calculatedEstimates.value.estimatedPrice = ridePrice.toFixed(2).toString();
      showContractProductAlert.value = true;
    } else {
      const ridePrice =
        basePrice +
        distance * parseFloat(selectedProduct?.value.kmPrice) +
        duration * parseFloat(selectedProduct?.value.minutePrice);
      calculatedEstimates.value.estimatedPrice = ridePrice.toFixed(2).toString();
    }

    calculatedEstimates.value.estimatedDistance = routeCalculation[0].distanceMeters;
    calculatedEstimates.value.estimatedDuration = parseInt(sanitizeDurationResponse);

    if (form.values.rideAddons.length) {
      const actualRidePrice = calculatedEstimates.value.estimatedPrice;
      const filteredAddons = addonProducts.value.filter((item: Product) =>
        form.values.rideAddons.includes(item.id),
      );
      console.log('caiu aqui -> ', filteredAddons);
      selectedRideAddons.value = filteredAddons;
      const calculateAddons = filteredAddons?.reduce((acc: any, curr: any) => {
        return acc + parseFloat(curr.basePrice);
      }, 0);

      const finalPrice = parseFloat(actualRidePrice) + calculateAddons;
      calculatedEstimates.value.estimatedTotalPrice = finalPrice.toFixed(2).toString();
    } else {
      calculatedEstimates.value.estimatedTotalPrice =
        calculatedEstimates.value.estimatedPrice;
    }
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

const newRideCode = computed(async () => {
  await getRidesAction();
  const ridesLength = rides?.value.length;
  const today = new Date();

  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

  return `UM-${day}${month}${year}${ridesLength + 1}`;
});

rideCode.value = await newRideCode.value;

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
  });

  if (selectedUser?.value.role !== 'platform-user') {
    return baseSchema.extend({
      reason: z.string().min(1).max(100),
      branch: z.string().optional(),
      area: z.string().optional(),
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
  initialValues: {
    rideAddons: [],
  },
});

const showPaymentModal = async () => {
  const validateForm = await form.validate();
  if (validateForm.valid) {
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

    if (paymentMethod.value === 'pix') {
      window.alert('PAGAMENTO PIX');
      setTimeout(() => {
        onSubmit();
      }, 2000);
    }
  } else {
    const targetElement = document.getElementById('ride-info');
    targetElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    toast({
      title: 'Oops!',
      description: `Preencha todos os dados do atendimento!`,
      variant: 'destructive',
    });
  }
};

// Payment handlers for both Stripe and Cielo
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

// Handler for Cielo Checkout URL creation
const handleCieloCheckoutCreated = (result: {
  checkoutUrl: string;
  orderNumber: string;
}) => {
  // Update payment status to pending as user will be redirected to Cielo
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

  // Gather stops as lat,lng
  const stops = waypointLocationDetails.value?.length
    ? waypointLocationDetails.value
        .map((wp: any) => (wp.coords ? `${wp.coords.lat},${wp.coords.lng}` : ''))
        .filter(Boolean)
    : [];

  // const pathPoints = [origin, ...stops, dest].join('|');
  const path = `&path=color:0x000000FF%7Cenc:${routePolyLine.value}`;

  // Markers: origin, stops, dest
  const markers = [`&markers=icon:${originIconUrl}|${origin}`];
  stops.forEach((stop: any) => markers.push(`&markers=icon:${stopIconUrl}|${stop}`));
  markers.push(`&markers=icon:${destIconUrl}|${dest}`);

  return `https://maps.googleapis.com/maps/api/staticmap?maptype=${maptype}&size=${size}${markers.join('')}${path}&key=${key}`;
};

const goToPaymentSection = () => {
  showPaymentArea.value = true;
  const targetElement = document.getElementById('payment-area');
  setTimeout(() => {
    targetElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 500);
};

const onSubmit = form.handleSubmit(async (values) => {
  const routePreviewUrl = buildStaticMapUrl();

  const ridePayload = {
    code: rideCode.value,
    estimatedPrice: calculatedEstimates.value.estimatedTotalPrice,
    billing: {
      paymentMethod: paymentMethod.value,
      paymentUrl: paymentLinkUrl.value,
      paymentData: {
        contract: selectedUser.value.contract.contractId,
        branch: values?.branch || '-',
        area: values?.area || '-',
      },
      addons: selectedRideAddons.value || [],
      ammount: calculatedEstimates.value.estimatedTotalPrice,
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
    },
    product: {
      id: selectedProduct.value.id,
      code: selectedProduct.value.code,
      name: selectedProduct.value.name,
      type: selectedProduct.value.type,
      basePrice: selectedProduct.value.basePrice,
      kmPrice: selectedProduct.value.kmPrice,
      minutePrice: selectedProduct.value.minutePrice,
    },
    reason: values.reason || '',
    travel: {
      rideEstimatedPrice: calculatedEstimates.value.estimatedPrice,
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
      estimatedDistance: calculatedEstimates.value.estimatedDistance,
      estimatedDuration: calculatedEstimates.value.estimatedDuration,
      polyLineCoords: routePolyLine.value,
      routePreviewImg: {
        url: routePreviewUrl,
      },
    },
    progress: {
      steps: [],
    },
    status: 'created',
    accepted: false,
    driver: {},
    observations: values.observations,
    dispatcher: {
      user: data?.value?.user?.name,
      email: data?.value?.user?.email,
      dispatchDate: new Date().toLocaleDateString('pt-BR').padStart(10, '0'),
    },
  };

  try {
    loadingGenerateRide.value = true;
    await createRideAction(ridePayload);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao criar o agendamento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingGenerateRide.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Agendamento cadastrado com sucesso!`,
    });
    setTimeout(() => {
      navigateTo('/corporative/rides/open');
    }, 1500);
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
                Selecione o Usuário e o Serviço UM
              </CardTitle>
              <div class="lg:mx-w-lg">
                <!-- COLUNA DE DADOS -->
                <div class="flex flex-col w-full gap-6">
                  <FormField v-slot="{ componentField }" name="user">
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
                  <div v-if="showAvailableProducts" class="lg:max-w-lg">
                    <LoaderCircle v-if="loadingProducts" class="animate-spin" />
                    <div v-else>
                      <label class="text-sm font-medium">Selecione o Serviço UM*</label>
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
                              <div class="flex items-center justify-start gap-4">
                                <div class="flex items-center">
                                  <Users :size="14" />
                                  <small class="ml-1 font-bold">
                                    {{ product?.capacity }}
                                  </small>
                                </div>
                                <div class="ml-4 flex flex-col items-center">
                                  <small class="text-xs">Base</small>
                                  <small>R$ {{ product.basePrice }}</small>
                                </div>
                                <div class="flex flex-col items-center">
                                  <small class="text-xs">Km</small>
                                  <small>R$ {{ product.kmPrice }}</small>
                                </div>
                                <div class="flex flex-col items-center">
                                  <small class="text-xs">Min.</small>
                                  <small>R$ {{ product.minutePrice }}</small>
                                </div>
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
                            <FormLabel class="mt-0">Parada {{ index + 1 }}</FormLabel>
                            <FormControl>
                              <div class="flex items-center gap-2">
                                <SquareSquare />
                                <GMapAutocomplete
                                  placeholder="Insira a parada"
                                  @place_changed="setWaypoints($event, index)"
                                  :value="waypoint.address"
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
                    Calcular Atendimento
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
              <div v-else class="md:grid md:grid-cols-2 gap-10">
                <div class="space-y-6 flex flex-col items-start">
                  <h3 class="text-lg font-bold">Preview da Rota</h3>
                  <GoogleMap
                    ref="mapRef"
                    :api-key="API_KEY"
                    style="width: 100%; height: 700px"
                    :center="mapCenter"
                    :zoom="initialZoom"
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
                  <!-- <NuxtImg
                    :src="buildStaticMapUrl()"
                    alt="Mapa da rota"
                    width="800"
                    height="600"
                    loading="lazy"
                    class="p-4 bg-white rounded-md border border-zinc-900 w-full h-auto"
                    v-slot="{ src, isLoaded, imgAttrs }"
                    :custom="true"
                  >
                    <LoaderCircle
                      v-if="!isLoaded"
                      :size="48"
                      class="animate-spin self-center justify-self-center"
                    />
                    <img v-else :src="src" v-bind="imgAttrs" />
                  </NuxtImg> -->
                </div>
                <div class="w-full space-y-6">
                  <h3 class="text-lg font-bold">Resumo</h3>
                  <div class="p-6 bg-white rounded-md space-y-6 border border-zinc-900">
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
                      v-if="routeWaypoints"
                      v-for="(waypoint, index) in routeWaypoints"
                    >
                      <small class="font-bold">Parada {{ index + 1 }}</small>
                      <p>{{ waypoint.address }}</p>
                    </div>
                    <div>
                      <small class="font-bold">Destino</small>
                      <p>{{ destinationLocationDetails.address }}</p>
                    </div>
                    <div class="flex items-center gap-6">
                      <div>
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
                      <div>
                        <small class="font-bold">Distância Estimada</small>
                        <p>
                          {{
                            convertMetersToDistance(calculatedEstimates.estimatedDistance)
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
                    <div
                      v-if="showContractProductAlert"
                      class="p-4 bg-amber-100 rounded-md border border-zinc-900"
                    >
                      <h3 class="mb-2 font-bold uppercase">Importante:</h3>
                      <p>
                        O Serviço
                        <span class="font-bold">{{ selectedProduct.name }}</span> é
                        oferecido no modelo <span class="font-bold">À Disposição</span>.
                        Confira abaixo as franquias inclusas neste serviço.
                      </p>
                    </div>
                    <div class="p-4 border-t border-zinc-900">
                      <div v-if="showContractProductAlert" class="mb-4">
                        <p class="text-sm flex items-center justify-between gap-2">
                          <span class="font-bold"> Franquia de Km </span>
                          <span
                            class="mx-2 flex-1 border-b border-dashed border-zinc-400"
                          />
                          <span class="font-bold">
                            {{ selectedProduct.includedKms }} KM
                          </span>
                        </p>
                        <p class="text-sm flex items-center justify-between gap-2">
                          <span class="font-bold"> Franquia de Horas </span>
                          <span
                            class="mx-2 flex-1 border-b border-dashed border-zinc-400"
                          />
                          <span class="font-bold">
                            {{ selectedProduct.includedHours }} Hs
                          </span>
                        </p>
                      </div>

                      <div class="mb-4 flex items-center">
                        <p class="flex justify-between text-sm w-full">
                          <span class="font-bold">
                            Atendimento - {{ selectedProduct.name }}
                          </span>
                          <span
                            class="relative bottom-2 mx-2 flex-1 border-b border-dashed border-zinc-400"
                          />
                          <span class="font-bold">
                            {{ currencyFormat(calculatedEstimates.estimatedPrice) }}
                          </span>
                        </p>
                      </div>

                      <div v-if="selectedRideAddons.length">
                        <small class="font-bold text-muted-foreground"
                          >Serviços opcionais</small
                        >
                        <p
                          v-for="item in selectedRideAddons"
                          class="flex justify-between text-sm w-full"
                        >
                          <span class="font-bold">{{ item.code }} - {{ item.name }}</span>
                          <span
                            class="relative bottom-2 mx-2 flex-1 border-b border-dashed border-zinc-400"
                          />
                          <span class="font-bold">
                            {{ currencyFormat(item.basePrice) }}
                          </span>
                        </p>
                      </div>
                      <p class="mt-4 font-bold">Total estimado*</p>
                      <p class="font-bold text-3xl">
                        {{ currencyFormat(calculatedEstimates?.estimatedTotalPrice) }}
                      </p>
                      <small class="text-muted-foreground text-[12px] leading-[0rem]">
                        * O valor total final desse serviço será calculado ao término do
                        atendimento.
                      </small>
                    </div>
                  </div>
                  <Button
                    type="button"
                    class="p-6 text-lg w-full"
                    @click.prevent="goToPaymentSection"
                  >
                    Prosseguir para pagamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        <section id="payment-area" class="mb-10">
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
              <div class="lg:grid lg:grid-cols-2 lg:gap-4">
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
                      <FormField v-slot="{ componentField }" name="area">
                        <FormItem>
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
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
        <div
          v-if="paymentMethod && calculatedEstimates.estimatedPrice"
          class="my-6 w-full flex gap-6"
        >
          <Button
            type="button"
            class="p-6 px-10 uppercase"
            @click.prevent="showPaymentModal"
          >
            <LoaderCircle v-if="loadingGenerateRide" class="animate-spin" />

            {{
              paymentMethod === 'corporative' && form.values.area
                ? 'Gerar atendimento corporativo'
                : 'Gerar atendimento'
            }}
          </Button>
          <Button
            type="button"
            variant="secondary"
            class="p-6 uppercase"
            @click.prevent="
              () => {
                navigateTo('/corporative/rides/open');
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
        :admin="true"
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
            user: data?.user?.name as string,
            email: data?.user?.email as string,
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
