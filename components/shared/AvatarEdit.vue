<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { CircleX, LoaderCircle, Paperclip } from 'lucide-vue-next';
import { ref } from 'vue';
import { useFilesStore } from '~/stores/files.store';

const filesStore = useFilesStore();
const { deleteFileAction } = filesStore;

const { toast } = useToast();

defineProps<{
  uploadUrl?: any;
}>();

const loadingFileData = ref<boolean>(false);
const avatarFile = defineModel<any>({
  default: { name: '', url: '' },
});

defineEmits(['update:avatarFile']);

const deleteFile = async (url: string) => {
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Arquivo não pode ser removido. Tente novamente.`,
    });
  } finally {
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Arquivo foi removido com sucesso!`,
    });
    avatarFile.value.name = '';
    avatarFile.value.url = '';
  }
};
</script>
<template>
  <div class="p-2 pb-4 flex flex-col gap-2 border border-zinc-300 rounded-md bg-white">
    <NuxtImg
      :src="avatarFile?.url"
      loading="lazy"
      placeholder="/images/no-avatar.png"
      class="w-[200px] h-[240px] rounded-md object-cover bg-white"
      v-slot="{ src, isLoaded, imgAttrs }"
      preload
      :custom="true"
    >
      <img v-if="isLoaded" v-bind="imgAttrs" :src="src" />
      <div v-else class="rounded-md flex items-center justify-center">
        <img v-bind="imgAttrs" src="/images/no-avatar.png" />
      </div>
    </NuxtImg>
    <div class="flex items-end justify-between gap-4">
      <div v-if="avatarFile?.name === ''" class="relative w-full">
        <UploadButton
          class="ut-button:w-full ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
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
            endpoint: uploadUrl,
            onClientUploadComplete: (file) => {
              avatarFile.name = file[0].name;
              avatarFile.url = file[0].ufsUrl;
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
      <div v-if="avatarFile?.name !== ''" class="flex flex-col gap-2 items-center w-full">
        <small>Editar Arquivo:</small>
        <div class="flex gap-2 items-center justify-center">
          <Paperclip class="w-4 h-4 text-zinc-500" />
          <div class="px-4 py-0 border border-dashed border-zinc-500 rounded-md bg-white">
            <a
              class="underline"
              :href="avatarFile?.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ avatarFile?.name || 'Nenhum arquivo anexo' }}
            </a>
          </div>
          <LoaderCircle v-if="loadingFileData" class="w-4 h-4 animate-spin" />
          <CircleX
            v-else
            class="w-4 h-4 text-zinc-500 hover:text-red-500 cursor-pointer"
            @click.prevent="deleteFile(avatarFile?.url)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
