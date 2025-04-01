import { Button } from '@/components/ui/button';
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
        () => ['Serviço', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('name')),
  }),
  columnHelper.accessor('description', {
    header: () => h('div', { class: 'text-left' }, 'Descrição'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('description')),
  }),
  columnHelper.accessor('price', {
    header: () => h('div', { class: 'text-left' }, 'Valor Padrão'),
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
  columnHelper.accessor('enabled', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('enabled'),
      );
    },
  }),
  // columnHelper.display({
  //   id: 'actions',
  //   enableHiding: false,
  //   header: () => h('div', { class: 'text-left' }, 'Ações'),
  //   cell: ({ row }) => {
  //     return h(
  //       'div',
  //       { class: 'relative text-left' },
  //       h(DeleteAction, {
  //         data: row.original,
  //         loading: true,
  //         remove: () => {},
  //         formControl: () => {},
  //       }),
  //     );
  //   },
  // }),
];
