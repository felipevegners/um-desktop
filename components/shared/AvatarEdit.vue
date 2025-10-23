<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { cn } from '@/lib/utils';
import { CircleX, LoaderCircle, Paperclip } from 'lucide-vue-next';
import { ref } from 'vue';
import { useFilesStore } from '~/stores/files.store';

const filesStore = useFilesStore();
const { deleteFileAction } = filesStore;

const { toast } = useToast();

type Props = {
  uploadUrl?: any;
  type?: string;
};

const props = withDefaults(defineProps<Props>(), {
  type: 'profile-picture',
});

const loadingNewImage = ref<boolean>(false);
const loadingDeleteImage = ref<boolean>(false);
const avatarFile = defineModel<any>({
  default: { name: '', url: '' },
});

defineEmits(['update:avatarFile']);

const deleteFile = async (url: string) => {
  loadingDeleteImage.value = true;
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Arquivo não pode ser removido. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Arquivo foi removido com sucesso!`,
    });
    avatarFile.value.name = '';
    avatarFile.value.url = '';
    loadingDeleteImage.value = false;
  }
};

const imageSrc = computed(() => {
  if (avatarFile?.value.url !== '') {
    return avatarFile.value.url;
  } else if (props.type === 'profile-picture') {
    return '/images/no-avatar.png';
  } else {
    return '/images/no-image.png';
  }
});
</script>
<template>
  <div
    class="p-2 pb-4 w-[200px] flex flex-col items-center justify-center gap-2 border border-zinc-300 rounded-md bg-white"
  >
    <NuxtImg
      :src="imageSrc"
      loading="lazy"
      :class="
        cn(
          type === 'profile-picture' && 'w-[200px] h-[240px] object-cover bg-white',
          type === 'customer-logo' && 'p-4 w-full h-[180px] object-fit bg-white',
        )
      "
      v-slot="{ src, imgAttrs }"
      preload
      :custom="true"
    >
      <div
        v-if="loadingNewImage"
        v-bind="imgAttrs"
        class="flex items-center justify-center"
      >
        <LoaderCircle class="animate-spin" :size="48" />
      </div>
      <img v-else v-bind="imgAttrs" :src="src" />
    </NuxtImg>
    <div class="flex items-end justify-between gap-4">
      <div v-if="avatarFile?.name === ''" class="relative w-full">
        <UploadButton
          class="ut-button:w-[180px] ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
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
            //@ts-ignore
            onBeforeUploadBegin: () => {
              loadingNewImage = true;
            },
            onClientUploadComplete: (file) => {
              avatarFile.name = file[0].name;
              avatarFile.url = file[0].ufsUrl;
              loadingNewImage = false;
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
          <LoaderCircle v-if="loadingDeleteImage" class="w-4 h-4 animate-spin" />
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
