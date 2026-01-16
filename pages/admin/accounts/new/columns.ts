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
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        {
          class: data.nome === '' ? 'px-2 text-red-500 bg-red-100' : 'lowercase',
        },
        data.nome === '' ? '* campo vazio *' : data.nome,
      );
    },
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        {
          class: data.email === '' ? 'px-2 text-red-500 bg-red-100' : 'lowercase',
        },
        data.email === '' ? '* campo vazio *' : data.email,
      );
    },
  }),
  columnHelper.accessor('telefone', {
    header: () => h('div', { class: 'text-left' }, 'Telefone'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'div',
        {
          class: data.telefone === '' ? 'px-2 text-red-500 bg-red-100' : 'lowercase',
        },
        data.telefone === '' ? '* campo vazio *' : data.telefone,
      );
    },
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
