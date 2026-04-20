<script setup lang="ts">
import { SharedBackLink } from '#components';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  ArrowLeftRight,
  CalendarDays,
  Car,
  Check,
  Hand,
  LoaderCircle,
  SquareCheck,
  SquareDot,
  SquareSquare,
} from 'lucide-vue-next';
import { dateFormat, sanitizeRideDate } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Visualizar Atendimento | Urban Mobi',
});

const { toast } = useToast();
const route = useRoute();
const { data } = useAuth();

const ridesStore = useRidesStore();
const { getRideByIdAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

const driverStore = useDriverStore();
const { getDriverByIdAction } = driverStore;
const { driver } = storeToRefs(driverStore);

const showCancelationModal = ref<boolean>(false);
const loadingCancelAndFinish = ref<boolean>(false);
const refusalReason = ref<string>('');
const showSelectCar = ref<boolean>(false);
const selectedCar = ref<any>();
const showConfirmCar = ref<boolean>(false);
const loadingSetCar = ref<boolean>(false);
const showChangeCar = ref<boolean>(false);
const loadingAcceptRide = ref<boolean>(false);

const toggleCancelationModal = () => {
  showCancelationModal.value = !showCancelationModal.value;
  if (!showCancelationModal.value) {
    refusalReason.value = '';
  }
};

const onCancelationModalOpenChange = (open: boolean) => {
  showCancelationModal.value = open;
  if (!open) {
    refusalReason.value = '';
  }
};

const handleRefuseRide = async () => {
  if (!ride?.value?.id) {
    toast({
      title: 'Oops!',
      description: 'Atendimento inválido para recusa.',
      variant: 'destructive',
    });
    return;
  }

  const reason = refusalReason.value.trim();
  if (!reason) {
    toast({
      title: 'Atenção',
      description: 'Informe o motivo da recusa do atendimento.',
      variant: 'destructive',
    });
    return;
  }

  const rejectedDriverPayload = {
    id: '',
    name: '',
    phone: '',
    email: '',
    hasCarSelected: false,
    selectedCar: {
      model: '',
      color: '',
      plate: '',
    },
    rejectionReason: reason,
  };

  try {
    loadingCancelAndFinish.value = true;
    await $fetch('/api/rides-reject', {
      method: 'POST',
      body: {
        id: ride.value.id,
        reason,
        accepted: false,
        driver: rejectedDriverPayload,
      },
    });

    if (ride?.value) {
      ride.value = {
        ...ride.value,
        accepted: false,
        status: 'pending',
        reason,
        driver: rejectedDriverPayload,
      };
    }

    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Atendimento recusado com sucesso.`,
    });

    showCancelationModal.value = false;
    refusalReason.value = '';
    navigateTo('/driver/rides/open');
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao recusar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingCancelAndFinish.value = false;
  }
};

onBeforeMount(async () => {
  await getRideByIdAction(route.params.id as string);
  //@ts-ignore
  await getDriverByIdAction(data?.value?.user?.id as string);
});

const travelEndTimeCalc = (time1: any, time2: any) => {
  const timeToMinutes = (timeString: any) => {
    if (timeString === null || timeString === undefined || timeString === '') {
      return 0;
    }

    if (typeof timeString === 'number') {
      return timeString;
    }

    const value = String(timeString).trim();

    if (value.includes(':')) {
      const [hoursRaw, minutesRaw] = value.split(':');
      const hours = Number(hoursRaw);
      const minutes = Number(minutesRaw);
      return (
        (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
      );
    }

    // Fallback for values like "90", "90 min", "90m"
    const numeric = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
    return Number.isNaN(numeric) ? 0 : numeric;
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

const sanitizeDriverCars = computed(() => {
  return driver.value.driverCars.map((car: any) => {
    return {
      label: `${car.carModel} - ${car.carColor} - ${car.carPlate}`,
      value: `${car.carModel} - ${car.carColor} - ${car.carPlate}`,
    };
  });
});

const setSelectedCar = (value: any) => {
  const sanitizeCarString = value.split('-');
  selectedCar.value = {
    model: String(sanitizeCarString[0] || '').trim(),
    color: String(sanitizeCarString[1] || '').trim(),
    plate: `${String(sanitizeCarString[2] || '').trim()}-${String(sanitizeCarString[3] || '').trim()}`,
  };
  showConfirmCar.value = true;
};

const handleSetDriverCar = async () => {
  if (
    !selectedCar.value?.model ||
    !selectedCar.value?.color ||
    !selectedCar.value?.plate
  ) {
    toast({
      title: 'Oops!',
      description: `Selecione um veículo válido para continuar.`,
      variant: 'destructive',
    });
    return;
  }

  loadingSetCar.value = true;
  if (ride?.value?.driver) {
    ride.value.driver = {
      ...ride.value.driver,
      selectedCar: selectedCar.value,
      hasCarSelected: true,
    };
  }

  showConfirmCar.value = false;
  showSelectCar.value = false;
  showChangeCar.value = false;
  loadingSetCar.value = false;

  toast({
    title: 'Tudo pronto!',
    class: 'bg-green-600 border-0 text-white text-2xl',
    description: `Veículo selecionado. Clique em \"Aceitar Atendimento\" para confirmar o aceite.`,
  });
};

const handleAcceptRide = async () => {
  if (!ride?.value?.id) {
    toast({
      title: 'Oops!',
      description: 'Atendimento inválido para aceite.',
      variant: 'destructive',
    });
    return;
  }

  const selectedRideCar = ride?.value?.driver?.selectedCar;
  if (!selectedRideCar?.model || !selectedRideCar?.color || !selectedRideCar?.plate) {
    showSelectCar.value = true;
    toast({
      title: 'Atenção',
      description: 'Selecione um veículo antes de aceitar o atendimento.',
      variant: 'destructive',
    });
    return;
  }

  try {
    loadingAcceptRide.value = true;
    await $fetch('/api/rides-accept', {
      method: 'POST',
      body: {
        id: ride.value.id,
        selectedCar: selectedRideCar,
      },
    });

    if (ride?.value) {
      ride.value = {
        ...ride.value,
        accepted: true,
        status: 'accepted',
        driver: {
          ...ride.value.driver,
          selectedCar: selectedRideCar,
          hasCarSelected: true,
        },
      };
    }

    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: 'Atendimento aceito com sucesso!',
    });
  } catch (error: any) {
    const errorMessage =
      error?.data?.message ||
      error?.data?.statusMessage ||
      error?.statusMessage ||
      'Ocorreu um erro ao aceitar o atendimento. Tente novamente.';
    toast({
      title: 'Oops!',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    loadingAcceptRide.value = false;
  }
};

const formatDateForIcs = (dateValue: string) => {
  const value = String(dateValue || '').trim();
  if (!value) return '';
  return value.replace(/-/g, '').slice(0, 8);
};

const formatTimeForIcs = (timeValue: string) => {
  const value = String(timeValue || '').trim();
  if (!value) return '000000';

  if (!value.includes(':')) {
    const numeric = value.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    return `${numeric}00`;
  }

  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = String(Number(hoursRaw) || 0).padStart(2, '0');
  const minutes = String(Number(minutesRaw) || 0).padStart(2, '0');
  return `${hours}${minutes}00`;
};

const handleAddToCalendar = () => {
  const rideData: any = ride?.value;
  const date = String(rideData?.travel?.date || '');
  const startTime = String(rideData?.travel?.departTime || '');
  const endTime = travelEndTimeCalc(startTime, rideData?.travel?.duration);

  const eventDate = formatDateForIcs(date);
  const eventStartTime = formatTimeForIcs(startTime);
  const eventEndTime = formatTimeForIcs(endTime);

  if (!eventDate || !eventStartTime || !eventEndTime) {
    toast({
      title: 'Oops!',
      description: 'Dados insuficientes para gerar o calendário do atendimento.',
      variant: 'destructive',
    });
    return;
  }

  const summary = `Atendimento - ${rideData?.code || ''}`;
  const location = String(rideData?.travel?.originAddress || '');
  const description = `Corrida Urban Mobi - ${rideData?.code || ''}\nOrigem: ${rideData?.travel?.originAddress || ''}\nDestino: ${rideData?.travel?.destinationAddress || ''}`;

  const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
  googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
  googleCalendarUrl.searchParams.set('text', summary);
  googleCalendarUrl.searchParams.set(
    'dates',
    `${eventDate}T${eventStartTime}/${eventDate}T${eventEndTime}`,
  );
  googleCalendarUrl.searchParams.set('details', description);
  googleCalendarUrl.searchParams.set('location', location);
  googleCalendarUrl.searchParams.set('ctz', 'America/Sao_Paulo');

  window.open(googleCalendarUrl.toString(), '_blank', 'noopener,noreferrer');
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
    </section>
    <section v-if="loadingData" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <div class="mb-6 md:grid md:grid-cols-5 md:gap-6">
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Código</p>
              <p class="text-xl font-bold">{{ ride?.code }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-4">
              <p class="text-sm text-zinc-600">Status</p>
              <RideStatusFlag :ride-status="ride.status" class="w-full h-10" />
              <small v-if="ride.status === 'completed'">
                Em: {{ dateFormat(ride.updatedAt) }}
              </small>
            </div>
            <div class="p-6 flex flex-col items-start bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="mb-3 inline-block text-xl font-bold">
                {{ sanitizeRideDate(ride.travel.date) }}
              </p>
              <div v-if="ride?.status !== 'cancelled'">
                <Button type="button" variant="secondary" @click="handleAddToCalendar">
                  <CalendarDays :size="18" />
                  Abrir no Google Calendar
                </Button>
              </div>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Hora Partida</p>
              <p class="text-xl font-bold">{{ ride?.travel.departTime }}HS</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Passageiros</p>
              <p class="text-xl font-bold">{{ ride?.travel.passengers }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Nome do Passageiro</p>
              <p class="text-xl font-bold">{{ ride?.user.name }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Contato do Passageiro</p>
              <p class="text-xl font-bold">{{ ride?.user.phone }}</p>
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
            <div
              class="p-6 rounded-md space-y-2 col-span-5"
              :class="`${ride?.driver.hasCarSelected === false ? 'bg-amber-200' : 'bg-white'}`"
            >
              <p
                class="text-sm"
                :class="`${ride?.driver.hasCarSelected === false ? 'text-red-500 font-bold' : 'text-zinc-600'}`"
              >
                Veículo Selecionado
              </p>
              <div
                v-if="!ride.driver.hasCarSelected"
                class="lg:grid lg:grid-cols-4 lg:gap-6"
              >
                <div class="space-y-4 col-span-2">
                  <p>*Você ainda não selecionou o veículo para este atendimento.</p>
                  <Button type="button" class="p-6" @click="showSelectCar = true">
                    <Car />
                    Selecionar veículo
                  </Button>
                </div>
              </div>
              <div class="space-y-6">
                <div v-if="ride.driver.hasCarSelected" class="flex items-end gap-4">
                  <div>
                    <Car :size="32" />
                    <p class="text-xl font-bold">
                      {{ ride?.driver.selectedCar.model }} -
                      {{ ride?.driver.selectedCar.color }} -
                      {{ ride?.driver.selectedCar.plate }}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    @click="showChangeCar = true"
                    v-if="ride.status !== 'completed'"
                  >
                    <ArrowLeftRight />
                    Alterar Veículo
                  </Button>
                </div>
                <div class="lg:grid lg:grid-cols-4 lg:gap-6">
                  <div
                    v-if="showSelectCar || (showChangeCar && ride.status !== 'completed')"
                    class="flex items-start gap-4 col-span-1"
                  >
                    <SharedFormSelect
                      :items="sanitizeDriverCars"
                      label="Selecione"
                      class="w-fit"
                      @on-select="setSelectedCar"
                    />
                    <Button
                      v-if="showConfirmCar"
                      type="button"
                      size="icon"
                      @click="handleSetDriverCar"
                    >
                      <LoaderCircle v-if="loadingSetCar" />
                      <Check v-else />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Dados do Percurso</h2>
          <div class="md:grid md:grid-cols-3 md:gap-6">
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
                <p class="font-normal">Parada {{ Number(index) + 1 }}</p>
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
        </section>

        <section
          v-if="ride?.status !== 'completed' && ride?.status !== 'cancelled'"
          class="mt-8 pt-6 border-t border-zinc-300 flex flex-wrap items-center justify-start gap-4"
        >
          <Button
            v-if="ride?.status !== 'accepted'"
            type="button"
            class="p-6 bg-green-600 hover:bg-green-500"
            :disabled="loadingAcceptRide"
            @click="handleAcceptRide"
          >
            <LoaderCircle v-if="loadingAcceptRide" class="animate-spin" />
            <Check v-else />
            Aceitar Atendimento
          </Button>
          <Button
            type="button"
            variant="destructive"
            class="p-6"
            @click="toggleCancelationModal"
          >
            <Hand />
            Recusar Atendimento
          </Button>
        </section>
      </Card>
    </section>
  </main>
  <Dialog :open="showCancelationModal" @update:open="onCancelationModalOpenChange">
    <DialogContent class="space-y-4">
      <DialogHeader>
        <DialogTitle>Deseja Recusar este Atendimento?</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        Descreva o motivo da recusa. O atendimento voltará para pendente e ficará
        disponível para novo aceite.
      </DialogDescription>
      <Textarea
        v-model="refusalReason"
        placeholder="Informe o motivo da recusa"
        class="min-h-[110px]"
      />
      <DialogFooter>
        <div class="flex items-start justify-center gap-4 w-full">
          <Button type="button" variant="secondary" @click="toggleCancelationModal">
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            :disabled="loadingCancelAndFinish"
            @click="handleRefuseRide"
          >
            <LoaderCircle v-if="loadingCancelAndFinish" class="animate-spin" />
            <span v-else>Confirmar recusa</span>
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
