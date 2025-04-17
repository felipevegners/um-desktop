import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, CircleCheck, CircleX } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('username', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome de Usuário', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('username')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('email')),
  }),
  columnHelper.accessor('customerName', {
    header: () => h('div', { class: 'text-left' }, 'Empresa'),
    cell: ({ row }) =>
      h('div', { class: 'capitilize' }, row.getValue('customerName')),
  }),
  columnHelper.accessor('role', {
    header: () => h('div', { class: 'text-left' }, 'Nível de Permissão'),
    cell: ({ row }) => {
      return h('div', { class: 'text-left font-medium' }, row.getValue('role'));
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
