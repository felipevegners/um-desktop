import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown, MessageCircleMore } from 'lucide-vue-next';
import { WPP_API } from '~/config/paths';
import { dateFormat, sanitizePhone } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const Roles = {
  admin: 'Backoffice',
  'master-manager': 'Gestor Master',
  'branch-manager': 'Gestor Filial',
  'platform-admin': 'Administrador de Filial',
  'platform-corp-user': 'Usuário Corporativo',
  'platform-user': 'Usuário UM',
};

export const columns = [
  columnHelper.accessor('username', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'p-0',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome de Usuário', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('username')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('email')),
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
  columnHelper.accessor('contract', {
    header: () => h('div', { class: 'text-left' }, 'Empresa'),
    cell: ({ row }) => {
      const data: any = row.original;
      return h(
        'div',
        { class: 'capitilize' },
        data.contract?.name ? data.contract.name : '-',
      );
    },
  }),
  columnHelper.accessor('role', {
    header: () => h('div', { class: 'text-center' }, 'Nível de Permissão'),
    cell: ({ row }) => {
      //@ts-ignore
      return h('div', { class: 'text-center font-medium' }, Roles[row.getValue('role')]);
    },
  }),
  columnHelper.accessor('createdAt', {
    header: () => h('div', { class: 'text-left' }, 'Data Cadastro'),
    cell: ({ row }) => {
      //@ts-ignore
      return h(
        'div',
        { class: 'text-left font-medium' },
        dateFormat(row.getValue('createdAt')),
      );
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-center' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `mx-auto px-2 flex items-center justify-center h-6 rounded-full text-white text-xs w-fit ${
            status === 'validated' ? 'bg-green-600' : 'bg-amber-500'
          }`,
        },
        status === 'validated' ? 'Validado' : 'Pendente',
      );
    },
  }),
  columnHelper.accessor('emailConfirmed', {
    header: () => h('div', { class: 'text-left' }, 'E-mail Confirmado'),
    cell: ({ row }) => {
      const status = row.getValue('emailConfirmed');
      return h(
        'div',
        {
          class: `mx-auto px-2 flex items-center justify-center h-6 rounded-full text-white text-xs w-fit ${
            status === true ? 'bg-green-600' : 'bg-red-500'
          }`,
        },
        status === true ? 'Sim' : 'Não',
      );
    },
  }),
];
