import TableActions from '@/components/shared/TableActions.vue';

interface BuildRideActionsInput {
  columnHelper: any;
  capabilities?: {
    canEditRide?: boolean;
  } | null;
  onEdit?: (rideId: string) => void;
  onView?: (rideId: string) => void;
}

export function buildRideActions(input: BuildRideActionsInput) {
  return input.columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Ações'),
    cell: ({ row }: any) => {
      const code = row.original?.code as string | undefined;
      const dataRef =
        typeof code === 'string' && code.length > 0 ? code : row.original?.id;
      const options = input.capabilities?.canEditRide !== false ? ['edit'] : ['preview'];

      return h(
        'div',
        { class: 'relative text-left' },
        h(TableActions, {
          dataId: dataRef,
          options,
          loading: false,
          onView: input.onView || (() => {}),
          onEdit: input.onEdit || (() => {}),
          onDelete: () => {},
        }),
      );
    },
  });
}
