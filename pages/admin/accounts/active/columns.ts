import { Button } from '@/components/ui/button';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import { dateFormat } from '~/lib/utils';

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
    header: () => h('div', { class: 'text-left' }, 'Nível de Permissão'),
    cell: ({ row }) => {
      //@ts-ignore
      return h('div', { class: 'text-left font-medium' }, Roles[row.getValue('role')]);
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
          class: `px-2 flex items-center justify-center h-6 rounded-full text-white text-xs max-w-[80px] ${
            status === 'validated' ? 'bg-green-600' : 'bg-yellow-500'
          }`,
        },
        status === 'validated' ? 'Validado' : 'Pendente',
      );
    },
  }),
];
