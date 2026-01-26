<script setup lang="ts">
const emit = defineEmits(['update:modelValue']);
const props = defineProps(['modelValue']);

const addRow = () => {
  props.modelValue.push({
    info: '',
    type: '',
    value: '',
  });
};

const removeRow = (index: any) => {
  props.modelValue.splice(index, 1);
};
</script>
<template>
  <ul class="mb-4 space-y-2">
    <li
      v-for="(extra, index) in props.modelValue"
      :key="extra.id"
      class="flex items-center space-x-2"
    >
      <Input type="text" v-model="extra.info" />
      <Input type="text" v-model="extra.type" />
      <Input type="text" v-model="extra.value" />
      <button
        type="button"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        @click="addRow"
      >
        Adicionar
      </button>
      <Button variant="destructive" class="ml-2" @click="removeRow(index)">
        Remover
      </Button>
    </li>
  </ul>
</template>

<style scoped></style>
