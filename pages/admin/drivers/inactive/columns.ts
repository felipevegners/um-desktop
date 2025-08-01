import Button from '@/components/ui/button/Button.vue';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import { sanitizePhone } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('name', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('name')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('email')),
  }),
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Celular'),
    cell: ({ row }) => {
      const phone = row.getValue('phone');
      return h(
        'a',
        {
          href: WPP_API.replace('[[phone]]', sanitizePhone(phone as string)),
          target: '_blank',
          class: 'flex items-center gap-2',
        },
        [
          row.getValue('phone'),
          h('img', {
            class: 'h-4',
            src: 'https://cdn.simpleicons.org/whatsapp',
          }),
        ] as any,
      );
    },
  }),
  columnHelper.accessor('document', {
    header: () => h('div', { class: 'text-left' }, 'CPF'),
    cell: ({ row }) => {
      return h('div', { class: 'text-left font-medium' }, row.getValue('document'));
    },
  }),
  columnHelper.accessor('enabled', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('enabled');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-full text-white text-xs w-fit ${
            status === 'true' ? 'bg-green-600' : 'bg-red-600'
          }`,
        },
        status === 'true' ? 'Ativo' : 'Inativo',
      );
    },
  }),
];
