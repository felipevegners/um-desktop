<script setup lang="ts">
import { Plus, Trash } from "lucide-vue-next";

const emit = defineEmits(["update:modelValue"]);
const props = defineProps(["modelValue"]);

let carId = 0

const addRow = () => {
  props.modelValue.push({
    id: carId,
    carModel: "",
    carColor: "",
    carPlate: "",
    carYear: "",
    carDocumentFile: {
      name: "",
      url: ""
    }
  });
  carId++
};

const removeRow = (index: any) => {
  props.modelValue.splice(index, 1);
};

const alert = (msg: string) => {
  window.alert(msg);
};
</script>

<template>
  <div class="p-6 rounded-md bg-zinc-100">
    <h3 class="mb-4 font-bold">Adicionar veículo</h3>
    <div class="mb-4 grid grid-cols-7 gap-4 items-end" v-for="(car, index) in props.modelValue" :key="car.id">
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
      <FormField :name="`carDocumentCopy${index}`">
        <FormItem class="col-span-2">
          <FormLabel>Anexar Documento CRLV-e</FormLabel>
          <FormControl>
            <Input type="text" @change="emit('update:modelValue', { carDocumentFile: $event.target.value })" />
            <!-- <Input :id="`carDocumentCopy${index}`" type="file" v-model="car.carDocumentCopyName" :key="car.id" /> -->
            <!-- <UploadButton class="bg-zinc-700" :config="{
              endpoint: 'driverCarFiles',
              onClientUploadComplete: (file) => {
                console.log('uploaded', file);

              },
              onUploadError: (error) => {
                console.error(error, error.cause);
                alert('Upload failed');
              },
            }" /> -->
          </FormControl>
          <FormMessage class="absolute" />
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
