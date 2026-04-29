import { Button } from '@/components/ui/button';
import { WPP_API } from '@/config/paths';
import { createColumnHelper } from '@tanstack/vue-table';
import { ArrowUpDown } from 'lucide-vue-next';
import RideStatusFlag from '~/components/shared/RideStatusFlag.vue';
import { sanitizePhone, sanitizeRideDate } from '~/lib/utils';

const columnHelper = createColumnHelper<any>();

export const columns: any = [
  columnHelper.accessor('code', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'pl-0',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Código', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }: any) =>
      h('div', { class: 'capitalize font-bold' }, row.getValue('code')),
  }),
  columnHelper.display({
    id: 'user',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Passageiro'),
    cell: ({ row }) => {
      const data = row.original;
      return h('div', { class: 'capitalize' }, data.user.name);
    },
  }),
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Celular'),
    cell: ({ row }) => {
      const data = row.original;
      return h(
        'a',
        {
          href: WPP_API.replace(
            '[[phone]]',
            sanitizePhone(data.user.phone as string) +
              `&text=Olá, meu nome é ${data.driver.name}. Serei o seu motorista no atendimento ${data.code}...`,
          ),
          target: '_blank',
          class: 'flex items-center gap-2',
        },
        [
          data.user.phone,
          h('img', {
            class: 'h-4',
            src: 'https://cdn.simpleicons.org/whatsapp',
          }),
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
      return h('div', { class: 'capitalize' }, [
        normalize,
        data?.travel.stops?.length > 0
          ? h(
              'span',
              {
                class:
                  'ml-1 px-2 py-0.5 text-center bg-zinc-900 text-zinc-300 text-xs w-fit rounded-md',
              },
              `${data?.travel.stops?.length > 1 ? data?.travel.stops?.length + ' paradas' : data?.travel.stops?.length + ' parada'}`,
            )
          : '',
      ] as any);
    },
  }),
  columnHelper.display({
    id: 'destinationAddress',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Destino'),
    cell: ({ row }) => {
      const data = row.original;
      const normalize = data.travel.destinationAddress.split('-').slice(0, 1).pop();
      return h('div', { class: 'capitalize' }, normalize);
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
        { class: 'capitalize' },
        `${sanitizeRideDate(data.travel.date as string)} - ${data.travel.departTime} HS`,
      );
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(RideStatusFlag, {
        rideStatus: status,
      });
    },
  }),
];
