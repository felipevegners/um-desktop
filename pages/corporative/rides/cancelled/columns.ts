import ProductTag from '@/components/shared/ProductTag.vue';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { MessageCircleMore } from 'lucide-vue-next';
import ExtraChargesTooltip from '~/components/shared/ExtraChargesTooltip.vue';
import {
  convertSecondsToTime,
  currencyFormat,
  sanitizeAmount,
  sanitizePhone,
  sanitizeRideDate,
} from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns: any = [
  columnHelper.accessor('code', {
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Código'),
    cell: ({ row }) =>
      //@ts-ignore
      h('div', { class: 'capitalize text-xs' }, row.getValue('code').replace('UM-', '')),
  }),
  columnHelper.accessor('product', {
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Produto'),
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
  columnHelper.accessor((row) => row.user?.name ?? '', {
    id: 'user',
    meta: { label: 'Usuário', width: '200px' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Usuário'),
    cell: ({ row }: any) => {
      const data = row.original;
      if (data.user.isVisitor) {
        return h('div', { class: 'text-xs' }, [
          data.user.visitorData.name,
          h(
            'span',
            {
              class:
                'block my-1 w-fit px-1.5 py-1 bg-zinc-950 rounded-md text-white text-xxs uppercase',
            },
            'visitante',
          ),
          h(
            'a',
            {
              href: WPP_API.replace(
                '[[phone]]',
                sanitizePhone(data.user.visitorData.phone as string),
              ),
              target: '_blank',
              class: 'flex items-center gap-2 text-xs',
            },
            [
              h('span', { class: 'text-muted-foreground' }, data.user.visitorData.phone),
              h(MessageCircleMore, { class: 'text-green-500 text-xs', size: 18 }),
            ] as any,
          ),
        ]);
      } else {
        return h('div', { class: 'text-xs' }, [
          data.user.name,
          h(
            'a',
            {
              href: WPP_API.replace(
                '[[phone]]',
                sanitizePhone(data.user.phone as string),
              ),
              target: '_blank',
              class: 'flex items-center gap-2 text-xs',
            },
            [
              h('span', { class: 'text-muted-foreground' }, data.user.phone),
              h(MessageCircleMore, { class: 'text-green-500 text-xs', size: 18 }),
            ] as any,
          ),
        ]);
      }
    },
  }),

  columnHelper.accessor('branch', {
    meta: {
      label: 'Filial',
      width: '120px',
    },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Filial'),
    cell: ({ row }: any) => {
      const { billing }: any = row.original;
      const name = billing.paymentData.branchName;
      return h('div', { class: 'capitalize text-xs' }, name ? name : '-');
    },
  }),
  columnHelper.accessor('area', {
    meta: {
      label: 'CC',
      width: '120px',
    },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'CC'),
    cell: ({ row }: any) => {
      const { billing }: any = row.original;
      let name = billing.paymentData.area;
      if (name === 'splited') {
        const areas = billing.paymentData.splitedPayment.map((item: any) => {
          return item.area;
        });
        return h('div', { class: 'capitalize text-xs' }, `${areas.join(' / ')}`);
      }
      return h('div', { class: 'capitalize text-xs' }, name ? name : '-');
    },
  }),
  columnHelper.display({
    id: 'DateTime',
    enableHiding: false,
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      const travelDateTime = `${sanitizeRideDate(data.travel.date as string)} - ${data.travel.departTime}`;
      return h('div', { class: 'capitalize text-xs text-wrap' }, [`${travelDateTime}`]);
    },
  }),

  columnHelper.display({
    id: 'routeDateTime',
    enableHiding: false,
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Rota'),
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
    header: () =>
      h('div', { class: 'text-xs leading-none text-center' }, 'Tempo em Paradas'),
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
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Km Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs' },
        data.travel.completedData.rideExtraKms !== 0
          ? data.travel.completedData.rideExtraKms.toLocaleString('pt-BR', {
              maximumFractionDigits: 2,
            })
          : '-',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Valor Km Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs font-bold text-amber-600' },
        data.travel.completedData.rideExtraKmPrice !== ''
          ? currencyFormat(data.travel.completedData.rideExtraKmPrice)
          : '-',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Hora Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs' },
        data.travel.completedData.rideExtraHours !== 0
          ? Math.ceil(data.travel.completedData.rideExtraHours)
          : '-',
      );
    },
  }),
  columnHelper.accessor('travel', {
    header: () =>
      h('div', { class: 'text-xs leading-none text-left' }, 'Valor Hora Extra'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs font-bold text-amber-600' },
        data.travel.completedData.rideExtraHourPrice !== ''
          ? currencyFormat(data.travel.completedData.rideExtraHourPrice || '0')
          : '-',
      );
    },
  }),
  columnHelper.accessor('extraCharges', {
    header: () => h('div', { class: 'text-xs leading-none text-center' }, 'Adicionais'),
    cell: ({ row }) => {
      const data = row.original;
      const extraChargesTotal =
        data?.extraCharges?.length > 0
          ? data.extraCharges.reduce((acc: number, curr: any) => {
              return acc + sanitizeAmount(curr?.amount);
            }, 0)
          : 0;
      return h(
        'div',
        { class: 'flex items-center gap-1 text-xs font-bold text-amber-600' },
        [
          currencyFormat(extraChargesTotal),
          extraChargesTotal > 0
            ? h(ExtraChargesTooltip, { items: data.extraCharges })
            : null,
        ],
      );
    },
  }),
  columnHelper.accessor('billing', {
    header: () => h('div', { class: 'text-xs leading-none text-center' }, 'Valor Total'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'span',
        { class: 'text-xs font-bold' },
        currencyFormat(data.billing.ammount),
      );
    },
  }),
];
