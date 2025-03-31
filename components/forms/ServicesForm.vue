<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';

const services = [
  {
    id: 'free_km',
    label: 'Kilometragem Livre',
  },
  {
    id: 'aditional_km',
    label: 'Kilometragem Adicional',
  },
  {
    id: 'hourly_km',
    label: 'Valor por Hora',
  },
] as const;
</script>
<template>
  <section class="px-6">
    <div>
      <FormField v-slot="{ componentField }" name="services">
        <FormItem>
          <FormLabel class="mb-4">Selecione os Serviços</FormLabel>
          <div class="mt-4 flex items-start gap-6">
            <FormField
              v-for="item in services"
              v-slot="{ handleChange, value }"
              :key="item.id"
              type="checkbox"
              :value="item.id"
              :unchecked-value="false"
              name="restrictions"
            >
              <FormItem
                class="mt-4 max-w-[200px] flex items-start space-x-2 space-y-0"
              >
                <FormControl>
                  <Checkbox
                    :checked="value?.includes(item.id)"
                    @update:checked="handleChange"
                  />
                </FormControl>
                <FormLabel class="font-normal">
                  {{ item.label }}
                </FormLabel>
              </FormItem>
            </FormField>
          </div>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
  </section>
</template>
<style scoped></style>
