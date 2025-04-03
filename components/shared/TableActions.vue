<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash } from 'lucide-vue-next';
import { computed } from 'vue';

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
  dataId?: string;
}>();

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
      variant="ghost"
      size="icon"
      class="text-zinc-700 hover:bg-zinc-700 hover:text-white"
      @click="viewFn"
    >
      <Eye class="w-4 h-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="text-zinc-700 hover:bg-zinc-700 hover:text-white"
      @click="editFn"
    >
      <Edit class="w-4 h-4" />
    </Button>
    <Button
      v-if="isAdmin"
      variant="ghost"
      size="icon"
      class="text-zinc-700 hover:bg-red-500 hover:text-white"
      @click="deleteFn"
    >
      <Trash class="w-4 h-4" />
    </Button>
  </div>
</template>

<style scoped></style>
