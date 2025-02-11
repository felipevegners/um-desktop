<script setup lang="ts">
import { Plus, Trash } from "lucide-vue-next";

defineEmits(["update:modelValue"]);
const props = defineProps(["modelValue"]);

const addRow = () => {
  props.modelValue.push({ areaCode: "", areaName: "" });
};

const removeRow = (index: any) => {
  props.modelValue.splice(index, 1);
};
</script>

<template>
  <div class="p-6 rounded-md bg-zinc-100">
    <h3 class="mb-4 font-bold">Adicionar CC ou Área</h3>
    <div
      class="mb-4 grid grid-cols-3 gap-4 items-end"
      v-for="(area, index) in props.modelValue"
    >
      <FormField name="areaCode">
        <FormItem>
          <FormLabel>Código</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="ex.: CC0001"
              v-model="area.areaCode"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField name="areaName">
        <FormItem>
          <FormLabel>Nome</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="ex.: Jurídico"
              v-model="area.areaName"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <div class="py-3 flex items-center">
        <div class="mt-2 flex gap-2 items-center">
          <Trash
            v-if="index > 0"
            @click.prevent="removeRow(index)"
            class="w-5 h-5 text-zinc-800 cursor-pointer hover:text-red-600"
          />
          <Plus
            class="text-white bg-zinc-800 h-5 w-5 rounded-full cursor-pointer hover:bg-zinc-600"
            @click.prevent="addRow"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
