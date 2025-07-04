import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

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
    cell: ({ row }) => h('div', { class: 'uppercase' }, row.getValue('branchCode')),
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
        () => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('fantasyName')),
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
    header: () => h('div', { class: 'text-left' }, 'Gestor'),
    cell: ({ row }) => {
      const value: any = row.getValue('manager');
      return h('div', { class: 'capitalize' }, value?.username);
    },
  }),
  columnHelper.accessor('manager', {
    header: () => h('div', { class: 'text-left' }, 'E-mail Gestor'),
    cell: ({ row }) => {
      const value: any = row.getValue('manager');
      return h('div', { class: 'lowercase' }, value?.email);
    },
  }),
  columnHelper.accessor('budget', {
    header: () => h('div', { class: 'text-left' }, 'Budget'),
    cell: ({ row }) => {
      const value: any = row.getValue('budget');
      return h('div', { class: 'capitalize' }, currencyFormat(value));
    },
  }),

  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-full text-white text-xs w-fit ${
            status === 'validated' ? 'bg-green-600' : 'bg-amber-500'
          }`,
        },
        status === 'validated' ? 'Validado' : 'Pendente',
      );
    },
  }),
];
