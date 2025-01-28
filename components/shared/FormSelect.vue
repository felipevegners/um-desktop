<script lang="ts" setup>
defineProps<{
  items?: any;
  label?: string;
}>();
</script>

<template>
  <Select>
    <FormControl>
      <SelectTrigger>
        <SelectValue :placeholder="label" />
      </SelectTrigger>
    </FormControl>
    <SelectContent>
      <SelectGroup>
        <SelectItem v-for="item in items" :value="item.value">
          {{ item.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
