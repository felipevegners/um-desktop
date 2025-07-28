import { Button } from '@/components/ui/button';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import RideStatusFlag from '~/components/shared/RideStatusFlag.vue';
import { currencyFormat, sanitizePhone } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns: any = [
  columnHelper.accessor('code', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'pl-0',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Código', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }: any) =>
      h('div', { class: 'capitalize font-bold' }, row.getValue('code')),
  }),
  columnHelper.display({
    id: 'originAddress',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Origem'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.travel.originAddress.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
    },
  }),
  columnHelper.display({
    id: 'destinationAddress',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Destino'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.travel.destinationAddress.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
    },
  }),
  columnHelper.display({
    id: 'travelDate',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'capitalize' },
        `${data.travel.date} - ${data.travel.departTime}`,
      );
    },
  }),
  columnHelper.accessor('price', {
    header: () => h('div', { class: 'text-left' }, 'Valor'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        {
          class: `capitalize font-bold ${data?.billing?.status === 'paid' ? 'text-green-600' : data.billing.status === 'invoice' ? 'text-amber-600' : 'text-red-600'}`,
        },
        currencyFormat(row.getValue('price') + ' ' + data.billing.status),
      );
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(RideStatusFlag, {
        rideStatus: status,
      });
    },
  }),
];
