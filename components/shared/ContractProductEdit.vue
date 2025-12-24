<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { currencyFormat } from '~/lib/utils';

defineProps<{
  contract: any;
  product: any;
  handleAllowProduct: Function;
}>();
</script>
<template>
  <li class="flex-1 p-4 rounded-md border border-zinc-950 bg-white">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="w-[80px] h-[80px] rounded-md bg-zinc-200 bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
          :style="{ backgroundImage: `url(${product.image?.url})` }"
        />
        <div class="flex items-center justify-between gap-2">
          <span class="uppercase font-bold"> {{ product.code }}</span>
          <SharedProductTag :label="product.name" :type="product.name" />
        </div>
      </div>
      <div>
        <Label class="text-sm font-bold">
          {{ product.enabled ? 'Desativar' : 'Ativar' }} Produto
        </Label>
        <div class="mt-2 flex items-center gap-3">
          <Label class="text-sm text-zinc-500"> Inativo </Label>
          <Switch
            v-model:checked="product.enabled"
            class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
          />
          <Label class="text-sm text-zinc-500"> Ativo </Label>
        </div>
      </div>
    </div>
    <div class="my-3 px-4 py-2 border border-zinc-950 rounded-md">
      <h3 class="my-2 font-bold">Valores negociados no contrato</h3>
      <section class="flex flex-row gap-6">
        <div v-if="product.type === 'contract'">
          <small class="text-center text-muted-foreground">Km Incluso</small>
          <p class="font-bold text-center">{{ product.includedKms }}</p>
        </div>
        <div v-if="product.type === 'contract'">
          <small class="text-center text-muted-foreground">Horas Inclusas</small>
          <p class="font-bold text-center">
            {{ product.includedHours }}
          </p>
        </div>
        <div>
          <small class="text-center text-muted-foreground">Valor base</small>
          <p class="font-bold text-center">
            {{ currencyFormat(product.basePrice) }}
          </p>
        </div>
        <div>
          <small class="text-center text-muted-foreground">Valor Km</small>
          <p class="font-bold text-center">
            {{ currencyFormat(product.kmPrice) }}
          </p>
        </div>
        <div>
          <small class="text-center text-muted-foreground">Valor Minuto</small>
          <p class="font-bold text-center">
            {{ currencyFormat(product.minutePrice) }}
          </p>
        </div>
        <div>
          <small class="text-center text-muted-foreground">Capacidade</small>
          <p class="font-bold text-center">{{ product.capacity }}</p>
        </div>
      </section>
    </div>
    <div class="my-3 px-4 py-2 border border-zinc-950 rounded-md">
      <h3 class="mt-2 font-bold">Disponibilidade por Filial</h3>
      <h5 class="text-muted-foreground">
        Selecione quais filiais poderão solicitar atendimento utilizando este produto.
      </h5>
      <section class="flex flex-row gap-6">
        <ul class="my-6 space-y-4">
          <li v-for="branch in contract.branches" class="flex items-center gap-3">
            <Checkbox
              @update:checked="handleAllowProduct({ branch, product })"
              :checked="
                !!branch.allowedProducts.find((item: any) => item.id === product.id)
              "
              class="data-[state=checked]:border-zinc-950 data-[state=checked]:bg-zinc-950 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 w-6 h-6"
            />
            <p>
              <span class="font-bold"> {{ branch.branchCode }} - </span>
              {{ branch.fantasyName }}
            </p>
          </li>
        </ul>
      </section>
    </div>
  </li>
</template>

<style scoped></style>
