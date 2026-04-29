import ExtraChargesTooltip from '@/components/shared/ExtraChargesTooltip.vue';
import ProductTag from '@/components/shared/ProductTag.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { Button } from '@/components/ui/button';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import {
  currencyFormat,
  sanitizeAmount,
  sanitizePhone,
  sanitizeRideDate,
} from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const resolveRecurrenceTag = (ride: any): string | null => {
  const recurrence = ride?.travel?.recurrence || ride?.dispatcher?.recurrence;
  const index = recurrence?.index;
  const total = recurrence?.total;

  if (typeof index === 'number' && typeof total === 'number' && total > 1) {
    return `Rec. ${index}/${total}`;
  }

  return null;
};

export const columns: any = [
  columnHelper.accessor('code', {
    meta: {
      label: 'Código',
      width: '120px',
    },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Código'),
    cell: ({ row }: any) => {
      const ride = row.original;
      const { code }: any = ride;
      const sanitized = code.replace('UM-', '');
      const recurrenceTag = resolveRecurrenceTag(ride);

      return h('div', { class: 'text-xs' }, [
        h('div', { class: 'capitalize' }, sanitized),
        recurrenceTag
          ? h(
              'small',
              { class: 'inline-block mt-1 rounded bg-zinc-200 px-1.5 py-0.5 text-xxs' },
              recurrenceTag,
            )
          : null,
      ]);
    },
  }),
  columnHelper.accessor('product', {
    meta: { label: 'Produto', width: '90px' },
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
      const paymentData = billing?.paymentData || {};

      // Prefer explicit areaCode, fallback to area (legacy)
      const areaCode = paymentData?.areaCode ?? paymentData?.area;

      // Handle split payments (may be stored in `splitedPayment`)
      if (
        areaCode === 'splited' ||
        paymentData?.area === 'splited' ||
        paymentData?.areaCode === 'splited'
      ) {
        const areas = Array.isArray(paymentData?.splitedPayment)
          ? paymentData.splitedPayment
              .map((item: any) => item?.area ?? item?.areaCode)
              .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
          : [];

        return h(
          'div',
          { class: 'capitalize text-xs' },
          areas.length > 0 ? `${areas.join(' / ')}` : 'RATEIO',
        );
      }

      if (typeof areaCode === 'string' && areaCode.trim().length > 0) {
        return h('div', { class: 'capitalize text-xs' }, areaCode);
      }

      return h('div', { class: 'capitalize text-xs' }, '-');
    },
  }),
  columnHelper.accessor('time', {
    meta: { label: 'Data e Hora', width: '100px' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      const travelDateTime = `${sanitizeRideDate(data.travel.date as string)} ${data.travel.departTime}`;
      return h('div', { class: 'capitalize text-xs text-wrap' }, [`${travelDateTime}`]);
    },
  }),
  columnHelper.accessor('route', {
    meta: { label: 'Rota', width: '200px' },
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
                  'ml-1 px-2 py-0.5 text-center bg-zinc-900 text-zinc-300 text-xs w-fit rounded-md',
              },
              `${data?.travel.stops?.length > 1 ? data?.travel.stops?.length + ' paradas' : data?.travel.stops?.length + ' parada'}`,
            )
          : '',
      ]);
    },
  }),
  columnHelper.accessor('extraCharges', {
    meta: { label: 'Adicionais' },
    header: () => h('div', { class: 'text-xs leading-none text-center' }, 'Adicionais'),
    cell: ({ row }) => {
      const data = row.original;
      const extraChargesTotal =
        data?.extraCharges && data?.extraCharges.length > 0
          ? data.extraCharges?.reduce((acc: number, curr: any) => {
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
    meta: { label: 'Valor Total' },
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
  columnHelper.accessor('status', {
    meta: { label: 'Status' },
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'pl-0 text-xs leading-none text-left',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Status', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      return h(RideStatusFlag, {
        rideStatus: data.status,
      });
    },
  }),
];
