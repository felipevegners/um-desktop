import { buildRideActions } from './buildRideActions';

interface BuildRideColumnsInput {
  baseColumns: any[];
  columnHelper: any;
  capabilities?: {
    canEditRide?: boolean;
  } | null;
  includeDriverColumn?: boolean;
  onEdit?: (rideId: string) => void;
  onView?: (rideId: string) => void;
}

export function buildRideColumns(input: BuildRideColumnsInput) {
  const columns = [...input.baseColumns];

  if (input.includeDriverColumn) {
    columns.push(
      input.columnHelper.display({
        id: 'driver',
        meta: { label: 'Motorista' },
        header: () => h('div', { class: 'text-xs leading-none text-left' }, 'Motorista'),
        cell: ({ row }: any) => {
          const driverName = row.original?.driver?.name;
          return h(
            'div',
            { class: 'relative text-xs' },
            typeof driverName === 'string' && driverName.length > 0
              ? driverName.split(' ')[0]
              : 'Nenhum',
          );
        },
      }),
    );
  }

  columns.push(
    buildRideActions({
      columnHelper: input.columnHelper,
      capabilities: input.capabilities,
      onEdit: input.onEdit,
      onView: input.onView,
    }),
  );

  return columns;
}
