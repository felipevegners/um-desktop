import Input from '@/components/ui/input/Input.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { commissionStatus, commissionType, discountType } from '~/config/commissions';
import { currencyFormat, dateFormat } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('type', {
    header: () => h('div', { class: 'text-left' }, 'Tipo'),
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
        { class: 'text-left' },
        commissionType[row.getValue('type') as string],
      );
    },
  }),
  columnHelper.accessor('driver', {
    header: () => h('div', { class: 'text-left' }, 'Motorista'),
    cell: ({ row }: any) => {
      return h('div', { class: 'text-left' }, row.getValue('driver')?.name);
    },
  }),
  columnHelper.accessor('ride', {
    header: () => h('div', { class: 'text-left' }, 'Atendimento'),
    cell: ({ row }: any) => {
      return h('div', { class: 'text-left' }, row.getValue('ride')?.code);
    },
  }),
  columnHelper.accessor('ammount', {
    header: () => h('div', { class: 'text-left' }, 'Valor'),
    cell: ({ row }) => {
      return h('div', { class: 'text-left' }, currencyFormat(row.getValue('ammount')));
    },
  }),
  columnHelper.accessor('discounts', {
    header: () => h('div', { class: 'text-left' }, 'Descontos'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left text-amber-700' },
        currencyFormat(row.getValue('discounts')),
      );
    },
  }),
  columnHelper.accessor('discountType', {
    header: () => h('div', { class: 'text-left' }, 'Tipo Desconto'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'text-left' },
        data.discountType !== '-' ? discountType[data.discountType] : '-',
      );
    },
  }),
  columnHelper.accessor('ammount', {
    header: () => h('div', { class: 'text-left' }, 'Valor Total'),
    cell: ({ row }) => {
      const data = row.original;
      const calculated = parseFloat(data.ammount) - parseFloat(data.discounts);
      const total = Math.ceil(calculated);
      return h('div', { class: 'text-left font-bold' }, currencyFormat(total.toString()));
    },
  }),
  columnHelper.accessor('createdAt', {
    header: () => h('div', { class: 'text-left' }, 'Criado em'),
    cell: ({ row }) => {
      return h('div', { class: 'text-left' }, dateFormat(row.getValue('createdAt')));
    },
  }),
  columnHelper.accessor('availableAt', {
    header: () => h('div', { class: 'text-left' }, 'Prazo'),
    cell: ({ row }) => {
      return h('div', { class: 'text-left' }, row.getValue('availableAt'));
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left' },
        commissionStatus[row.getValue('status') as string],
      );
    },
  }),
];
