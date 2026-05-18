import TableActions from '@/components/shared/TableActions.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { Paperclip } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const invoiceStatusLabel: Record<string, string> = {
  open: 'Em aberto',
  paid: 'Faturada',
  canceled: 'Cancelada',
};

const invoiceStatusClass: Record<string, string> = {
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
    header: () => h('div', { class: 'text-left' }, 'Número'),
    cell: ({ row }) =>
      h('div', { class: 'text-xs font-semibold' }, row.getValue('number')),
  }),
  columnHelper.display({
    id: 'customer',
    meta: { label: 'Cliente' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Cliente'),
    cell: ({ row }) => {
      const customerName = row.original?.customer?.customerName || '-';
      return h('div', { class: 'text-xs text-wrap' }, customerName);
    },
  }),
  columnHelper.display({
    id: 'document',
    meta: { label: 'CNPJ' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'CNPJ'),
    cell: ({ row }) => {
      const document = row.original?.customer?.document || '-';
      return h('div', { class: 'text-xs text-wrap' }, document);
    },
  }),
  columnHelper.accessor('period', {
    meta: { label: 'Período' },
    header: () => h('div', { class: 'text-left' }, 'Período'),
    cell: ({ row }) => h('div', { class: 'text-xs' }, row.getValue('period')),
  }),
  columnHelper.display({
    id: 'itemsCount',
    meta: { label: 'Itens', width: 50 },
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Itens'),
    cell: ({ row }) => {
      const items = row.original?.items;
      const count = Array.isArray(items) ? items.length : 0;
      return h('div', { class: 'text-xs' }, count);
    },
  }),
  columnHelper.display({
    id: 'createdAt',
    meta: { label: 'Emitida em' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Emitida em'),
    cell: ({ row }) => {
      const value = row.original?.createdAt;
      if (!value) return h('div', { class: 'text-xs' }, '-');
      return h('div', { class: 'text-xs' }, new Date(value).toLocaleDateString('pt-BR'));
    },
  }),
  columnHelper.display({
    id: 'dueDate',
    meta: { label: 'Vencimento' },
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Vencimento'),
    cell: ({ row }) => {
      const value = row.original?.dueDate;
      if (!value) return h('div', { class: 'text-xs' }, '-');
      return h('div', { class: 'text-xs' }, new Date(value).toLocaleDateString('pt-BR'));
    },
  }),
  columnHelper.accessor('value', {
    meta: { label: 'Valor' },
    header: () => h('div', { class: 'text-left' }, 'Valor'),
    cell: ({ row }) =>
      h('div', { class: 'text-xs font-bold' }, currencyFormat(row.getValue('value'))),
  }),
  columnHelper.accessor('status', {
    meta: { label: 'Status' },
    header: () => h('div', { class: 'text-left' }, 'Status'),
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
    header: () => h('div', { class: 'text-left' }, 'NF'),
    cell: ({ row }) => {
      const invoice = row.original;
      const hasNfUrl = Boolean(invoice?.customer?.invoiceTracking?.nfDocument?.url);
      const hasNf = invoice?.status === 'paid' && hasNfUrl;
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
    header: () => h('div', { class: 'text-left' }, 'Ações'),
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
