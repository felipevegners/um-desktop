<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createColumnHelper } from '@tanstack/vue-table';
import { show } from '@unovis/ts/components/tooltip/style';
import { CalendarDays, LoaderCircle, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import FormSelect from '~/components/shared/FormSelect.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { WPP_API } from '~/config/paths';
import { sanitizePhone } from '~/lib/utils';
import { useDriverStore } from '~/stores/drivers.store';
import { useRidesStore } from '~/stores/rides.store';

import { columns } from './columns';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Backoffice - Atendimentos Abertos | Urban Mobi',
});

const ridesStore = useRidesStore();
const { getRidesAction, setRideDriverAction } = ridesStore;
const { loadingData, loadingSetDriver, rides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();

const driversStore = useDriverStore();
const { getDriversAction } = driversStore;
const { drivers } = storeToRefs(driversStore);

const selectedDriver = ref<any>();
const showSetDriver = ref<boolean>(false);
const selectedRide = ref<string>('');
const filteredRides = ref<any>([]);

onMounted(async () => {
  await getRidesAction();
  await getDriversAction();
  filteredRides.value = rides?.value.filter(
    (ride: any) => ride.status !== 'cancelled' && ride.status !== 'completed',
  );
});

const sanitizeDrivers = computed(() => {
  return drivers?.value.map((driver) => {
    return {
      label: driver.name,
      value: driver.id,
    };
  });
});

const editRide = (rideId: string) => {
  navigateTo({
    name: 'admin-rides-edit-id',
    params: { id: rideId },
  });
};

const setDriver = (driverId: string, rideId: string) => {
  const findDriver = drivers.value.find((driver) => driver.id === driverId);
  selectedDriver.value = findDriver;
  showSetDriver.value = true;
  selectedRide.value = rideId;
};

// watch(showSetDriver, async () => {
//   if (showSetDriver.value === false) {
//     resetFormSelection();
//     selectedDriver.value = {};
//     selectedRide.value = '';
//   }
// });

const contactDriver = async (driver: any) => {
  const findRide = rides?.value.find((ride: any) => ride.id === selectedRide.value);
  await setRideDriverAction(selectedRide?.value, selectedDriver.value);

  const message = `
  *Novo Atendimento - ${findRide?.code}*
  %0A*Passageiro*: ${findRide?.user.name}
  %0A*Celular*: ${findRide?.user.phone}
  %0A*Data/Hora*: ${findRide?.travel.date} / ${findRide?.travel.departTime}
  %0A------------------------------
  %0A*Dados da Viagem* 
  %0A%0A*Origem*: ${findRide?.travel.originAddress}
${
  findRide.travel.stops.length
    ? findRide.travel.stops.map((stop: any, index: any) => {
        return `%0A%0A*Parada ${index + 1}*: ${stop.address}`;
      })
    : ''
}
  %0A%0A*Destino*: ${findRide?.travel.destinationAddress}
  %0A%0A*Despachado por*: ${findRide?.dispatcher.user} - ${findRide?.dispatcher.email}`;
  const url =
    WPP_API.replace('[[phone]]', sanitizePhone(driver.phone as string)) +
    '&text=' +
    message;

  navigateTo(url, { external: true, open: { target: '_blank' } });
  navigateTo('/admin/rides/open');
};

const childRef = ref<any>(null);

const resetFormSelection = () => {
  if (childRef.value) {
    childRef?.value.reset();
  }
};

const finalColumns = [
  ...columns,
  columnHelper.display({
    id: 'driver',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Motorista'),
    cell: ({ row }) => {
      const { id, driver } = row.original;
      return h(
        'div',
        { class: 'relative text-xs' },
        driver.name ? driver.name : 'Nenhum',
        // row.original.accepted === false
        //   ? h(FormSelect, {
        //       ref: childRef,
        //       items: sanitizeDrivers.value,
        //       label: 'Selecione',
        //       'onOn-select': setDriver,
        //       tableId: id,
        //     })
        //   : row.original.driver.name,
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const { id } = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(TableActions, {
          dataId: id,
          options: ['edit'],
          loading: false,
          onView: () => {},
          onEdit: editRide,
          onDelete: () => {},
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays :size="24" />
        Atendimentos Abertos
      </h1>
      <Button @click="navigateTo('/admin/rides/new')">
        <Plus class="w-4 h-4" /> Criar novo atendimento
      </Button>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="filteredRides"
        sortby="user"
        :columnPin="['code']"
        :filterBy="'nome do Usuário'"
      />
    </section>
    <Dialog :open="showSetDriver" @update:open="showSetDriver = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="text-center">Acionar Motorista</DialogTitle>
          <DialogDescription>
            <div class="my-4 text-center space-y-4">
              <p class="text-base text-zinc-900">
                Deseja acionar o motorista {{ selectedDriver?.name }}?
              </p>
              <p class="text-muted-foreground">
                Esta ação vai atribuir este agendamento ao motorista selecionado.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div class="w-full flex items-center justify-around gap-8">
            <Button variant="ghost" type="button" @click="showSetDriver = false">
              Cancelar
            </Button>
            <Button
              type="button"
              class="bg-green-600 hover:bg-green-700"
              @click="contactDriver(selectedDriver)"
            >
              <LoaderCircle v-if="loadingSetDriver" class="animate-spin" />
              Acionar via Whatsapp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>

<style scoped></style>
