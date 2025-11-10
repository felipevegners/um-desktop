<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const driverOffersList = [
  {
    id: 'standard',
    label: 'Atendimento Padrão',
  },
  {
    id: 'bilingual-english',
    label: 'Atendimento em Inglês',
  },
  {
    id: 'bilingual-spanish',
    label: 'Atendimento em Espanhol',
  },
  {
    id: 'libras',
    label: 'Atendimento em Libras',
  },
  {
    id: 'pcd-ride',
    label: 'Atendimento PCD',
  },
] as const;
</script>

<template>
  <FormField name="driverOffers">
    <FormItem>
      <FormField
        v-for="item in driverOffersList"
        v-slot="{ value, handleChange }"
        :key="item.id"
        type="checkbox"
        :value="item.id"
        :unchecked-value="false"
        name="driverOffers"
      >
        <FormItem class="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              :model-value="value.includes(item.id)"
              @update:model-value="handleChange"
            />
          </FormControl>
          <FormLabel class="font-normal">
            {{ item.label }}
          </FormLabel>
        </FormItem>
      </FormField>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
