import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('serviceImage', {
    header: () => h('div', { class: 'text-left' }, 'Imagem'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('serviceImage'),
      );
    },
  }),
  columnHelper.accessor('identifier', {
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
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('identifier')),
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
        () => ['Serviço', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('name')),
  }),
  columnHelper.accessor('capacity', {
    header: () => h('div', { class: 'text-left' }, 'Capacidade'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('capacity')),
  }),
  columnHelper.accessor('basePrice', {
    header: () => h('div', { class: 'text-left' }, 'Valor Base'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'capitalize' },
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(parseFloat(row.getValue('basePrice'))),
      ),
  }),
  columnHelper.accessor('baseDistance', {
    header: () => h('div', { class: 'text-left' }, 'Distância Base (Km)'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('baseDistance'),
      );
    },
  }),
  columnHelper.accessor('baseTime', {
    header: () => h('div', { class: 'text-left' }, 'Tempo Base'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('baseTime'),
      );
    },
  }),
  columnHelper.accessor('distancePrice', {
    header: () => h('div', { class: 'text-left' }, 'Valor Distância'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('distancePrice'),
      );
    },
  }),
  columnHelper.accessor('timePrice', {
    header: () => h('div', { class: 'text-left' }, 'Valor Tempo (R$ x min)'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('timePrice'),
      );
    },
  }),
  columnHelper.accessor('priceCalculation', {
    header: () => h('div', { class: 'text-left' }, 'Base de Cálculos'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('priceCalculation'),
      );
    },
  }),
];
