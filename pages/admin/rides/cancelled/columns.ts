import { Button } from '@/components/ui/button';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import { currencyFormat, sanitizePhone, sanitizeRideDate } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns: any = [
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
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Contato'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'a',
        {
          href: WPP_API.replace('[[phone]]', sanitizePhone(data.user.phone as string)),
          target: '_blank',
          class: 'flex items-center gap-2 text-xs',
        },
        [
          data.user.phone,
          h(MessageCircleMore, { class: 'text-green-500 text-xs', size: 18 }),
        ] as any,
      );
    },
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
      return h(
        'div',
        { class: 'capitalize text-xs' },
        `${normalizeOrigin} → ${normalizeDestination} | ${travelDateTime}`,
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
];
