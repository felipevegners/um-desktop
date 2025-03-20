<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, Eye, LoaderCircle, Plus } from 'lucide-vue-next';
import { ref } from 'vue';
import DataTable from '~/components/shared/DataTable.vue';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Atendimentos Ativos | Urban Mobi',
});

const isLoading = ref<boolean>(false);

const mockData = [
  {
    id: '6s6f8273d9sas9d8d9f8sdf9',
    rideNum: '0001',
    customer: {
      id: '66uh6kd0tdts9tds9sd8f',
      name: 'Enel do Brasil',
    },
    user: {
      id: '5454kj33h4534d8ffd8sd78',
      name: 'João Francisco',
    },
    driver: {
      id: '454353409wfsds98fsddfs9',
      name: 'Felipe Vegners',
    },
    rideDeparture: 'Rua Laranjal Paulista, 766 - Vila Pompéia - Campinas, SP',
    rideDestination: 'Rua Francisco Glicério, 1089 - Centro - Campinas, SP',
    rideDateAndTime: {
      date: '26/03/2025',
      departTime: '06:00:00',
      arriveTime: '06:32:00',
    },
    costs: 345.6,
    status: 'scheduled',
    accepted: {
      status: true,
      date: '24/03/2025',
    },
    routes: {},
  },
];

const columnHelper = createColumnHelper<any>();

const activeRidesColumns = [
  columnHelper.accessor('rideNum', {
    header: () => h('div', { class: 'text-left' }, 'N#'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('rideNum')),
  }),
  columnHelper.accessor('customer', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Empresa', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('customer').name),
  }),
  columnHelper.display({
    id: 'rideDeparture',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Origem'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.rideDeparture.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
    },
  }),
  columnHelper.display({
    id: 'rideDestination',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Destino'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.rideDestination.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
    },
  }),
  columnHelper.accessor('rideDateAndTime', {
    header: () => h('div', { class: 'text-left' }, 'Data'),
    cell: ({ row }) =>
      h('div', { class: 'lowercase' }, row.getValue('rideDateAndTime').date),
  }),
  columnHelper.accessor('rideDateAndTime', {
    header: () => h('div', { class: 'text-left' }, 'Hora'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'lowercase' },
        row.getValue('rideDateAndTime').departTime,
      ),
  }),
  columnHelper.accessor('user', {
    header: () => h('div', { class: 'text-left' }, 'Usuário'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('user').name),
  }),
  columnHelper.accessor('driver', {
    header: () => h('div', { class: 'text-left' }, 'Motorista'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('driver').name || '-'),
  }),
  columnHelper.accessor('costs', {
    header: () => h('div', { class: 'text-left' }, 'Preço'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('costs') || '-'),
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] 
          ${status === 'scheduled' ? 'bg-blue-600' : 'bg-green-600'}`,
        },
        status === 'scheduled' ? 'Agendado' : 'Aguardando',
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-center' }, 'Ações'),
    cell: ({ row }) => {
      const passengerData = row.original;
      return h(Eye, {
        class: 'w-5 h-5 text-zinc-500 cursor-pointer',
      });
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Atendimentos Ativos</h1>
      <div v-if="!showAddForm">
        <Button @click="navigateTo('/admin/rides/new')">
          <Plus class="w-4 h-4" /> Criar novo atendimento
        </Button>
      </div>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="activeRidesColumns"
        :data="mockData"
        sortby="customer"
        :columnPin="['rideNum']"
      />
    </section>
  </main>
</template>

<style scoped></style>
