import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('image', {
    header: () => h('div', { class: 'text-left text-xs' }, 'Imagem'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('image'),
      );
    },
  }),
  columnHelper.accessor('code', {
    header: () => h('div', { class: 'text-left text-xs' }, 'Código'),
    cell: ({ row }) =>
      h(
        'div',
        {
          class:
            'px-2 py-1 uppercase text-xs text-white text-center bg-zinc-700 rounded-md',
        },
        row.getValue('code'),
      ),
  }),
  columnHelper.accessor('name', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'text-left text-xs',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize text-left text-xs' }, row.getValue('name')),
  }),
  columnHelper.accessor('type', {
    header: () =>
      h('div', { class: 'text-center text-xs' }, 'Tipo de Cobrança'),
    cell: ({ row }) => {
      const value = row.getValue('type');
      return h(
        'div',
        { class: 'capitalize text-xs text-center' },
        value === 'contract'
          ? 'Valor fechado'
          : value === 'free-km'
            ? 'Valor Km/Min'
            : 'Valor Km',
      );
    },
  }),
  columnHelper.accessor('capacity', {
    header: () => h('div', { class: 'text-center text-xs' }, 'Capacidade'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'capitalize text-xs text-center' },
        row.getValue('capacity'),
      ),
  }),
  columnHelper.accessor('basePrice', {
    header: () => h('div', { class: 'text-center text-xs' }, 'Valor Base'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-center text-xs' },
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(parseFloat(row.getValue('basePrice'))),
      );
    },
  }),
  columnHelper.accessor('includedKms', {
    header: () => h('div', { class: 'text-center text-xs' }, 'Franquia de Km'),
    cell: ({ row }) => {
      const value = row.getValue('includedKms');
      return h(
        'div',
        { class: 'text-center  text-xs' },
        `${row.getValue('includedKms') === null ? '-' : row.getValue('includedKms') + 'Km'}`,
      );
    },
  }),
  columnHelper.accessor('includedHours', {
    header: () =>
      h('div', { class: 'text-center text-xs' }, 'Franquia de Horas'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-center text-xs' },
        `${row.getValue('includedHours') === null ? '-' : row.getValue('includedHours') + 'h'}`,
      );
    },
  }),
  columnHelper.accessor('kmPrice', {
    header: () => h('div', { class: 'text-center text-xs' }, 'Valor Km'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-center text-xs' },
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(parseFloat(row.getValue('kmPrice'))),
      );
    },
  }),
  columnHelper.accessor('minutePrice', {
    header: () => h('div', { class: 'text-center text-xs' }, 'Valor Minuto'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-center text-xs' },
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(row.getValue('minutePrice')),
      );
    },
  }),
  columnHelper.accessor('enabled', {
    header: () => h('div', { class: 'text-center text-xs' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('enabled');
      return h(
        'div',
        {
          class: `
          uppercase px-1 text-white text-center text-[10px] rounded-md ${status === true ? 'bg-green-600' : 'bg-red-600'}
          `,
        },
        status === true ? 'Ativo' : 'Inativo',
      );
    },
  }),
];
