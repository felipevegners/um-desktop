<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { cn } from '@/lib/utils';
import { LoaderCircle, Trash } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useFilesStore } from '~/stores/files.store';

const filesStore = useFilesStore();
const { deleteFileAction } = filesStore;

const { toast } = useToast();

type AvatarFile = { name: string; url: string; key: string };

type Props = {
  uploadUrl?: any;
  type?: string;
  modelValue?: AvatarFile;
};

const props = withDefaults(defineProps<Props>(), {
  type: 'profile-picture',
});

const loadingNewImage = ref<boolean>(false);
const loadingDeleteImage = ref<boolean>(false);

const avatarFile = ref<AvatarFile>({ name: '', url: '', key: '' });

const emit = defineEmits<{
  (e: 'update:modelValue', payload: AvatarFile): void;
  (e: 'update:avatarFile', payload: AvatarFile): void;
}>();

// initialize from incoming v-model prop
if (props.modelValue) {
  avatarFile.value = {
    name: props.modelValue.name || '',
    url: props.modelValue.url || '',
    key: props.modelValue.key || '',
  };
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      avatarFile.value = { name: v.name || '', url: v.url || '', key: v.key || '' };
    }
  },
  { deep: true },
);

const $fetch = (useNuxtApp() as any).$fetch;

const deleteFile = async (url: string) => {
  loadingDeleteImage.value = true;
  try {
    await deleteFileAction(url);
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Arquivo foi removido com sucesso!`,
    });
    avatarFile.value.name = '';
    avatarFile.value.url = '';
    emit('update:modelValue', avatarFile.value);
    emit('update:avatarFile', avatarFile.value);
  } catch (error: any) {
    toast({
      title: 'Oops!',
      description: `Arquivo não pode ser removido. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    loadingDeleteImage.value = false;
  }
};

const imageSrc = computed(() => {
  if (avatarFile.value.url !== '') {
    return avatarFile.value.url;
  } else if (props.type === 'profile-picture') {
    return '/images/no-avatar.png';
  } else {
    return '/images/no-image.png';
  }
});

const uploadConfig: any = {
  optionalChainingAssign: true,
  appearance: {
    container: '!items-start',
    allowedContent: '!absolute !top-10',
  },
  content: {
    allowedContent({ ready, fileTypes, isUploading }: any) {
      if (ready) return '';
      if (isUploading) return 'Enviando seu arquivo, aguarde...';
    },
  },
  endpoint: props.uploadUrl,
  onBeforeUploadBegin: () => {
    loadingNewImage.value = true;
  },
  onClientUploadComplete: (files: any) => {
    const file = files?.[0];
    const oldUrl = avatarFile.value?.url;
    const oldKey = avatarFile.value?.key;
    if (oldUrl || oldKey) {
      $fetch('/api/files', {
        method: 'DELETE',
        body: { fileKey: oldKey || undefined, fileUrl: oldUrl || undefined },
      }).catch(() => {});
    }
    avatarFile.value.name = file?.name || '';
    avatarFile.value.url = file?.ufsUrl || file?.url || '';
    avatarFile.value.key = file?.key || file?.fileKey || '';
    loadingNewImage.value = false;
    emit('update:modelValue', avatarFile.value);
    emit('update:avatarFile', avatarFile.value);
  },
  onUploadError: (error: any) => {
    toast({
      title: 'Ooops!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Erro ao enviar o arquivo. Tente novamente. ${error?.cause ?? ''}`,
    });
    loadingNewImage.value = false;
  },
};
</script>
<template>
  <div
    class="p-2 pb-4 w-[250px] flex flex-col items-center justify-center gap-2 border border-zinc-300 rounded-md bg-white"
  >
    <NuxtImg
      :src="imageSrc"
      loading="lazy"
      :class="
        cn(
          props.type === 'profile-picture' && 'w-[250px] object-cover bg-white',
          props.type === 'customer-logo' && 'p-4 w-full h-[180px] object-fit bg-white',
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
      <img
        v-else
        v-bind="imgAttrs"
        :src="src"
        class="h-[300px] w-[250px] object-cover bg-white"
      />
    </NuxtImg>
    <div class="flex items-end justify-between gap-4">
      <div v-if="avatarFile.name === ''" class="relative w-full">
        <UploadButton
          class="ut-button:w-[180px] ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
          :config="uploadConfig"
        />
      </div>
      <div v-else class="flex flex-col gap-2 items-center w-full">
        <small>Alterar imagem</small>
        <div class="flex gap-2 items-center justify-center">
          <!-- <Paperclip class="w-4 h-4 text-zinc-500" /> -->
          <div class="px-4 py-0 border border-dashed border-zinc-500 rounded-md bg-white">
            <a
              class="underline"
              :href="avatarFile.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ avatarFile.name || 'Nenhum arquivo anexo' }}
            </a>
          </div>
          <LoaderCircle v-if="loadingDeleteImage" class="w-4 h-4 animate-spin" />
          <Trash
            v-else
            class="w-4 h-4 text-zinc-500 hover:text-red-500 cursor-pointer"
            @click.prevent="deleteFile(avatarFile.url)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
