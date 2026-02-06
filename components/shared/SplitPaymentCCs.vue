<script setup lang="ts">
import { Input } from '#components';
import { Plus, Trash, X } from 'lucide-vue-next';
import { currencyFormat, sanitizeAmount } from '~/lib/utils';

import FormSelect from './FormSelect.vue';

const props = defineProps<{
  contractBranches: any[];
  branchAreas: any[];
  estimates: {
    estimatedTotalPrice: string;
  };
  form: any;
}>();
const totalRideRated = ref<any>('');
const remainingRideAmount = ref<any>('0.00');
const showAddCCToShareBtn = ref<boolean>(true);

const splitPaymentCCAreas = defineModel<any>({
  default: [{ area: '', percentage: 0, amount: 0 }],
});

const emit = defineEmits(['update:splitPaymentCCAreas', 'toogleSplitPayment']);

const addShareCCRow = () => {
  splitPaymentCCAreas.value.push({ area: '', percentage: 0, amount: 0 });
};

const removeShareCCRow = (index: number) => {
  splitPaymentCCAreas.value.splice(index, 1);
  calculateCCPercentage(index - 1);
  showAddCCToShareBtn.value = true;
};

const availableContractBranchAreas = computed(() => {
  if (!props.contractBranches) return [];

  const usedAreas = splitPaymentCCAreas.value
    .map((item: any) => item.area)
    .filter((area: string) => area && area !== '');

  return props.branchAreas?.map((item: any) => ({
    ...item,
    disabled: usedAreas.includes(item.value),
  }));
});

const calculateCCPercentage = (index: number) => {
  totalRideRated.value = 0;
  if (index < 0 || index >= splitPaymentCCAreas.value.length) return null;

  // Normalize percentage (strip non-numeric characters coming from mask)
  const raw = splitPaymentCCAreas.value[index].percentage;
  const percentage = Number(String(raw).replace(/[^\d.-]/g, '')) || 0;
  splitPaymentCCAreas.value[index].percentage = percentage;

  const estimatedTotal =
    Number(String(props.estimates?.estimatedTotalPrice).replace(/[^\d.-]/g, '')) || 0;
  const totalPercentage = estimatedTotal * (percentage / 100);
  splitPaymentCCAreas.value[index].amount = Math.round(totalPercentage * 100) / 100;

  // Sum all percentages as numbers
  const checkAllPercentages = splitPaymentCCAreas.value.reduce(
    (acc: number, curr: any) => {
      const p = Number(String(curr.percentage).replace(/[^\d.-]/g, '')) || 0;
      return acc + p;
    },
    0,
  );

  showAddCCToShareBtn.value = checkAllPercentages >= 100 ? false : true;

  if (checkAllPercentages > 100) {
    if (typeof props.form !== 'undefined' && props.form && props.form.setFieldError) {
      //@ts-ignore
      props.form.setFieldError(`percentage-${index}`, 'Valor atingiu os 100%');
      splitPaymentCCAreas.value[index].amount = '0';
    }
    return null;
  } else {
    if (typeof props.form !== 'undefined' && props.form && props.form.resetField) {
      //@ts-ignore
      props.form.resetField(`percentage-${index}`);
    }

    const acumulatedCents = splitPaymentCCAreas.value.reduce((acc: number, curr: any) => {
      const cents = Math.round(sanitizeAmount(curr?.amount || 0) * 100);
      return acc + cents;
    }, 0);

    const acumulated = acumulatedCents / 100;
    totalRideRated.value = acumulated.toFixed(2);

    const estimatedCents = Math.round(
      sanitizeAmount(props.estimates.estimatedTotalPrice) * 100,
    );
    const remainingCents = estimatedCents - acumulatedCents;
    const remaining = remainingCents / 100;
    remainingRideAmount.value = Math.max(0, remaining).toFixed(2);

    splitPaymentCCAreas.value[index].amount = (
      Math.round(totalPercentage * 100) / 100
    ).toFixed(2);

    return splitPaymentCCAreas.value[index].amount;
  }
};

const cancelSplitPayment = () => {
  emit('toogleSplitPayment');
  splitPaymentCCAreas.value = [];
  // reset remaining to the original estimated total
  remainingRideAmount.value = String(props.estimates?.estimatedTotalPrice ?? '0.00');
  showAddCCToShareBtn.value = true;
};
</script>
<template>
  <div class="col-span-2">
    <div class="p-4 rounded-md border border-zinc-950">
      <h3 class="mb-4 font-bold text-xl">Ratear valor entre centros de custo</h3>
      <p class="mb-6 text-sm text-muted-foreground">
        Adicione os Centros de Custo que devem entrar no rateio deste atendimento
      </p>
      <div
        v-for="(area, index) in splitPaymentCCAreas"
        class="mb-10 md:grid md:grid-cols-4 gap-4"
      >
        <FormField v-slot="{}" :name="`cc-${index}`">
          <FormItem class="col-span-2">
            <FormLabel>Centro de Custo*</FormLabel>
            <FormControl>
              <FormSelect
                :items="availableContractBranchAreas"
                :loading="false"
                label="Selecione"
                v-model="area.area"
              />
            </FormControl>
            <FormMessage class="text-xs" />
          </FormItem>
        </FormField>
        <FormField v-slot="{}" :name="`percentage-${index}`">
          <FormItem class="col-span-1">
            <FormLabel>Porcentagem</FormLabel>
            <FormControl>
              <Input
                type="number"
                v-maska="'### %'"
                v-model="area.percentage"
                @update:model-value="calculateCCPercentage(index as number)"
              />
            </FormControl>
            <FormMessage class="absolute text-xs" />
          </FormItem>
        </FormField>
        <div class="flex flex-col justify-center gap-2">
          <small class="font-medium text-sm leading-none"> Valor </small>
          <div class="mt-2 flex items-center gap-2">
            <p class="font-bold">
              {{ currencyFormat(area.amount.toString()) }}
            </p>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              @click.prevent="removeShareCCRow(index as number)"
              class="p-2"
            >
              <Trash />
            </Button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <Button v-if="showAddCCToShareBtn" class="w-fit" @click.prevent="addShareCCRow">
          <Plus />
          Adicionar C/C
        </Button>
        <Button type="button" variant="secondary" @click.prevent="cancelSplitPayment">
          <X />
          Cancelar
        </Button>
      </div>
    </div>
  </div>
  <div
    v-if="splitPaymentCCAreas.length"
    class="col-span-2 flex items-center justify-end gap-10"
  >
    <div>
      <small>Total do atendimento</small>
      <p
        class="text-3xl font-bold text-zinc-950"
        :class="remainingRideAmount !== 0 && 'text-amber-600'"
      >
        {{ currencyFormat(estimates.estimatedTotalPrice) }}
      </p>
    </div>
    <div>
      <small>Resta ratear</small>
      <p
        class="text-3xl font-bold text-red-600"
        :class="remainingRideAmount == 0 && 'text-green-600'"
      >
        {{ currencyFormat(remainingRideAmount) }}
      </p>
    </div>
  </div>
</template>

<style scoped></style>
