<script lang="ts" setup>
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderCircle } from 'lucide-vue-next';

const props = defineProps<{
  items?: any[];
  label?: string;
  tableId?: string;
  loading?: boolean;
  disabled?: boolean;
  decoration?: boolean;
}>();
const selectedItem = ref('');
const emit = defineEmits(['on-select', 'update:modelValue']);

const selected = (value: any) => {
  if (value === '__empty__') return;
  emit('on-select', value, props.tableId);
  emit('update:modelValue', value, props.tableId);
};

const reset = () => {
  selectedItem.value = '';
};

defineExpose({ reset });
</script>

<template>
  <Select
    @update:model-value="selected"
    v-model="selectedItem"
    :disabled="props.disabled"
  >
    <SelectTrigger v-if="loading" class="w-full">
      <LoaderCircle class="animate-spin" />
    </SelectTrigger>
    <SelectTrigger v-else class="w-full">
      <SelectValue :placeholder="label" />
    </SelectTrigger>
    <SelectContent
      side="bottom"
      align="start"
      :side-offset="6"
      :collision-padding="12"
      :avoid-collisions="true"
      class="z-[120] w-[88vw] max-w-[88vw] sm:w-[--radix-select-trigger-width] sm:max-w-[calc(100vw-2rem)]"
    >
      <SelectGroup class="max-h-[350px] overflow-auto">
        <SelectItem
          v-for="item in items"
          :value="item.value"
          :key="item.value"
          :id="item.value"
          class="max-w-full hover:bg-zinc-500"
          :disabled="item.disabled"
        >
          <div v-if="decoration" class="flex min-w-0 items-center gap-1">
            <span :class="`block w-4 h-3 rounded-lg bg-${item.color}`"></span>
            <span class="truncate">{{ item.label }}</span>
          </div>
          <p v-else class="break-words">{{ item.label }}</p>
        </SelectItem>
        <SelectItem v-if="!items?.length" value="__empty__" disabled>
          <p class="text-muted-foreground">Nenhuma opção disponível</p>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
