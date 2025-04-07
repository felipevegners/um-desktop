import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('image', {
    header: () => h('div', { class: 'text-left' }, 'Imagem'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('image'),
      );
    },
  }),
  columnHelper.accessor('code', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Sigla', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('code')),
  }),
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
  columnHelper.accessor('type', {
    header: () => h('div', { class: 'text-left' }, 'Tipo de Cobrança'),
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('type')),
  }),
  columnHelper.accessor('capacity', {
    header: () => h('div', { class: 'text-left' }, 'Capacidade'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('capacity')),
  }),
  columnHelper.accessor('price', {
    header: () => h('div', { class: 'text-left' }, 'Valor'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'capitalize' },
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(parseFloat(row.getValue('price'))),
      ),
  }),
  columnHelper.accessor('basePrice', {
    header: () => h('div', { class: 'text-left' }, 'Valor Base'),
    cell: ({ row }) => {
      const value = row.getValue('basePrice');
      return h(
        'div',
        { class: 'text-left font-medium' },
        value !== null
          ? new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(parseFloat(value as string))
          : '-',
      );
    },
  }),
  columnHelper.accessor('includedKms', {
    header: () => h('div', { class: 'text-left' }, 'Franquia de Km'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('baseTime'),
      );
    },
  }),
  columnHelper.accessor('includedHours', {
    header: () => h('div', { class: 'text-left' }, 'Franquia de Horas'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('includedHours'),
      );
    },
  }),
  columnHelper.accessor('kmPrice', {
    header: () => h('div', { class: 'text-left' }, 'Valor Km'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('kmPrice'),
      );
    },
  }),
  columnHelper.accessor('minutePrice', {
    header: () => h('div', { class: 'text-left' }, 'Valor Minuto'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('minutePrice'),
      );
    },
  }),
  columnHelper.accessor('enabled', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('enabled');
      return h(
        'div',
        { class: 'text-left font-medium' },
        status === true ? 'Ativo' : 'Inativo',
      );
    },
  }),
];
