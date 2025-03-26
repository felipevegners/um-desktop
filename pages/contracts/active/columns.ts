import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('number', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Número', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('number')),
  }),
  columnHelper.accessor('customer', {
    header: () => h('div', { class: 'text-left' }, 'Empresa'),
    cell: ({ row }) =>
      h('div', { class: 'lowercase' }, row.getValue('customer')),
  }),
  columnHelper.accessor('managerName', {
    header: () => h('div', { class: 'text-left' }, 'Gerente Master'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('managerName')),
  }),
  columnHelper.accessor('managerEmail', {
    header: () => h('div', { class: 'text-left' }, 'E-mail Gerente'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('managerEmail'),
      );
    },
  }),
  columnHelper.accessor('branches', {
    header: () => h('div', { class: 'text-left' }, 'Filiais'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('branches'),
      );
    },
  }),
  columnHelper.accessor('users', {
    header: () => h('div', { class: 'text-left' }, 'Usuários ativos'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('branches'),
      );
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${
            status === 'active'
              ? 'bg-green-600'
              : status === 'inactive'
                ? 'bg-red-600'
                : 'bg-yellow-500'
          }`,
        },
        status === 'active'
          ? 'Aprovado'
          : status === 'inactive'
            ? 'Inativo'
            : 'Pendente',
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      return h('div', { class: 'relative text-left' }, h('p', 'Editar'));
    },
  }),
];
