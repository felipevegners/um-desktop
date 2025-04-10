<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Edit, Eye, LoaderCircle, Trash } from 'lucide-vue-next';
import { computed, ref } from 'vue';

defineOptions({
  name: 'TableActions',
});

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

const isAdmin = computed(() => {
  return user?.role === 'admin';
});

const props = defineProps<{
  // expects string array with options eg.: ['edit', 'delete', [preview]]
  options?: string[];
  dataId?: string;
  loading?: any;
}>();

const showConfirmationModal = ref(false);

const toggleConfirmationModal = () => {
  showConfirmationModal.value = !showConfirmationModal.value;
};

const emit = defineEmits(['view', 'edit', 'delete']);

const viewFn = () => {
  emit('view', props.dataId);
};

const editFn = () => {
  emit('edit', props.dataId);
};

const deleteFn = () => {
  emit('delete', props.dataId);
};
</script>
<template>
  <div class="flex items-center gap-1">
    <Button
      v-if="props.options?.includes('preview')"
      variant="ghost"
      size="icon"
      class="text-zinc-700 hover:bg-zinc-700 hover:text-white"
      @click="viewFn"
    >
      <Eye class="w-4 h-4" />
    </Button>
    <Button
      v-if="props.options?.includes('edit')"
      variant="ghost"
      size="icon"
      class="text-zinc-700 hover:bg-zinc-700 hover:text-white"
      @click="editFn"
    >
      <Edit class="w-4 h-4" />
    </Button>
    <Button
      v-if="props.options?.includes('delete') && isAdmin"
      variant="ghost"
      size="icon"
      class="text-zinc-700 hover:bg-red-500 hover:text-white"
      @click="toggleConfirmationModal"
    >
      <Trash class="w-4 h-4" />
    </Button>
  </div>

  <AlertDialog :open="showConfirmationModal">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deseja realmente excluir?</AlertDialogTitle>
        <AlertDialogDescription>
          Essa ação é irreversível e excluirá permanentemente da base de dados.
          <br />
          <br />
          <strong>ID a ser deletado:</strong> {{ props.dataId }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="toggleConfirmationModal">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-red-500 hover:bg-red-600"
          @click="
            () => {
              deleteFn();
              toggleConfirmationModal();
            }
          "
        >
          <LoaderCircle v-if="props.loading" class="w-10 h-10 animate-spin" />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
