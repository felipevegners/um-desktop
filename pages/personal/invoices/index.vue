<script setup lang="ts">
import { createColumnHelper } from '@tanstack/vue-table';
import { Receipt } from 'lucide-vue-next';
import DataTable from '~/components/shared/DataTable.vue';
import ListPageLoading from '~/components/shared/ListPageLoading.vue';
import TableActions from '~/components/shared/TableActions.vue';

import { columns } from './columns';

const columnHelper = createColumnHelper<any>();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Meus Recibos | Urban Mobi',
});

const viewInvoice = (invoiceId: string) => {
  navigateTo({
    name: 'personal-invoices-preview-id',
    params: { id: invoiceId },
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
      return h(
        'div',
        { class: 'relative text-left' },
        h(TableActions, {
          dataId: id,
          options: ['preview'],
          loading: false,
          onView: viewInvoice,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-4 md:p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Receipt :size="24" />
        Meus Recibos
      </h1>
    </section>
    <ListPageLoading v-if="false" />
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="[]"
        sortby="code"
        :columnPin="['code']"
        :filterBy="'código do recibo'"
      />
    </section>
  </main>
</template>

<style scoped></style>
