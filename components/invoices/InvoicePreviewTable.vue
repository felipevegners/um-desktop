<script setup lang="ts">
import { currencyFormat, formatDateTimePtBR, formatInvoiceUser } from '~/lib/utils';

type InvoicePreviewItem = {
  rideId?: string;
  code?: string;
  user?: string;
  driver?: string;
  branch?: string;
  costCenter?: string;
  product?: string;
  requester?: string;
  openedAt?: string | Date | null;
  finalizedAt?: string | Date | null;
  origin?: string;
  destination?: string;
  route?: string;
  tp?: string | number;
  kme?: string;
  kmePrice?: string;
  he?: string;
  hePrice?: string;
  extraCharges?: string;
  baseTotal?: string | number;
  allocatedTotal?: string | number;
  allocationPercentage?: string | number;
  total?: string | number;
  isVisitor?: boolean;
};

type InvoicePreviewSummary = {
  grossValue: string | number;
  allocatedValue: string | number;
  splitItemCount: number;
};

const props = defineProps<{
  items: InvoicePreviewItem[];
  summary: InvoicePreviewSummary;
}>();

const getRoutePart = (item: InvoicePreviewItem, part: 'origin' | 'destination') => {
  const [origin = '', ...destinationParts] = String(item.route || '').split(' -> ');
  return part === 'origin'
    ? item.origin || origin || '-'
    : item.destination || destinationParts.join(' -> ') || '-';
};
</script>

<template>
  <section>
    <div
      v-if="props.summary.splitItemCount > 0"
      class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
    >
      <p class="font-bold">Rateio identificado neste fechamento</p>
      <p class="mt-1">
        Alguns atendimentos têm valor bruto e valor rateado por centro de custo. O total
        do fechamento considera apenas o valor rateado.
      </p>
      <div class="mt-2 flex flex-wrap gap-4">
        <span><strong>Itens rateados:</strong> {{ props.summary.splitItemCount }}</span>
        <span
          ><strong>Valor bruto:</strong>
          {{ currencyFormat(props.summary.grossValue) }}</span
        >
        <span
          ><strong>Valor rateado:</strong>
          {{ currencyFormat(props.summary.allocatedValue) }}</span
        >
      </div>
    </div>

    <div class="overflow-auto rounded-md border border-zinc-200">
      <table class="preview-table min-w-[1764px] table-fixed text-[10px] leading-tight">
        <colgroup>
          <col style="width: 62px" />
          <col style="width: 130px" />
          <col style="width: 98px" />
          <col style="width: 54px" />
          <col style="width: 84px" />
          <col style="width: 92px" />
          <col style="width: 130px" />
          <col style="width: 130px" />
          <col style="width: 180px" />
          <col style="width: 180px" />
          <col style="width: 100px" />
          <col style="width: 36px" />
          <col style="width: 50px" />
          <col style="width: 70px" />
          <col style="width: 44px" />
          <col style="width: 70px" />
          <col style="width: 72px" />
          <col style="width: 90px" />
          <col style="width: 92px" />
        </colgroup>
        <thead class="bg-zinc-100">
          <tr>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Código
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Usuário
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Filial
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              CC
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Produto
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Solicitante
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Aberto em
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Finalizado
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Origem
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Destino
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Motorista
            </th>
            <th
              class="px-1.5 py-1.5 text-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              TP
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              KME
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Valor KME
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              HE
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Valor HE
            </th>
            <th
              class="px-1.5 py-1.5 text-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Adicionais
            </th>
            <th
              class="px-1.5 py-1.5 text-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Valor Total
            </th>
            <th
              class="px-1.5 py-1.5 text-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Valor Rateado
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.rideId" class="border-t border-zinc-200">
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.code }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ formatInvoiceUser(item.user, Boolean(item.isVisitor)) }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.branch }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.costCenter }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.product }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.requester }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ formatDateTimePtBR(item.openedAt) }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ formatDateTimePtBR(item.finalizedAt) }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ getRoutePart(item, 'origin') }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ getRoutePart(item, 'destination') }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.driver || '-' }}
            </td>
            <td
              class="px-1.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ item.tp }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.kme }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.kmePrice }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.he }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.hePrice }}
            </td>
            <td
              class="px-1.5 py-1 text-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ item.extraCharges }}
            </td>
            <td
              class="px-1.5 py-1 text-center font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ currencyFormat(item.baseTotal ?? (item.total as string)) }}
            </td>
            <td
              class="px-1.5 py-1 text-center font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ currencyFormat(item.allocatedTotal ?? (item.total as string)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <div class="w-full max-w-sm rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <div class="flex items-center justify-between text-sm">
          <span><strong>Total de atendimentos</strong></span>
          <span>{{ props.items.length }}</span>
        </div>
        <div class="mt-2 flex items-center justify-between text-base font-bold">
          <span>Total geral</span>
          <span>{{ currencyFormat(props.summary.allocatedValue) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
