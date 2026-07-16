import CommissionStatusFlag from '@/components/shared/CommissionStatusFlag.vue';
import Input from '@/components/ui/input/Input.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { ExternalLink } from 'lucide-vue-next';
import { commissionType, discountType } from '~/config/commissions';
import { currencyFormat, dateFormat } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('type', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Tipo'),
    cell: ({ row }) => {
      const data = row.original;
      if (data.isEditing) {
        return h(Input, {
          defaultValue: row.original.type,
          onInput: (e: any) => {
            row.original.type = e.target.value;
          },
          type: 'text',
        });
      }
      return h(
        'div',
        { class: 'text-xs text-left' },
        commissionType[row.getValue('type') as string],
      );
    },
  }),
  columnHelper.accessor('driver', {
    meta: {
      width: 200,
    },
    header: () => h('div', { class: 'text-xs text-left' }, 'Motorista'),
    cell: ({ row }: any) => {
      return h('div', { class: 'text-xs text-left' }, row.getValue('driver')?.name);
    },
  }),
  columnHelper.accessor('ride', {
    meta: {
      width: 150,
    },
    header: () => h('div', { class: 'text-xs text-left' }, 'Atendimento'),
    cell: ({ row }: any) => {
      const ride = row.getValue('ride');
      const rideCode = ride?.code || '-';
      const rideIdentifier = ride?.code || ride?.id;

      if (!rideIdentifier) {
        return h('div', { class: 'text-xs text-left' }, rideCode);
      }

      return h(
        'a',
        {
          class:
            'text-xs text-left inline-flex items-center justify-center gap-1 hover:underline',
          href: `/rides/form/edit/${rideIdentifier}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        [rideCode, h(ExternalLink, { size: 15 })],
      );
    },
  }),
  columnHelper.accessor('ammount', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Valor'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-xs text-left' },
        currencyFormat(row.getValue('ammount')),
      );
    },
  }),
  columnHelper.accessor('discounts', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Descontos'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-xs text-left text-amber-700' },
        currencyFormat(row.getValue('discounts')),
      );
    },
  }),
  columnHelper.accessor('discountType', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Tipo Desconto'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-xs text-left' },
        data.discountType !== '-' ? discountType[data.discountType] : '-',
      );
    },
  }),
  columnHelper.accessor('ammount', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Valor Total'),
    cell: ({ row }) => {
      const data = row.original;
      const calculated = parseFloat(data.ammount) - parseFloat(data.discounts);
      return h(
        'div',
        { class: 'text-xs text-left font-bold' },
        currencyFormat(calculated.toString()),
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Data do Atendimento'),
    cell: ({ row }) => {
      const data = row.original;
      return h('div', { class: 'text-xs text-left' }, dateFormat(data.ride.date));
    },
  }),
  columnHelper.accessor('availableAt', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Prazo'),
    cell: ({ row }) => {
      return h('div', { class: 'text-xs text-left' }, row.getValue('availableAt'));
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-xs text-left' }, 'Status'),
    cell: ({ row }) => {
      return h(CommissionStatusFlag, { status: row.getValue('status') as string });
    },
  }),
];
