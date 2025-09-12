import Input from '@/components/ui/input/Input.vue';
import Switch from '@/components/ui/switch/Switch.vue';
import { createColumnHelper } from '@tanstack/vue-table';
import { dateFormat } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor('name', {
    header: () => h('div', { class: 'text-left' }, 'Nome'),
    cell: ({ row }) => {
      const data = row.original;
      if (data.isEditing) {
        return h(Input, {
          defaultValue: row.original.name,
          onInput: (e: any) => {
            row.original.name = e.target.value;
          },
          type: 'text',
        });
      }
      return h('div', { class: 'text-left font-medium' }, row.getValue('name'));
    },
  }),
  columnHelper.accessor('value', {
    header: () => h('div', { class: 'text-left' }, 'Valor Atual'),
    cell: ({ row }) => {
      const data = row.original;
      if (data.isEditing) {
        return h(Input, {
          defaultValue: row.original.value,
          onInput: (e: any) => {
            row.original.value = e.target.value;
          },
          type: 'text',
          maxlength: 2,
          class: 'max-w-[80px]',
        });
      }
      return h('div', { class: 'text-left font-medium' }, row.getValue('value') + '%');
    },
  }),
  columnHelper.accessor('active', {
    header: () => h('div', { class: 'text-left' }, 'Ativo'),
    cell: ({ row }) => {
      const data = row.original;
      if (data.isEditing) {
        return h(Switch, {
          checked: row.original.active,
          modelValue: row.original.active,
          'onUpdate:checked': (e) => {
            row.original.active = e;
          },
          class: 'data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500',
        });
      }
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.original.active ? 'Sim' : 'Não',
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: () => h('div', { class: 'text-left' }, 'Criado em'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        dateFormat(row.getValue('createdAt')),
      );
    },
  }),
  columnHelper.accessor('updatedAt', {
    header: () => h('div', { class: 'text-left' }, 'Atualizado em'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        dateFormat(row.getValue('updatedAt')),
      );
    },
  }),
];
