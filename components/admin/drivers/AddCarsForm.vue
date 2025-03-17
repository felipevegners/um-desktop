<script setup lang="ts">
import { Plus, Trash, Paperclip, CircleX, LoaderCircle } from "lucide-vue-next";
import { useFilesStore } from "~/stores/admin/files.store";
import { storeToRefs } from 'pinia'

const emit = defineEmits(["update:modelValue"]);
const props = defineProps(["modelValue"]);

const store = useFilesStore();
const { deleteFileAction } = store;
const { loadingFileData } = storeToRefs(store)

const addRow = () => {
  props.modelValue.push({
    carModel: "",
    carColor: "",
    carPlate: "",
    carYear: "",
    carDocumentFile: {
      name: "",
      url: ""
    }
  });
};

const deleteFile = async (url: string) => {
  try {
    await deleteFileAction(url);
  } catch (error) {
    console.log("Error during delete file -> ", error)
  } finally {
    alert('Arquivo deletado com sucesso!')
  }
}

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
    <div class="grid grid-cols-12 gap-4" v-for="(car, index) in props.modelValue" :key="car.id">
      <div class="col-span-11 mb-8 grid grid-cols-6 gap-4 items-end">
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
            <FormLabel>Anexar CRLV-e</FormLabel>
            <FormControl>
              <div class="flex gap-4">
                <UploadButton
                  class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
                  :config="{
                    appearance: {
                      container: '!items-start',
                      allowedContent: '!absolute !top-10',
                    },
                    content: {
                      allowedContent({ ready, fileTypes, isUploading }) {
                        if (ready) return '';
                        if (isUploading) return 'Enviando seu arquivo, aguarde...';
                      },
                    },
                    endpoint: 'driverCarFiles',
                    onClientUploadComplete: (file) => {
                      console.log('uploaded', file);
                      modelValue[index].carDocumentFile.name = file[0].name
                      modelValue[index].carDocumentFile.url = file[0].ufsUrl
                    },
                    onUploadError: (error) => {
                      console.error('---> ', error, error.cause);
                      alert('Upload failed');
                    },
                  }" />
                <div v-if="modelValue[index]?.carDocumentFile?.name !== ''" class="flex gap-2 items-center">
                  <Paperclip class="w-4 h-4 text-zinc-500" />
                  <div class="px-2 border border-dashed border-green-500">
                    {{ modelValue[index]?.carDocumentFile?.name || '' }}
                  </div>
                  <CircleX class="w-4 h-4 text-zinc-500 hover:text-red-500 cursor-pointer"
                    @click.prevent="deleteFile(modelValue[index]?.carDocumentFile.url)" />
                  <LoaderCircle v-if="loadingFileData" class="w-4 h-4" />
                </div>
              </div>
            </FormControl>
            <FormMessage class="absolute" />
          </FormItem>
        </FormField>
      </div>
      <div class="py-3 flex items-center">
        <div class="mt-2 flex gap-2 items-center">
          <Plus class="text-white bg-zinc-800 h-5 w-5 rounded-full cursor-pointer hover:bg-zinc-600"
            @click.prevent="addRow" />
          <Trash v-if="index > 0" @click.prevent="removeRow(index)"
            class="w-5 h-5 text-zinc-800 cursor-pointer hover:text-red-600" />
          <div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sr-only:focus {
  box-shadow: none !important;
}
</style>
