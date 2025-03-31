<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';

const services = [
  {
    id: 'free_km',
    label: 'Kilometragem Livre',
    price: 0,
  },
  {
    id: 'hour_price',
    label: 'Valor por Hora',
    price: 0,
  },
  {
    id: 'km_price',
    label: 'Valor por KM',
    price: 0,
  },
  {
    id: 'aditional_km',
    label: 'Valor p/ KM adicional',
    price: 0,
  },
  {
    id: 'weekend_km',
    label: 'Valor KM Fim de Semana',
    price: 0,
  },
] as const;
</script>
<template>
  <section class="px-6">
    <FormItem>
      <FormField
        v-for="item in services"
        v-slot="{ handleChange, value }"
        :key="item.id"
        type="checkbox"
        :value="item.id"
        :unchecked-value="false"
        name="services"
      >
        <FormItem class="flex items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              @update:checked="handleChange"
              :checked="value?.includes(item.id)"
            />
          </FormControl>
          <FormLabel class="mb-4">
            {{ item.label }}
            <Input
              type="text"
              placeholder="Insira o valor da tarifa"
              class="mt-4"
              :value="item.price"
            />
          </FormLabel>
        </FormItem>
        {{ value }}
      </FormField>
      <FormMessage />
    </FormItem>
  </section>
</template>
<style scoped></style>
