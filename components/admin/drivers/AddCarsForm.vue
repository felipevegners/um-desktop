<script setup lang="ts">
  import { Plus, Trash } from "lucide-vue-next";

  defineEmits(["update:modelValue"]);
  const props = defineProps(["modelValue"]);

  const addRow = () => {
    props.modelValue.push({
      carModel: "",
      carColor: "",
      carPlate: "",
      carYear: ""
    });
  };

  const removeRow = (index: any) => {
    props.modelValue.splice(index, 1);
  };
</script>

<template>
  <div class="p-6 rounded-md bg-zinc-100">
    <h3 class="mb-4 font-bold">Adicionar veículo</h3>
    <div class="mb-4 grid grid-cols-5 gap-4 items-end" v-for="(car, index) in props.modelValue">
      <FormField name="carModel">
        <FormItem>
          <FormLabel>Modelo</FormLabel>
          <FormControl>
            <Input type="text" placeholder="ex.: Toyota Corolla LX" v-model="car.carModel" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField name="carColor">
        <FormItem>
          <FormLabel>Cor</FormLabel>
          <FormControl>
            <Input type="text" placeholder="ex.: Preto" v-model="car.carColor" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField name="carPlate">
        <FormItem>
          <FormLabel>Placa</FormLabel>
          <FormControl>
            <Input type="text" placeholder="ex.: ABC-3456" v-model="car.carPlate" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField name="carYear">
        <FormItem>
          <FormLabel>Ano/Modelo</FormLabel>
          <FormControl>
            <Input type="text" placeholder="ex.: 2024/2025" v-model="car.carYear" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <div class="py-3 flex items-center">
        <div class="mt-2 flex gap-2 items-center">
          <Trash v-if="index > 0" @click.prevent="removeRow(index)"
            class="w-5 h-5 text-zinc-800 cursor-pointer hover:text-red-600" />
          <Plus class="text-white bg-zinc-800 h-5 w-5 rounded-full cursor-pointer hover:bg-zinc-600"
            @click.prevent="addRow" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
