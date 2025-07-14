import { Button } from '@/components/ui/button';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import { currencyFormat, sanitizePhone } from '~/lib/utils';

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
    id: 'originAddress',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Origem'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.travel.originAddress.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize text-xs' }, normalize);
    },
  }),
  columnHelper.display({
    id: 'destinationAddress',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Destino'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.travel.destinationAddress.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize text-xs' }, normalize);
    },
  }),
  columnHelper.display({
    id: 'travelDate',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Data e Hora'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        { class: 'capitalize text-xs' },
        `${data.travel.date} - ${data.travel.departTime}`,
      );
    },
  }),
  // columnHelper.accessor('product', {
  //   header: () => h('div', { class: 'text-left' }, 'Produto'),
  //   cell: ({ row }: any) =>
  //     h('div', { class: 'capitalize' }, row.getValue('product').name),
  // }),
  columnHelper.display({
    id: 'distance',
    enableHiding: true,
    header: () => h('div', { class: 'text-left' }, 'Distância'),
    cell: ({ row }) => {
      const data = row.original;
      return h('div', { class: 'capitalize text-xs' }, data.travel.distance);
    },
  }),
  // columnHelper.display({
  //   id: 'travelDuration',
  //   enableHiding: true,
  //   header: () => h('div', { class: 'text-left' }, 'Duração'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h('div', { class: 'capitalize' }, data.travel.duration);
  //   },
  // }),
  // columnHelper.accessor('price', {
  //   header: () => h('div', { class: 'text-left' }, 'Valor'),
  //   cell: ({ row }) =>
  //     h('div', { class: 'capitalize' }, currencyFormat(row.getValue('price'))),
  // }),
  // columnHelper.display({
  //   id: 'dispatcher',
  //   enableHiding: true,
  //   header: () => h('div', { class: 'text-left' }, 'Despachante'),
  //   cell: ({ row }) => {
  //     const data = row.original;
  //     return h('div', { class: 'capitalize' }, data.dispatcher.user);
  //   },
  // }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs w-fit 
          ${status === 'created' ? 'bg-blue-600' : 'bg-green-600'}`,
        },
        status === 'created' ? 'Agendado' : status === 'accepted' ? 'Aceito' : 'Unknow',
      );
    },
  }),
];
