<script setup lang="ts">
import { Checkbox } from "@/components/ui/checkbox";

const restrictions = [
  {
    id: "week",
    label: "Semana",
  },
  {
    id: "weekend",
    label: "Final de Semana",
  },
  {
    id: "holiday",
    label: "Feriados",
  },
  {
    id: "daylight",
    label: "Diurno",
  },
  {
    id: "night",
    label: "Noturno",
  },
  {
    id: "vacations",
    label: "Férias",
  },
] as const;
</script>

<template>
  <FormItem>
    <FormLabel class="text-base"> Restrições de Atendimento </FormLabel>

    <FormField
      v-for="item in restrictions"
      v-slot="{ handleChange, value }"
      :key="item.id"
      type="checkbox"
      :value="item.id"
      :unchecked-value="false"
      name="restrictions"
    >
      <FormItem class="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox
            :checked="value.includes(item.id)"
            @update:checked="handleChange"
          />
        </FormControl>
        <FormLabel class="font-normal">
          {{ item.label }}
        </FormLabel>
      </FormItem>
    </FormField>
    <FormMessage />
  </FormItem>
</template>
