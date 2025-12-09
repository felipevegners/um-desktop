<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarClock, LoaderCircle, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import TableActions from '~/components/shared/TableActions.vue';
import { useRidesStore } from '~/stores/rides.store';

import { columns } from './columns';

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { loadingData, rides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();
const contractRidesList = ref([]);

const { data } = useAuth();
//@ts-ignore
const contractId = data.value?.user.contract?.contractId;
//@ts-ignore
const role = data.value?.user?.role;

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Abertos | Urban Mobi',
});

onMounted(async () => {
  await getRidesByContractAction(contractId);
  contractRidesList.value = rides?.value.filter(
    (ride: any) => ride.status !== 'cancelled' && ride.status !== 'completed',
  );
});

const viewRide = (rideId: string) => {
  navigateTo({
    name: 'corporative-rides-preview-id',
    params: { id: rideId },
  });
};

const editRide = (rideId: string) => {
  navigateTo({
    name: 'corporative-rides-edit-id',
    params: { id: rideId },
  });
};

const finalColumns = [
  ...columns,
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const { id } = row.original;
      if (role === 'master-manager') {
        return h(
          'div',
          { class: 'relative text-left' },
          h(TableActions, {
            dataId: id,
            options: ['edit'],
            loading: false,
            onEdit: editRide,
          }),
        );
      } else {
        return h(
          'div',
          { class: 'relative text-left' },
          h(TableActions, {
            dataId: id,
            options: ['preview'],
            loading: false,
            onView: viewRide,
          }),
        );
      }
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarClock :size="24" />
        Atendimentos Agendados
      </h1>
      <Button @click="navigateTo('/corporative/rides/new')">
        <Plus class="w-4 h-4" />Novo Atendimento
      </Button>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="contractRidesList"
        sortby="code"
        :columnPin="['code']"
        :filterBy="'código do atendimento'"
      />
    </section>
  </main>
</template>

<style scoped></style>
