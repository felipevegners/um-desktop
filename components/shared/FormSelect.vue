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
}>();
const selectedItem = ref('');
const emit = defineEmits(['on-select']);

const selected = (value: any) => {
  emit('on-select', value, props.tableId);
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
          {{ item.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
