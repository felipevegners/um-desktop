<script lang="ts" setup>
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const props = defineProps<{
  items?: any[];
  label?: string;
  tableId?: string;
}>();

const emit = defineEmits(['on-select']);

const selected = (value: any) => {
  emit('on-select', value, props.tableId);
};
</script>

<template>
  <Select @update:model-value="selected">
    <SelectTrigger>
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
    <!-- <SelectContent v-else>
      <SelectGroup>
        <SelectItem :value="'-'">
          {{ label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent> -->
  </Select>
</template>
