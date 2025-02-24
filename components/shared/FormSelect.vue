<script lang="ts" setup>
defineProps<{
  items?: any[];
  label?: string;
}>();

const emit = defineEmits(["on-select"]);

const selected = (value: any) => {
  emit("on-select", value);
};
</script>

<template>
  <Select @update:model-value="selected">
    <FormControl>
      <SelectTrigger>
        <SelectValue :placeholder="label" />
      </SelectTrigger>
    </FormControl>
    <SelectContent v-if="items?.length">
      <SelectGroup>
        <SelectItem v-for="item in items" :value="item.value">
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
