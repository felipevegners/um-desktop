import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('branchCode', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'p-0 hover:bg-transparent',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Código', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'uppercase' }, row.getValue('branchCode')),
  }),
  columnHelper.accessor('fantasyName', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'p-0 hover:bg-transparent',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Empresa', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('fantasyName')),
  }),
  columnHelper.accessor('document', {
    header: () => h('div', { class: 'text-left' }, 'CNPJ'),
    cell: ({ row }) => {
      const value: any = row.getValue('document');
      return h('div', { class: 'capitalize' }, value);
    },
  }),
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Telefone'),
    cell: ({ row }) => {
      const value: any = row.getValue('phone');
      return h('div', { class: 'capitalize' }, value);
    },
  }),
  columnHelper.accessor('manager', {
    header: () => h('div', { class: 'text-left' }, 'Gestor da Filial'),
    cell: ({ row }) => {
      const value: any = row.getValue('manager');
      console.log('---> ', value);
      return h('div', { class: 'capitalize' }, value?.username);
    },
  }),

  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-full text-white text-xs max-w-[80px] ${
            status === 'validated' ? 'bg-green-600' : 'bg-yellow-500'
          }`,
        },
        status === 'validated' ? 'Validado' : 'Pendente',
      );
    },
  }),
];
