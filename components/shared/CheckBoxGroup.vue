<script setup lang="ts">
import { Checkbox } from "@/components/ui/checkbox";

const restrictions = [
  {
    id: "week",
    label: "Semana"
  },
  {
    id: "weekend",
    label: "Sáb/Dom"
  },
  {
    id: "holiday",
    label: "Feriados"
  },
  {
    id: "daylight",
    label: "Diurno"
  },
  {
    id: "night",
    label: "Noturno"
  },
  {
    id: "vacations",
    label: "Férias"
  }
] as const;
</script>

<template>
  <FormItem>
    <FormLabel> Restrições de Atendimento </FormLabel>
    <div class="flex items-start gap-4">
      <FormField
        v-for="item in restrictions"
        v-slot="{ handleChange, value }"
        :key="item.id"
        type="checkbox"
        :value="item.id"
        :unchecked-value="false"
        name="restrictions"
      >
        <FormItem class="max-w-[100px] flex items-start space-x-2 space-y-0">
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
    </div>
    <FormMessage />
  </FormItem>
</template>
