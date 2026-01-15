import { createColumnHelper } from '@tanstack/vue-table';

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
  columnHelper.accessor('nome', {
    header: () => h('div', { class: 'text-left' }, 'Nome'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('nome')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('email')),
  }),
  columnHelper.accessor('telefone', {
    header: () => h('div', { class: 'text-left' }, 'Telefone'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('telefone')),
  }),
  columnHelper.accessor('cargo', {
    header: () => h('div', { class: 'text-left' }, 'Cargo'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('cargo')),
  }),
  columnHelper.accessor('departamento', {
    header: () => h('div', { class: 'text-left' }, 'Departamento'),
    cell: ({ row }) => h('div', { class: 'lowecase' }, row.getValue('departamento')),
  }),
];
