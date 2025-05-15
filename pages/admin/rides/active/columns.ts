import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, Eye } from 'lucide-vue-next';

const columnHelper = createColumnHelper<any>();

export const columns: any = [
  columnHelper.accessor('rideNum', {
    header: () => h('div', { class: 'text-left' }, 'N#'),
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('rideNum')),
  }),
  columnHelper.accessor('customer', {
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
    cell: ({ row }: any) =>
      h('div', { class: 'capitalize' }, row.getValue('customer').name),
  }),
  columnHelper.display({
    id: 'rideDeparture',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Origem'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.rideDeparture.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
    },
  }),
  columnHelper.display({
    id: 'rideDestination',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Destino'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.rideDestination.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
    },
  }),
  columnHelper.accessor('rideDateAndTime', {
    header: () => h('div', { class: 'text-left' }, 'Data'),
    cell: ({ row }: any) =>
      h('div', { class: 'lowercase' }, row.getValue('rideDateAndTime').date),
  }),
  columnHelper.accessor('rideDateAndTime', {
    header: () => h('div', { class: 'text-left' }, 'Hora'),
    cell: ({ row }: any) =>
      h('div', { class: 'lowercase' }, row.getValue('rideDateAndTime').departTime),
  }),
  columnHelper.accessor('user', {
    header: () => h('div', { class: 'text-left' }, 'Usuário'),
    cell: ({ row }: any) => h('div', { class: 'capitalize' }, row.getValue('user').name),
  }),
  columnHelper.accessor('driver', {
    header: () => h('div', { class: 'text-left' }, 'Motorista'),
    cell: ({ row }: any) =>
      h('div', { class: 'capitalize' }, row.getValue('driver').name || '-'),
  }),
  columnHelper.accessor('costs', {
    header: () => h('div', { class: 'text-left' }, 'Preço'),
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('costs') || '-'),
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] 
          ${status === 'scheduled' ? 'bg-blue-600' : 'bg-green-600'}`,
        },
        status === 'scheduled' ? 'Agendado' : 'Aguardando',
      );
    },
  }),
];
