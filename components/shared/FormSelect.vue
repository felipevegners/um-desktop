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

defineProps<{
  items?: any[];
  label?: string;
}>();

const emit = defineEmits(['on-select']);

const selected = (value: any) => {
  emit('on-select', value);
};
</script>

<template>
  <Select @update:model-value="selected">
    <SelectTrigger>
      <SelectValue :placeholder="label" />
    </SelectTrigger>
    <SelectContent v-if="items?.length">
      <SelectGroup>
        <SelectItem
          v-for="item in items"
          :value="item.value"
          :key="item.value"
          :id="item.value"
          class="hover:bg-zinc-500 hover:text-red-500"
        >
          {{ item.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
    <SelectContent v-else>
      <SelectGroup>
        <SelectItem :value="'-'">
          {{ label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
