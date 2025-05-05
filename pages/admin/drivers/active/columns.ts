import Button from '@/components/ui/button/Button.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('name', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('name')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('email')),
  }),
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Celular'),
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('phone')),
  }),
  columnHelper.accessor('document', {
    header: () => h('div', { class: 'text-left' }, 'CPF'),
    cell: ({ row }) => {
      return h('div', { class: 'text-left font-medium' }, row.getValue('document'));
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
            status === 'active' ? 'bg-green-600' : 'bg-red-600'
          }`,
        },
        status === 'active' ? 'Ativo' : 'Inativo',
      );
    },
  }),
  columnHelper.accessor('enabled', {
    header: () => h('div', { class: 'text-left' }, 'Acesso'),
    cell: ({ row }) => {
      const enabled = row.getValue('enabled');
      return h(
        'div',
        {
          class: `px-1 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${
            enabled === true ? 'bg-blue-600' : 'bg-zinc-600'
          }`,
        },
        enabled === true ? 'Permitido' : 'Negado',
      );
    },
  }),
];
