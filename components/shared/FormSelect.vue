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
    <SelectTrigger v-if="loading">
      <LoaderCircle class="animate-spin" />
    </SelectTrigger>
    <SelectTrigger v-else>
      <SelectValue :placeholder="label" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="item in items"
          :value="item.value"
          :key="item.value"
          :id="item.value"
          class="hover:bg-zinc-500"
        >
          <div v-if="decoration" class="flex items-center gap-1">
            <span :class="`block w-4 h-3 rounded-lg bg-${item.color}`"></span>
            {{ item.label }}
          </div>
          <p v-else>{{ item.label }}</p>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
