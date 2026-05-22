<script setup lang="ts">
import { currencyFormat, sanitizeAmount } from '~/lib/utils';

type InvoicePreviewItem = {
  rideId?: string;
  code?: string;
  user?: string;
  branch?: string;
  costCenter?: string;
  product?: string;
  requester?: string;
  finishedAt?: string;
  dateTime?: string;
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
};

const props = defineProps<{
  items: InvoicePreviewItem[];
}>();

const computedTotal = (items: InvoicePreviewItem[]) => {
  return items.reduce((acc: number, item: InvoicePreviewItem) => {
    return acc + sanitizeAmount(item.allocatedTotal ?? item.total);
  }, 0);
};

const computedGrossTotal = (items: InvoicePreviewItem[]) => {
  return items.reduce((acc: number, item: InvoicePreviewItem) => {
    return acc + sanitizeAmount(item.baseTotal ?? item.total);
  }, 0);
};

const splitItemsCount = (items: InvoicePreviewItem[]) => {
  return items.filter((item: InvoicePreviewItem) => {
    const percentage = sanitizeAmount(item.allocationPercentage ?? 100);
    const baseTotal = sanitizeAmount(item.baseTotal ?? item.total);
    const allocatedTotal = sanitizeAmount(item.allocatedTotal ?? item.total);
    return percentage !== 100 || baseTotal !== allocatedTotal;
  }).length;
};
</script>

<template>
  <section>
    <div
      v-if="splitItemsCount(props.items) > 0"
      class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
    >
      <p class="font-bold">Rateio identificado neste fechamento</p>
      <p class="mt-1">
        Alguns atendimentos têm valor bruto e valor rateado por centro de custo. O total
        do fechamento considera apenas o valor rateado.
      </p>
      <div class="mt-2 flex flex-wrap gap-4">
        <span><strong>Itens rateados:</strong> {{ splitItemsCount(props.items) }}</span>
        <span
          ><strong>Valor bruto:</strong>
          {{ currencyFormat(computedGrossTotal(props.items)) }}</span
        >
        <span
          ><strong>Valor rateado:</strong>
          {{ currencyFormat(computedTotal(props.items)) }}</span
        >
      </div>
    </div>

    <div class="overflow-auto rounded-md border border-zinc-200">
      <table class="preview-table min-w-[1580px] table-fixed text-[10px] leading-tight">
        <colgroup>
          <col style="width: 62px" />
          <col style="width: 92px" />
          <col style="width: 98px" />
          <col style="width: 54px" />
          <col style="width: 84px" />
          <col style="width: 92px" />
          <col style="width: 82px" />
          <col style="width: 92px" />
          <col style="width: 200px" />
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
              Finalizado
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Data e Hora
            </th>
            <th
              class="px-1.5 py-1.5 text-left whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Rota
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
              {{ item.user }}
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
              {{ item.finishedAt }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.dateTime }}
            </td>
            <td class="px-1.5 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.route }}
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
          <span>{{ currencyFormat(computedTotal(props.items)) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
