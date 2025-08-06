<script setup lang="ts">
import { SharedBackLink } from '#components';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import 'add-to-calendar-button';
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
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';
import { currencyFormat, dateFormat, sanitizeRideDate } from '~/lib/utils';

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
const { getRideByIdAction, updateRideAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

const driverStore = useDriverStore();
const { getDriverByIdAction } = driverStore;
const { driver } = storeToRefs(driverStore);

const showCancelationModal = ref<boolean>(false);
const showFinishModal = ref<boolean>(false);
const loadingCancelAndFinish = ref<boolean>(false);
const showSelectCar = ref<boolean>(false);
const selectedCar = ref<any>();
const showConfirmCar = ref<boolean>(false);
const loadingSetCar = ref<boolean>(false);
const showChangeCar = ref<boolean>(false);

const toggleCancelationModal = () => {
  showCancelationModal.value = !showCancelationModal.value;
};

const toggleFinishRideModal = () => {
  showFinishModal.value = !showFinishModal.value;
};

const handleFinishRide = async () => {
  const payload = {
    ...ride?.value,
    status: 'completed',
  };
  try {
    loadingCancelAndFinish.value = true;
    await updateRideAction(payload);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Atendimento recusado com sucesso!`,
    });
    setTimeout(() => {
      loadingCancelAndFinish.value = false;
      showFinishModal.value = false;
      navigateTo('/driver/rides/open');
    }, 1500);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao finalizar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  }
};

const handleRefuseRide = async () => {
  const payload = {
    ...ride?.value,
    driver: {},
    accepted: false,
    status: 'refused',
  };
  try {
    loadingCancelAndFinish.value = true;
    await updateRideAction(payload);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao recusar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingCancelAndFinish.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Atendimento recusado com sucesso!`,
    });
    showCancelationModal.value = false;
    navigateTo('/driver/rides/open');
  }
};

onBeforeMount(async () => {
  await getRideByIdAction(route.params.id as string);
  //@ts-ignore
  await getDriverByIdAction(data?.value?.user?.id as string);
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

const enableFinishRide = computed(() => {
  const today = new Date().toLocaleDateString('pt-BR');
  const travelDate = sanitizeRideDate(ride?.value.travel?.date);
  return today >= travelDate;
});

const sanitizeDriverCars = computed(() => {
  return driver.value.driverCars.map((car: any) => {
    return {
      label: `${car.carModel} - ${car.carColor} - ${car.carPlate}`,
      value: `${car.carModel} - ${car.carColor} - ${car.carPlate}`,
    };
  });
});

const setSelectedCar = (value: any) => {
  selectedCar.value = value;
  showConfirmCar.value = true;
};

const handleSetDriverCar = async () => {
  const payload = {
    ...ride?.value,
    driver: {
      ...ride?.value.driver,
      selectedCar: selectedCar.value,
      hasCarSelected: true,
    },
  };
  try {
    loadingSetCar.value = true;
    await updateRideAction(payload);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Carro selecionado com sucesso!`,
    });
    setTimeout(() => {
      loadingSetCar.value = false;
      navigateTo('/driver/rides/open');
    }, 1000);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao selecionar o carro. Tente novamente.`,
      variant: 'destructive',
    });
  }
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
      <div
        v-if="ride?.status !== 'completed' && ride?.status !== 'cancelled'"
        class="flex items-center gap-6"
      >
        <Button
          v-if="enableFinishRide"
          @click="toggleFinishRideModal"
          type="button"
          class="p-6 bg-green-600 hover:bg-green-500"
        >
          <Check />
          Finalizar Atendimento
        </Button>
        <Button
          @click="toggleCancelationModal"
          type="button"
          variant="destructive"
          class="p-6"
        >
          <Hand />
          Recusar Atendimento
        </Button>
      </div>
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
              <RideStatusFlag :ride-status="ride.status" class="w-full" />
              <small v-if="ride.status === 'completed'">
                Em: {{ dateFormat(ride.updatedAt) }}
              </small>
            </div>
            <div class="p-6 flex flex-col items-start bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="mb-3 inline-block text-xl font-bold">
                {{ sanitizeRideDate(ride.travel.date) }}
              </p>
              <div v-if="ride?.status !== 'completed' && ride?.status !== 'cancelled'">
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
                Carro Selecionado
              </p>
              <div
                v-if="!ride.driver.hasCarSelected"
                class="lg:grid lg:grid-cols-4 lg:gap-6"
              >
                <div class="space-y-4 col-span-2">
                  <p>
                    *Você ainda não selecionou o carro a ser utilizado neste atendimento.
                  </p>
                  <Button type="button" class="p-6" @click="showSelectCar = true">
                    <Car />
                    Selecionar carro
                  </Button>
                </div>
              </div>
              <div class="space-y-6">
                <div v-if="ride.driver.hasCarSelected" class="flex items-end gap-4">
                  <div>
                    <Car :size="32" />
                    <p class="text-xl font-bold">
                      {{ ride?.driver.selectedCar }}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    @click="showChangeCar = true"
                    v-if="ride.status !== 'completed'"
                  >
                    <ArrowLeftRight />
                    Alterar Carro
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
        </section>
      </Card>
    </section>
  </main>
  <Dialog :open="showCancelationModal" @update:open="showCancelationModal = $event">
    <DialogContent class="space-y-4">
      <DialogHeader>
        <DialogTitle>Deseja Recusar este Atendimento?</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        Essa ação irá recusar o atendimento e notificar o usuário sobre a recusa.
      </DialogDescription>
      <DialogFooter>
        <div class="flex items-start justify-center gap-4 w-full">
          <Button type="button" variant="secondary" @click="toggleCancelationModal">
            Voltar
          </Button>
          <Button type="button" variant="destructive" @click="handleRefuseRide">
            <LoaderCircle v-if="loadingCancelAndFinish" class="animate-spin" />
            Recusar
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
          <Button type="button" variant="secondary" @click="toggleFinishRideModal">
            Voltar
          </Button>
          <Button type="button" @click="handleFinishRide" class="bg-green-600">
            <LoaderCircle v-if="loadingCancelAndFinish" class="animate-spin" />
            Finalizar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
