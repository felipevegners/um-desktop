import PaymentStatusFlag from '@/components/shared/PaymentStatusFlag.vue';
import ProductTag from '@/components/shared/ProductTag.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import { currencyFormat, sanitizeRideDate } from '~/lib/utils';

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
  columnHelper.accessor('user', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'pl-0',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Usuário', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }: any) =>
      h('div', { class: 'capitalize font-bold' }, row.getValue('user').name),
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
  columnHelper.display({
    id: 'travelDate',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'capitalize' },
        `${sanitizeRideDate(data.travel.date)} - ${data.travel.departTime}`,
      );
    },
  }),
  columnHelper.accessor('product', {
    header: () => h('div', { class: 'text-left' }, 'Produto'),
    cell: ({ row }) => {
      const { product }: any = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(ProductTag, {
          label: product.name,
          type: product.name,
        }),
      );
    },
  }),
  columnHelper.accessor('billing', {
    header: () => h('div', { class: 'text-left' }, 'Valor'),
    cell: ({ row }) => {
      const data = row.original;
      return h('span', { class: 'text-xs' }, currencyFormat(data.billing.ammount));
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
      const data = row.original;
      return h(RideStatusFlag, {
        rideStatus: data.status,
      });
    },
  }),
];
