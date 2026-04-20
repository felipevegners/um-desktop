import ExtraChargesTooltip from '@/components/shared/ExtraChargesTooltip.vue';
import PaymentStatusFlag from '@/components/shared/PaymentStatusFlag.vue';
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

const resolveBranchLabel = (billing: any): string => {
  const paymentData = billing?.paymentData;
  const explicitName = paymentData?.branchName;
  if (typeof explicitName === 'string' && explicitName.trim().length > 0) {
    return explicitName;
  }

  const branchCode = paymentData?.branchCode;
  if (typeof branchCode === 'string' && branchCode.trim().length > 0) {
    return branchCode;
  }

  const branchId = paymentData?.branch;
  if (typeof branchId === 'string' && branchId.trim().length > 0 && branchId !== '-') {
    return branchId;
  }

  return '-';
};

const resolveAreaLabel = (billing: any): string => {
  const paymentData = billing?.paymentData;
  const area = paymentData?.area;

  if (area === 'splited') {
    const areas = Array.isArray(paymentData?.splitedPayment)
      ? paymentData.splitedPayment
          .map((item: any) => item?.area)
          .filter((value: any) => typeof value === 'string' && value.trim().length > 0)
      : [];

    return areas.length > 0 ? areas.join(' / ') : 'RATEIO';
  }

  if (typeof area === 'string' && area.trim().length > 0) {
    return area;
  }

  return '-';
};

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
    size: 90,
    meta: {
      label: 'Código',
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
  columnHelper.accessor('createdAt', {
    meta: { label: 'Aberto em', width: '100px' },
    header: () => h('div', { class: 'text-xs text-left' }, 'Aberto em'),
    cell: ({ row }) => {
      const data = row.original;
      const sanitizeDate = data?.createdAt
        ? new Date(data?.createdAt).toLocaleDateString('pt-BR')
        : '-';
      return h('div', { class: 'capitalize text-xs' }, sanitizeDate);
    },
  }),
  columnHelper.accessor('product', {
    size: 120,
    meta: { label: 'Produto' },
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
    size: 200,
    meta: { label: 'Usuário' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Usuário'),
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
  columnHelper.accessor('branch', {
    meta: {
      label: 'Filial',
      width: '120px',
    },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Filial'),
    cell: ({ row }: any) => {
      const { billing }: any = row.original;
      const name = resolveBranchLabel(billing);
      return h('div', { class: 'capitalize text-xs' }, name ? name : '-');
    },
  }),
  columnHelper.accessor('area', {
    meta: {
      label: 'CC',
      width: '80px',
    },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'CC'),
    cell: ({ row }: any) => {
      const { billing }: any = row.original;
      const name = resolveAreaLabel(billing);
      return h('div', { class: 'capitalize text-xs' }, name ? name : '-');
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
    meta: { label: 'Rota', width: '250px' },
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
                  'block my-1 px-2 py-0.5 text-center bg-zinc-900 text-zinc-300 text-xs w-fit rounded-md',
              },
              `${data?.travel.stops?.length > 1 ? data?.travel.stops?.length + ' paradas' : data?.travel.stops?.length + ' parada'}`,
            )
          : '',
      ]);
    },
  }),

  // columnHelper.accessor('tp', {
  //   meta: { label: 'TP' },
  //   header: () => h('div', { class: 'text-xs leading-none text-center' }, 'TP'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     const { totalTimeStopped } = data.travel;
  //     return h(
  //       'span',
  //       { class: 'text-xs text-center' },
  //       totalTimeStopped !== undefined ? convertSecondsToTime(totalTimeStopped) : '-',
  //     );
  //   },
  // }),
  // columnHelper.accessor('kme', {
  //   meta: { label: 'KME' },
  //   header: () => h('div', { class: 'text-xs leading-none text-left' }, 'KME'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h(
  //       'div',
  //       { class: 'text-xs' },
  //       data.travel.completedData?.rideExtraKms !== 0
  //         ? data.travel.completedData?.rideExtraKms.toLocaleString('pt-BR', {
  //             maximumFractionDigits: 2,
  //           })
  //         : '-',
  //     );
  //   },
  // }),
  // columnHelper.accessor('kme-price', {
  //   meta: { label: 'Valor KME' },
  //   header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Valor KME'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h(
  //       'div',
  //       { class: 'text-xs font-bold text-amber-600' },
  //       data?.travel.completedData && data?.travel.completedData?.rideExtraKmPrice !== ''
  //         ? currencyFormat(data.travel.completedData?.rideExtraKmPrice)
  //         : '-',
  //     );
  //   },
  // }),
  // columnHelper.accessor('he', {
  //   meta: { label: 'HE' },
  //   header: () => h('div', { class: 'text-xs leading-none text-left' }, 'HE'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h(
  //       'div',
  //       { class: 'text-xs' },
  //       data?.travel.completedData && data?.travel.completedData?.rideExtraHours !== 0
  //         ? Math.ceil(data?.travel.completedData?.rideExtraHours || 0)
  //         : '-',
  //     );
  //   },
  // }),
  // columnHelper.accessor('he-price', {
  //   meta: { label: 'Valor HE' },
  //   header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Valor HE'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h(
  //       'div',
  //       { class: 'text-xs font-bold text-amber-600' },
  //       data?.travel.completedData &&
  //         data?.travel.completedData?.rideExtraHourPrice !== ''
  //         ? currencyFormat(data?.travel.completedData?.rideExtraHourPrice || '0')
  //         : '-',
  //     );
  //   },
  // }),
  columnHelper.accessor('extraCharges', {
    meta: { label: 'Adicionais', width: '120px' },
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
        currencyFormat(data?.billing?.ammount || '0'),
      );
    },
  }),
  columnHelper.accessor('billing', {
    meta: { label: 'Status PGTO' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Pagamento'),
    cell: ({ row }) => {
      const data = row.original;
      return h(PaymentStatusFlag, {
        paymentStatus: data?.billing?.status,
        paymentUrl: data?.billing?.paymentUrl || '',
      });
    },
  }),

  columnHelper.accessor('status', {
    meta: { label: 'Status', width: '110px' },
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
