import PaymentStatusFlag from '@/components/shared/PaymentStatusFlag.vue';
import { Button } from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import { currencyFormat, sanitizeRideDate } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns: any = [
  {
    id: 'select',
    header: ({ table }: any) => {
      return h(Checkbox, {
        checked:
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? 'indeterminate' : false),
        'onUpdate:checked': (value: any) => {
          table.toggleAllPageRowsSelected(!!value);
        },
        ariaLabel: 'Select all',
      });
    },
    cell: ({ row }: any) => {
      return h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: any) => {
          row.toggleSelected(!!value);
        },
        ariaLabel: 'Select row',
      });
    },
    enableSorting: false,
    enableHiding: false,
  },
  columnHelper.accessor('code', {
    header: () => h('div', { class: 'text-left' }, 'Código'),
    cell: ({ row }) => h('div', { class: 'capitalize text-xs' }, row.getValue('code')),
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
      h('div', { class: 'capitalize text-xs' }, row.getValue('user').name),
  }),
  columnHelper.display({
    id: 'routeDateTime',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Rota/Data/Hora'),
    cell: ({ row }) => {
      const data = row.original;
      const normalizeOrigin = data.travel.originAddress.split('-').slice(0, 1).pop();
      const normalizeDestination = data.travel.destinationAddress
        .split('-')
        .slice(0, 1)
        .pop();
      const travelDateTime = `${sanitizeRideDate(data.travel.date as string)} - ${data.travel.departTime}`;
      return h('div', { class: 'capitalize text-xs text-wrap' }, [
        `${normalizeOrigin} → ${normalizeDestination} | ${travelDateTime}`,
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
      ]);
    },
  }),
  columnHelper.accessor('billing', {
    header: () => h('div', { class: 'text-left' }, 'Valor Final'),
    cell: ({ row }) => {
      const data = row.original;
      return h('div', { class: 'font-bold' }, currencyFormat(data.billing.ammount));
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
];
