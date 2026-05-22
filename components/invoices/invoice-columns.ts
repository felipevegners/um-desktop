import TableActions from '@/components/shared/TableActions.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { Paperclip } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const invoiceStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
  in_adjustment: 'Ajuste',
  open: 'Pendente',
  paid: 'Aprovado',
  canceled: 'Recusado',
};

const invoiceStatusClass: Record<string, string> = {
  pending: 'bg-amber-600',
  approved: 'bg-green-600',
  rejected: 'bg-red-600',
  in_adjustment: 'bg-yellow-500',
  open: 'bg-amber-600',
  paid: 'bg-green-600',
  canceled: 'bg-red-600',
};

type InvoiceColumnsOptions = {
  onPreview?: (invoice: any) => void;
  onEdit?: (invoice: any) => void;
  onDownload?: (invoice: any) => void;
};

export const getColumns = (options: InvoiceColumnsOptions = {}): any => [
  columnHelper.accessor('number', {
    meta: { label: 'Número' },
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Número'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-[11px] font-semibold leading-tight whitespace-nowrap' },
        row.getValue('number'),
      ),
  }),
  columnHelper.display({
    id: 'customer',
    meta: { label: 'Cliente' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Cliente'),
    cell: ({ row }) => {
      const customerName = row.original?.customer?.customerName || '-';
      return h(
        'div',
        { class: 'max-w-[220px] truncate text-[11px] leading-tight' },
        customerName,
      );
    },
  }),
  columnHelper.display({
    id: 'costCenterCode',
    meta: { label: 'CC' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'CC'),
    cell: ({ row }) => {
      const areaCode =
        row.original?.customer?.areaCode ||
        row.original?.customer?.periodFilter?.areaCode ||
        '-';
      return h('div', { class: 'text-[11px] leading-tight whitespace-nowrap' }, areaCode);
    },
  }),
  columnHelper.display({
    id: 'document',
    meta: { label: 'CNPJ' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'CNPJ'),
    cell: ({ row }) => {
      const document = row.original?.customer?.document || '-';
      return h('div', { class: 'text-[11px] leading-tight whitespace-nowrap' }, document);
    },
  }),
  columnHelper.accessor('period', {
    meta: { label: 'Período' },
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Período'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-[11px] leading-tight whitespace-nowrap' },
        row.getValue('period'),
      ),
  }),
  columnHelper.display({
    id: 'itemsCount',
    meta: { label: 'Itens', width: 50 },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Itens'),
    cell: ({ row }) => {
      const items = row.original?.items;
      const count = Array.isArray(items) ? items.length : 0;
      return h('div', { class: 'text-[11px] leading-tight whitespace-nowrap' }, count);
    },
  }),
  columnHelper.display({
    id: 'createdAt',
    meta: { label: 'Emitido em' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Emitido em'),
    cell: ({ row }) => {
      const value = row.original?.createdAt;
      if (!value)
        return h('div', { class: 'text-[11px] leading-tight whitespace-nowrap' }, '-');
      return h(
        'div',
        { class: 'text-[11px] leading-tight whitespace-nowrap' },
        new Date(value).toLocaleDateString('pt-BR'),
      );
    },
  }),
  columnHelper.display({
    id: 'dueDate',
    meta: { label: 'Vencimento' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Vencimento'),
    cell: ({ row }) => {
      const value = row.original?.dueDate;
      if (!value)
        return h('div', { class: 'text-[11px] leading-tight whitespace-nowrap' }, '-');
      return h(
        'div',
        { class: 'text-[11px] leading-tight whitespace-nowrap' },
        new Date(value).toLocaleDateString('pt-BR'),
      );
    },
  }),
  columnHelper.accessor('value', {
    meta: { label: 'Valor' },
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Valor'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-[11px] font-bold leading-tight whitespace-nowrap' },
        currencyFormat(row.getValue('value')),
      ),
  }),
  columnHelper.accessor('status', {
    meta: { label: 'Status' },
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Status'),
    cell: ({ row }) => {
      const value = row.getValue('status') as string;
      return h(
        'span',
        {
          class: `inline-flex rounded-md px-2 py-1 text-xxs text-white uppercase ${invoiceStatusClass[value] || 'bg-zinc-700'}`,
        },
        invoiceStatusLabel[value] || value,
      );
    },
  }),
  columnHelper.display({
    id: 'nf',
    meta: { label: 'NF' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'NF'),
    cell: ({ row }) => {
      const invoice = row.original;
      const hasNfUrl = Boolean(invoice?.customer?.invoiceTracking?.nfDocument?.url);
      const hasNf =
        ['approved', 'paid'].includes(String(invoice?.status || '')) && hasNfUrl;
      const nfUrl = invoice?.customer?.invoiceTracking?.nfDocument?.url;

      if (!hasNf) {
        return h(
          'span',
          {
            class:
              'inline-flex rounded-md px-2 py-1 text-xxs text-white uppercase bg-zinc-500',
          },
          'NÃO',
        );
      }

      return h(
        'a',
        {
          href: nfUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          class:
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xxs text-white uppercase bg-green-600 transition-colors hover:bg-green-700',
          title: 'Abrir NF',
          'aria-label': 'Abrir NF',
        },
        ['SIM', h(Paperclip, { size: 14 })],
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    meta: { label: 'Ações' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left text-[11px]' }, 'Ações'),
    cell: ({ row }) => {
      const invoice = row.original;
      return h(TableActions, {
        options: ['preview', ...(options.onEdit ? ['edit'] : []), 'download'],
        dataId: invoice?.id,
        onView: () => options.onPreview?.(invoice),
        onEdit: () => options.onEdit?.(invoice),
        onDownload: () => options.onDownload?.(invoice),
      });
    },
  }),
];
