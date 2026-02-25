<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import DataTable from '@/components/shared/DataTable.vue';
import RidesTotalsDash from '@/components/shared/RidesTotalsDash.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { useRidesStore } from '@/stores/rides.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { CalendarCheck2, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from './columns';

const { data } = useAuth();
//@ts-ignore
const contractId = data.value?.user.contract?.contractId;
//@ts-ignore
const role = data.value?.user?.role;
//@ts-ignore
const userBranches = data.value?.user?.contract?.branches;

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Finalizados | Urban Mobi',
});

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { loadingData, completedRides } = storeToRefs(ridesStore);
const columnHelper = createColumnHelper<any>();
const filteredRides = ref<any>([]);

onBeforeMount(async () => {
  await getRidesByContractAction(contractId);
  if (role === 'branch-manager') {
    filteredRides.value = completedRides?.value.filter((ride: any) =>
      userBranches
        .some((filterItem: any) => filterItem.id === ride.billing.paymentData.branch)
        .sort((a: any, b: any) =>
          a.progress.finishedAt > b.progress.finishedAt
            ? -1
            : a.progress.finishedAt < b.progress.finishedAt
              ? 1
              : 0,
        ),
    );
  }
  filteredRides.value = completedRides.value.sort((a: any, b: any) =>
    a.progress.finishedAt > b.progress.finishedAt
      ? -1
      : a.progress.finishedAt < b.progress.finishedAt
        ? 1
        : 0,
  );
});

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
    header: () => h('div', { class: 'text-left text-xs leading-none' }, 'Ações'),
    cell: ({ row }) => {
      const { id } = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(TableActions, {
          dataId: id,
          options: ['preview'],
          loading: false,
          onView: editRide,
          onEdit: () => {},
          onDelete: () => {},
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarCheck2 :size="24" />
        Atendimentos Finalizados
      </h1>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <RidesTotalsDash :rides="filteredRides" />
      <DataTable
        :columns="finalColumns"
        :data="filteredRides"
        sortby="user"
        :columnPin="['code']"
        :filterBy="'código ou usuário'"
      />
    </section>
  </main>
</template>

<style scoped></style>
