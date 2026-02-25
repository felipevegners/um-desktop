import { createColumnHelper } from '@tanstack/vue-table';
import { MessageCircleMore } from 'lucide-vue-next';
import { WPP_API } from '~/config/paths';
import { dateFormat, sanitizePhone } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

const Roles = {
  admin: 'Backoffice',
  'master-manager': 'Gestor Master',
  'branch-manager': 'Gestor Filial',
  'platform-admin': 'Admin. Filial',
  'platform-corp-user': 'Usuário Corporativo',
  'platform-user': 'Usuário UM',
  'platform-driver': 'Morotista Parceiro',
};

export const columns = [
  columnHelper.accessor((row) => row.username ?? '', {
    id: 'user',
    meta: { label: 'Usuário' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Usuário'),
    cell: ({ row }: any) => {
      const data = row.original;
      return h('div', { class: 'text-xs' }, [
        data.username,
        h(
          'a',
          {
            href: WPP_API.replace('[[phone]]', sanitizePhone(data.phone as string)),
            target: '_blank',
            class: 'flex items-center gap-2 text-xs',
          },
          [
            h('span', { class: 'text-muted-foreground' }, data.phone),
            h(MessageCircleMore, { class: 'text-green-500 text-xs', size: 18 }),
          ] as any,
        ),
      ]);
    },
  }),
  columnHelper.accessor('email', {
    meta: { label: 'E-mail' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowercase text-xs' }, row.getValue('email')),
  }),
  columnHelper.accessor('contract', {
    meta: { label: 'Empresa' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Empresa'),
    cell: ({ row }) => {
      const data: any = row.original;
      return h(
        'div',
        { class: 'capitalize text-xs' },
        data.contract?.name ? data.contract.name : '-',
      );
    },
  }),
  columnHelper.accessor('branch', {
    meta: { label: 'Filial' },
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Filial'),
    cell: ({ row }) => {
      const data: any = row.original;
      return h(
        'div',
        { class: 'capitalize text-xs' },
        data.contract.branchName === 'all' ? 'Todas' : data.contract.branchName || '-',
      );
    },
  }),
  columnHelper.accessor('role', {
    meta: { label: 'Tipo de Usuário' },
    header: () =>
      h('div', { class: 'text-left text-xs leading-none' }, 'Tipo de Usuário'),
    cell: ({ row }) => {
      //@ts-ignore
      return h(
        'div',
        { class: 'text-left font-medium text-xs' },
        Roles[row.getValue('role') as keyof typeof Roles],
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    meta: { label: 'Data Cadastro' },
    header: () => h('div', { class: 'text-left text-xs leading-none' }, 'Data Cadastro'),
    cell: ({ row }) => {
      //@ts-ignore
      return h(
        'div',
        { class: 'text-left font-medium text-xs leading-none' },
        dateFormat(row.getValue('createdAt')),
      );
    },
  }),
  columnHelper.accessor('status', {
    meta: { label: 'Status' },
    header: () => h('div', { class: 'text-center text-xs leading-none' }, 'Status'),
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
    meta: { label: 'E-mail Confirmado' },
    header: () =>
      h('div', { class: 'text-left text-xs leading-none' }, 'E-mail Confirmado'),
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
