import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import PaymentStatusFlag from '~/components/shared/PaymentStatusFlag.vue';
import RideStatusFlag from '~/components/shared/RideStatusFlag.vue';
import { currencyFormat } from '~/lib/utils';

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
      return h('div', { class: 'capitalize' }, [
        normalize,
        data?.travel.stops?.length > 0
          ? h(
              'span',
              {
                class:
                  'ml-1 px-2 py-0.5 text-center bg-zinc-900 text-zinc-300 text-xs w-fit rounded-md',
              },
              `${data?.travel.stops?.length > 1 ? data?.travel.stops?.length + ' paradas' : data?.travel.stops?.length + ' parada'}`,
            )
          : '',
      ] as any);
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
  // columnHelper.display({
  //   id: 'stops',
  //   enableHiding: false,
  //   header: () => h('div', { class: 'text-left' }, 'Paradas'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h('div', { class: 'capitalize' }, data?.travel?.stops?.length);
  //   },
  // }),
  columnHelper.display({
    id: 'travelDate',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'capitalize' },
        `${new Date(data.travel.date as string).toLocaleDateString('pt-BR')} - ${data.travel.departTime}`,
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
  columnHelper.accessor('billing', {
    header: () => h('div', { class: 'text-left' }, 'Pagamento'),
    cell: ({ row }) => {
      const data = row.original;
      return h(PaymentStatusFlag, {
        paymentStatus: data.billing.status,
        paymentUrl: data.billing.paymentUrl || '',
      });
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
