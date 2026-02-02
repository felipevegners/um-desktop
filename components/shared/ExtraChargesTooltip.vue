<script setup lang="ts">
import { Info } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

defineOptions({
  name: 'ExtraChargesTooltip',
});

defineProps<{
  items: any[];
}>();

const extraChargeTypes: any = [
  { label: 'Pedágio', value: 'toll_fee' },
  { label: 'Estacionamento', value: 'parking_fee' },
  { label: 'Diária de Hotel', value: 'hotel_fee' },
  { label: 'Outros', value: 'others' },
];

const translateExtraChargeType = (type: string) => {
  return extraChargeTypes?.find(
    (item: { label: string; value: string }) => item.value === type,
  ).label;
};
</script>
<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Info class="text-blue-600 cursor-help" :size="16" />
      </TooltipTrigger>
      <TooltipContent class="px-4 bg-zinc-900 text-white min-w-[200px]">
        <ul>
          <li v-for="item in items" class="my-3">
            <p class="text=xs font-bold">{{ translateExtraChargeType(item.type) }}</p>
            <small>{{ item.description }}</small>
            <p class="text-sm font-bold text-amber-400">
              {{ currencyFormat(item.ammount) }}
            </p>
          </li>
        </ul>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<style scoped></style>
