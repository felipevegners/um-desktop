import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('fantasyName', {
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
      h('div', { class: 'capitalize' }, row.getValue('fantasyName')),
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
      console.log('--> ', value);
      return h('div', { class: 'capitalize' }, value[0]?.name);
    },
  }),

  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-center' }, 'Status'),
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
