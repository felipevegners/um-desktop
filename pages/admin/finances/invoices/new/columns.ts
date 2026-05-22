import Checkbox from '@/components/ui/checkbox/Checkbox.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import ProductTag from '~/components/shared/ProductTag.vue';
import { currencyFormat, sanitizeAmount } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const getRideLineTotal = (ride: any) => {
  const extraChargesTotal = Array.isArray(ride?.extraCharges)
    ? ride.extraCharges.reduce((acc: number, charge: any) => {
        return acc + sanitizeAmount(charge?.amount);
      }, 0)
    : 0;

  const billingWithExtras =
    ride?.billing?.ammountWithExtras ?? ride?.billing?.amountWithExtras;
  const base =
    sanitizeAmount(billingWithExtras) ||
    sanitizeAmount(ride?.rideFinalPrice) ||
    sanitizeAmount(ride?.billing?.ammount);

  const finalTotal =
    sanitizeAmount(billingWithExtras) > 0 ? base : Math.max(base + extraChargesTotal, 0);

  return finalTotal;
};

const getSelectedCostCenterTotal = (ride: any) => {
  const allocation = ride?.__allocation;
  if (allocation) {
    return sanitizeAmount(allocation?.allocatedTotal);
  }

  return getRideLineTotal(ride);
};

export const columns: any = [
  {
    id: 'select',
    meta: { width: 30 },
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
    meta: { label: 'Código' },
    header: () => h('div', { class: 'text-xs text-left' }, 'Código'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize text-xs font-semibold' }, row.getValue('code')),
  }),
  columnHelper.display({
    id: 'user',
    meta: { label: 'Usuário' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Usuário'),
    cell: ({ row }) => {
      const ride = row.original;
      return h('div', { class: 'capitalize text-xs' }, ride?.user?.name || '-');
    },
  }),
  columnHelper.display({
    id: 'branch',
    meta: { label: 'Filial' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Filial'),
    cell: ({ row }) => {
      const ride = row.original;
      return h(
        'div',
        { class: 'capitalize text-xs text-wrap' },
        ride?.billing?.paymentData?.branchName || '-all-',
      );
    },
  }),
  columnHelper.display({
    id: 'costCenter',
    meta: { label: 'Centro de Custo' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Centro de Custo'),
    cell: ({ row }) => {
      const ride = row.original;
      const areaCode = ride?.billing?.paymentData?.areaCode;
      const areaName = ride?.billing?.paymentData?.areaName;
      const splitedPayment = ride?.billing?.paymentData?.splitedPayment;

      if (Array.isArray(splitedPayment) && splitedPayment.length > 0) {
        const splitCostCenters = splitedPayment
          .map((item: any) => item?.areaCode || item?.area)
          .filter((value: any) => typeof value === 'string' && value.trim().length > 0)
          .join(' / ');

        return h(
          'div',
          { class: 'text-xs text-wrap text-center' },
          splitCostCenters || '-',
        );
      }

      return h(
        'div',
        { class: 'text-xs text-wrap text-center' },
        areaCode || (areaName && `${areaCode}`) || '-',
      );
    },
  }),
  columnHelper.display({
    id: 'product',
    meta: { label: 'Produto' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Produto'),
    cell: ({ row }) => {
      const ride = row.original;
      return h(
        'div',
        { class: 'text-xs text-wrap' },
        h(ProductTag, {
          label: ride?.product?.name as string,
          type: ride?.product?.name as string,
        }),
      );
    },
  }),
  columnHelper.display({
    id: 'requestedBy',
    meta: { label: 'Solicitante' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Solicitante'),
    cell: ({ row }) => {
      const ride = row.original;
      const requesterName =
        ride?.reason?.requestedByName || ride?.reason?.requestedBy || ride?.user?.name;
      return h('div', { class: 'text-xs text-wrap' }, requesterName || '-');
    },
  }),
  columnHelper.display({
    id: 'finishedAt',
    meta: { label: 'Finalizado em' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Finalizado em'),
    cell: ({ row }) => {
      const ride = row.original;
      const finishedAt = ride?.progress?.finishedAt || ride?.updatedAt || ride?.createdAt;
      if (!finishedAt) return h('div', { class: 'text-xs' }, '-');
      return h(
        'div',
        { class: 'text-xs' },
        new Date(finishedAt).toLocaleDateString('pt-BR'),
      );
    },
  }),
  columnHelper.display({
    id: 'total',
    meta: { label: 'Valor Total' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Valor Total'),
    cell: ({ row }) => {
      const ride = row.original;
      return h(
        'div',
        { class: 'text-xs font-bold' },
        currencyFormat(getRideLineTotal(ride)),
      );
    },
  }),
  columnHelper.display({
    id: 'selectedCostCenterTotal',
    meta: { label: 'Valor CC Selecionado' },
    enableHiding: false,
    header: () => h('div', { class: 'text-xs text-left' }, 'Valor Rateio'),
    cell: ({ row }) => {
      const ride = row.original;
      return h(
        'div',
        { class: 'text-xs font-bold text-amber-600' },
        currencyFormat(getSelectedCostCenterTotal(ride)),
      );
    },
  }),
];
