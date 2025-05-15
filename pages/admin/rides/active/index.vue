<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { LoaderCircle, Plus } from 'lucide-vue-next';
import { ref } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';
import TableActions from '~/components/shared/TableActions.vue';

import { columns } from './columns';

const columnHelper = createColumnHelper<any>();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Atendimentos Ativos | Urban Mobi',
});

const isLoading = ref<boolean>(false);

// const mockData = [
//   {
//     id: '6s6f8273d9sas9d8d9f8sdf9',
//     rideNum: '0001',
//     customer: {
//       id: '66uh6kd0tdts9tds9sd8f',
//       name: 'Enel do Brasil',
//     },
//     user: {
//       id: '5454kj33h4534d8ffd8sd78',
//       name: 'João Francisco',
//     },
//     driver: {
//       id: '454353409wfsds98fsddfs9',
//       name: 'Felipe Vegners',
//     },
//     rideDeparture: 'Rua Laranjal Paulista, 766 - Vila Pompéia - Campinas, SP',
//     rideDestination: 'Rua Francisco Glicério, 1089 - Centro - Campinas, SP',
//     rideDateAndTime: {
//       date: '26/03/2025',
//       departTime: '06:00:00',
//       arriveTime: '06:32:00',
//     },
//     costs: 345.6,
//     status: 'scheduled',
//     accepted: {
//       status: true,
//       date: '24/03/2025',
//     },
//     routes: {},
//   },
// ];

const finalColumns = [
  ...columns,
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
          options: ['preview', 'edit', 'delete'],
          loading: false,
          onView: () => {},
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
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="font-bold text-black text-3xl">Atendimentos Ativos</h1>
      <Button @click="navigateTo('/admin/rides/new')">
        <Plus class="w-4 h-4" /> Criar novo atendimento
      </Button>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="[]"
        sortby="user"
        :columnPin="['rideNum', 'user']"
        :filterBy="'nome do Usuário'"
      />
    </section>
  </main>
</template>

<style scoped></style>
