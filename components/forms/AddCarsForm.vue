<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { CircleX, Eye, LoaderCircle, Paperclip, Plus, Trash } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useFilesStore } from '~/stores/admin/files.store';

const { toast } = useToast();

const emit = defineEmits(['update:modelValue']);
const props = defineProps(['modelValue']);

const store = useFilesStore();
const { deleteFileAction } = store;
const { loadingFileData } = storeToRefs(store);

const addRow = () => {
  props.modelValue.push({
    carModel: '',
    carColor: '',
    carPlate: '',
    carYear: '',
    carDocumentFile: {
      name: '',
      url: '',
    },
  });
};

const deleteFile = async (url: string, idx: number) => {
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Documento do veículo ${props.modelValue[idx].carModel} não pode ser removido. Tente novamente.`,
    });
  } finally {
    props.modelValue[idx].carDocumentFile.name = '';
    props.modelValue[idx].carDocumentFile.url = '';
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Documento do veículo ${props.modelValue[idx].carModel} foi removido com sucesso!`,
    });
  }
};

const removeRow = (index: any) => {
  props.modelValue.splice(index, 1);
};
</script>
<template>
  <div class="p-6 rounded-md bg-zinc-100">
    <h3 class="mb-4 font-bold">Adicionar veículo</h3>
    <div
      class="grid grid-cols-12 gap-4"
      v-for="(car, index) in props.modelValue"
      :key="car.id"
    >
      <div class="col-span-11 mb-8 grid grid-cols-5 gap-4 items-end">
        <FormField name="carModel">
          <FormItem>
            <FormLabel>Marca / Modelo</FormLabel>
            <FormControl>
              <Input type="text" v-model="car.carModel" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField name="carColor">
          <FormItem>
            <FormLabel>Cor</FormLabel>
            <FormControl>
              <Input type="text" v-model="car.carColor" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField name="carPlate">
          <FormItem>
            <FormLabel>Placa</FormLabel>
            <FormControl>
              <Input type="text" v-model="car.carPlate" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField name="carYear">
          <FormItem>
            <FormLabel>Ano Fabr.</FormLabel>
            <FormControl>
              <Input type="text" v-model="car.carYear" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField :name="`carDocumentCopy${index}`">
          <FormItem class="col-span-1">
            <FormLabel>Documento CRVL</FormLabel>
            <FormControl>
              <div class="flex gap-4">
                <div v-if="props.modelValue[index].carDocumentFile.name === ''">
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
                        modelValue[index].carDocumentFile.name = file[0].name;
                        modelValue[index].carDocumentFile.url = file[0].ufsUrl;
                      },
                      onUploadError: (error) => {
                        toast({
                          title: 'Ooops!',
                          class: 'bg-red-500 border-0 text-white text-2xl',
                          description: `Erro ao enviar o arquivo. Tente novamente. ${error.cause}`,
                        });
                      },
                    }"
                  />
                </div>
                <div
                  v-if="modelValue[index]?.carDocumentFile?.name !== ''"
                  class="flex gap-2 items-center"
                >
                  <Paperclip class="w-4 h-4 text-zinc-500" />
                  <div
                    class="px-4 py-2 border border-dashed border-zinc-500 rounded-md bg-white"
                  >
                    <a
                      class="underline"
                      :href="props.modelValue[index]?.carDocumentFile?.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ props.modelValue[index]?.carDocumentFile?.name || '' }}
                    </a>
                  </div>
                  <LoaderCircle v-if="loadingFileData" class="w-4 h-4 animate-spin" />
                  <TooltipProvider v-else>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <CircleX
                          class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                          @click.prevent="
                            deleteFile(modelValue[index]?.carDocumentFile.url, index)
                          "
                        />
                      </TooltipTrigger>
                      <TooltipContent class="bg-zinc-700 text-white">
                        <p>Remover Arquivo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </FormControl>
            <FormMessage class="absolute" />
          </FormItem>
        </FormField>
      </div>
      <div class="ml-2 mt-2 flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Trash
                v-if="index > 0"
                @click.prevent="removeRow(index)"
                class="mb-2 mr-2 w-5 h-5 text-zinc-800 cursor-pointer hover:text-red-600"
              />
            </TooltipTrigger>
            <TooltipContent class="bg-zinc-700 text-white">
              <p>Remover Veículo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Plus
                class="mb-2 text-white bg-zinc-700 hover:bg-zinc-400 h-5 w-5 rounded-full cursor-pointer"
                @click.prevent="addRow"
              />
            </TooltipTrigger>
            <TooltipContent class="bg-zinc-700 text-white">
              <p>Adicionar Veículo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sr-only:focus {
  box-shadow: none !important;
}
</style>
