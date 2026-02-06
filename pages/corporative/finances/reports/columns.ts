import ExtraChargesTooltip from '@/components/shared/ExtraChargesTooltip.vue';
import ProductTag from '@/components/shared/ProductTag.vue';
import { Button } from '@/components/ui/button';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import {
  convertSecondsToTime,
  currencyFormat,
  sanitizeAmount,
  sanitizePhone,
  sanitizeRideDate,
} from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const editRide = (rideId: string) => {
  navigateTo({
    name: 'corporative-rides-edit-id',
    params: { id: rideId },
  });
};

export const columns: any = [
  columnHelper.accessor('code', {
    header: () => h('div', { class: 'text-left' }, 'Código'),
    cell: ({ row }) => h('div', { class: 'capitalize text-xs' }, row.getValue('code')),
  }),
  columnHelper.accessor('product', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Produto'),
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
    cell: ({ row }: any) => {
      const data = row.original;
      return h('div', { class: 'text-xs' }, [
        data.user.name,
        h(
          'a',
          {
            href: WPP_API.replace('[[phone]]', sanitizePhone(data.user.phone as string)),
            target: '_blank',
            class: 'flex items-center gap-2 text-xs',
          },
          [
            h('span', { class: 'text-muted-foreground' }, data.user.phone),
            h(MessageCircleMore, { class: 'text-green-500 text-xs', size: 18 }),
          ] as any,
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: 'DateTime',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      const travelDateTime = `${sanitizeRideDate(data.travel.date as string)} - ${data.travel.departTime}`;
      return h('div', { class: 'capitalize text-xs text-wrap' }, [`${travelDateTime}`]);
    },
  }),
  columnHelper.display({
    id: 'routeDateTime',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Rota'),
    cell: ({ row }) => {
      const data = row.original;
      const normalizeOrigin = data.travel.originAddress.split('-').slice(0, 1).pop();
      const normalizeDestination = data.travel.destinationAddress
        .split('-')
        .slice(0, 1)
        .pop();
      return h('div', { class: 'capitalize text-xs text-wrap' }, [
        `${normalizeOrigin} → ${normalizeDestination}`,
        data?.travel.stops?.length > 0
          ? h(
              'span',
              {
                class:
                  'block m-2 px-2 py-0.5 text-center bg-zinc-900 text-zinc-300 text-xs w-fit rounded-md',
              },
              `${data?.travel.stops?.length > 1 ? data?.travel.stops?.length + ' paradas' : data?.travel.stops?.length + ' parada'}`,
            )
          : '',
      ]);
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-center' }, 'Tempo em Paradas'),
    cell: ({ row }) => {
      const data = row.original;
      const { totalTimeStopped } = data.travel;
      return h(
        'span',
        { class: 'text-xs text-center' },
        totalTimeStopped !== undefined ? convertSecondsToTime(totalTimeStopped) : '-',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Km Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs' },
        data.travel.completedData ? data.travel.completedData.rideExtraKms + ' KMs' : '0',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Valor Km Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs font-bold text-amber-600' },
        data.travel.completedData
          ? currencyFormat(data.travel.completedData.rideExtraKmPrice)
          : '0',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Minuto Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs' },
        data.travel.completedData
          ? Math.ceil(data.travel.completedData.rideExtraHours * 60) + ' Min'
          : '0',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Valor Min. Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs font-bold text-amber-600' },
        data.travel.completedData
          ? currencyFormat(data.travel.completedData.rideExtraHourPrice)
          : '0',
      );
    },
  }),
  columnHelper.accessor('extraCharges', {
    header: () => h('div', { class: 'text-center' }, 'Adicionais'),
    cell: ({ row }) => {
      const data = row.original;
      const extraChargesTotal =
        data?.extraCharges?.length > 0
          ? data.extraCharges.reduce((acc: number, curr: any) => {
              return acc + sanitizeAmount(curr?.amount);
            }, 0)
          : 0;
      return h('div', { class: 'flex items-center gap-1 text-xs font-bold' }, [
        currencyFormat(extraChargesTotal),
        extraChargesTotal > 0
          ? h(ExtraChargesTooltip, { items: data.extraCharges })
          : null,
      ]);
    },
  }),
  columnHelper.accessor('billing', {
    header: () => h('div', { class: 'text-left' }, 'Valor Total'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'span',
        { class: 'text-xs font-bold' },
        currencyFormat(data.billing.ammount),
      );
    },
  }),

  // columnHelper.display({
  //   id: 'driver',
  //   enableHiding: false,
  //   header: () => h('div', { class: 'text-left' }, 'Motorista'),
  //   cell: ({ row }) => {
  //     const { id, driver } = row.original;
  //     return h(
  //       'div',
  //       { class: 'relative text-xs' },
  //       driver.name ? driver.name.split(' ')[0] : 'Nenhum',
  //     );
  //   },
  // }),
  // columnHelper.display({
  //   id: 'actions',
  //   enableHiding: false,
  //   header: () => h('div', { class: 'text-left' }, 'Ações'),
  //   cell: ({ row }) => {
  //     const { id } = row.original;
  //     return h(
  //       'div',
  //       { class: 'relative text-left' },
  //       h(TableActions, {
  //         dataId: id,
  //         options: ['edit'],
  //         loading: false,
  //         onView: () => {},
  //         onEdit: editRide,
  //         onDelete: () => {},
  //       }),
  //     );
  //   },
  // }),
];
