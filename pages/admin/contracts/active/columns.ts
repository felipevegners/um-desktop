import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('customerName', {
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
      h('div', { class: 'capitalize' }, row.getValue('customerName')),
  }),
  columnHelper.accessor('managerName', {
    header: () => h('div', { class: 'text-left' }, 'Gestor Master'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('managerName')),
  }),
  columnHelper.accessor('managerEmail', {
    header: () => h('div', { class: 'text-left' }, 'E-mail Gestor Master'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('managerEmail'),
      );
    },
  }),
  columnHelper.accessor('customerBranches', {
    header: () => h('div', { class: 'text-left' }, 'Filiais'),
    cell: ({ row }) => {
      const { customerBranches } = row.original;
      return h(
        'div',
        { class: 'text-left font-medium' },
        customerBranches.length,
      );
    },
  }),
  columnHelper.accessor('customerUsers', {
    header: () => h('div', { class: 'text-center' }, 'Usuários Ativos'),
    cell: ({ row }) => {
      const { customerUsers } = row.original;
      return h(
        'div',
        { class: 'text-center font-medium' },
        customerUsers.length,
      );
    },
  }),
  columnHelper.accessor('services', {
    header: () => h('div', { class: 'text-center' }, 'Serviços Ativos'),
    cell: ({ row }) => {
      const { services } = row.original;
      return h('div', { class: 'text-center font-medium' }, services.length);
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
