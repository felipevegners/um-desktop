<script setup lang="ts">
import { SharedBackLink } from '#components';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import 'add-to-calendar-button';
import {
  CalendarDays,
  LoaderCircle,
  Map,
  SquareCheck,
  SquareDot,
  SquareSquare,
  X,
} from 'lucide-vue-next';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { currencyFormat, polyLineCodec, sanitizeRideDate } from '~/lib/utils';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const customIconStart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dot-icon lucide-square-dot"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="12" r="1"/></svg>`;
const customIconStop = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pause-icon lucide-square-pause"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>`;
const customIconEnd = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-icon lucide-square-check"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Visualizar Atendimento | Urban Mobi',
});

const { toast } = useToast();
const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction, updateRideAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

const showCancelationModal = ref<boolean>(false);
const routePolyLine = ref();
const markers = ref<any>([]);
const center = ref<any>({ lat: 0, lng: 0 });
const initialZoom = ref(1);
const mapRef = ref<any>(null);
const ridePath = ref<any>({
  path: [],
  geodesic: true,
  strokeColor: '#000000',
  strokeOpacity: 1.0,
  strokeWeight: 5,
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

const toggleCancelationModal = () => {
  showCancelationModal.value = !showCancelationModal.value;
};

const cancelRide = async () => {
  const payload = {
    ...ride?.value,
    status: 'cancelled',
  };
  try {
    await updateRideAction(payload);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao cancelar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Atendimento cancelado com sucesso!`,
    });
    navigateTo('/personal/rides/open');
  }
};

onBeforeMount(async () => {
  await getRideByIdAction(route.params.id as string);
});

const travelEndTimeCalc = (time1: any, time2: any) => {
  const timeToMinutes = (timeString: any) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Function to convert total minutes back to "HH:MM" format
  const minutesToTime = (totalMinutes: any) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    // Pad with leading zeros if necessary
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}`;
  };

  // Convert both times to minutes
  const totalMinutes1 = timeToMinutes(time1);
  const totalMinutes2 = timeToMinutes(time2);

  // Sum the total minutes
  const sumOfMinutes = totalMinutes1 + totalMinutes2;

  // Convert the sum back to "HH:MM" format
  return minutesToTime(sumOfMinutes);
};
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays :size="24" />
        Detalhes do Atendimento - #{{ ride?.code }}
      </h1>
      <div class="flex items-center gap-6">
        <Button
          @click="toggleCancelationModal"
          type="button"
          variant="destructive"
          class="p-6"
        >
          <X />
          Cancelar Atendimento
        </Button>
      </div>
      <AlertDialog :open="showCancelationModal">
        <AlertDialogContent class="flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deseja cancelar o atendimento {{ ride?.code }}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>AVISO:</strong> O estorno do pagamento será processado em até 3 dias
              úteis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter class="mt-10">
            <AlertDialogCancel @click="toggleCancelationModal">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction class="bg-red-500 hover:bg-red-600" @click="cancelRide">
              <LoaderCircle v-if="loadingData" class="animate-spin" />
              Cancelar Atendimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
    <section v-if="loadingData" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <div class="mb-6 flex items-center gap-2">
            <Map />
            <h3 class="text-sm font-bold">Dados do atendimento</h3>
            <RideStatusFlag :ride-status="ride.status" />
          </div>
          <div class="mb-6 md:grid md:grid-cols-5 md:gap-6">
            <div class="p-4 col-span-3 row-span-4 bg-white rounded-md">
              <GoogleMap
                ref="mapRef"
                :api-key="API_KEY"
                style="width: 100%; height: 100%"
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
              </GoogleMap>
            </div>
            <div class="p-6 flex flex-col items-start bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="mb-3 inline-block text-xl font-bold">
                {{ sanitizeRideDate(ride?.travel.date) }}
              </p>
              <div>
                <add-to-calendar-button
                  styleDark="--btn-background: #09090B; --btn-shadow: 0;"
                  :name="`Atendimento - ${ride.code}`"
                  :location="`${ride.travel.originAddress}`"
                  :description="`[strong]Corrida Urban Mobi - ${ride.code}[/strong][strong][p]Origem:[/strong] ${ride.travel.originAddress}][strong][/p]Destino:[/strong] ${ride.travel.destinationAddress}`"
                  :startDate="`${ride.travel.date}`"
                  :startTime="`${ride.travel.departTime}`"
                  :endTime="`${travelEndTimeCalc(ride.travel.departTime, ride.travel.duration)}`"
                  timeZone="America/Sao_Paulo"
                  label="Adicionar ao Calendário"
                  options="'Apple','Google','Outlook.com'"
                  lightMode="dark"
                  size="3"
                ></add-to-calendar-button>
              </div>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Hora embarque</p>
              <p class="text-xl font-bold">{{ ride?.travel.departTime }}HS</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Passageiros</p>
              <p class="text-xl font-bold">{{ ride?.travel.passengers }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Distância</p>
              <p class="text-xl font-bold">{{ ride?.travel.distance }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Duração</p>
              <p class="text-xl font-bold">{{ ride?.travel.duration }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Serviço Contratado</p>
              <p class="text-xl font-bold">
                <SharedProductTag
                  :label="ride?.product.name"
                  :type="ride?.product.name"
                />
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Valor total</p>
              <p class="text-xl font-bold">{{ currencyFormat(ride?.price) }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Pagamento</p>
              <SharedPaymentStatusFlag
                :payment-status="ride?.billing.status"
                :payment-url="ride.billing.paymentUrl"
              />
              <p class="text-base font-bold">
                {{
                  ride?.billing.paymentMethod === 'creditcard'
                    ? 'Cartão de Crédito'
                    : ride?.billing.paymentMethod === 'pix'
                      ? 'À Vista - PIX'
                      : ride?.billing.paymentMethod === 'cielo'
                        ? 'Cartão de Crédito'
                        : 'Faturamento Corp.'
                }}
              </p>
              <p v-if="ride?.billing.installments">
                Parcelado {{ ride.billing.installments }}x
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5 space-y-2">
              <p class="text-sm text-zinc-600">Origem</p>
              <p class="text-xl font-bold flex items-center gap-2">
                <SquareDot />
                {{ ride?.travel.originAddress }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5 space-y-2">
              <p class="text-sm text-zinc-600">Paradas</p>
              <div
                v-if="ride?.travel.stops.length"
                v-for="(stop, index) in ride?.travel.stops"
                class="mt-3"
              >
                <p class="font-normal">Parada {{ index + 1 }}</p>
                <p class="text-xl font-bold flex items-center gap-2">
                  <SquareSquare />
                  {{ stop.address }}
                </p>
              </div>
              <div v-else class="mt-3">
                <p class="font-bold">Não há paradas neste percurso.</p>
              </div>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5 space-y-2">
              <p class="text-sm text-zinc-600">Destino</p>
              <p class="text-xl font-bold flex items-center gap-2">
                <SquareCheck />
                {{ ride?.travel.destinationAddress }}
              </p>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Dados do Motorista</h2>
          <div class="md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md col-span-2 space-y-2">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ ride?.driver.name || 'Sem motorista' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Celular</p>
              <p class="text-xl font-bold">{{ ride?.driver.phone || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Veículo</p>
              <p class="text-xl font-bold">{{ ride?.driver?.car?.model || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-4 space-y-2">
              <p class="text-sm text-zinc-600">Observações ao Motorista</p>
              <p class="text-xl font-bold">{{ ride?.observations || '-' }}</p>
            </div>
          </div>
        </section>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Agendado por</h2>
          <div class="md:grid md:grid-cols-3 md:gap-6">
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ ride?.dispatcher.user || '-' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">E-mail</p>
              <p class="text-xl font-bold">{{ ride?.dispatcher.email || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="text-xl font-bold">{{ ride?.dispatcher.dispatchDate || '-' }}</p>
            </div>
          </div>
        </section>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
