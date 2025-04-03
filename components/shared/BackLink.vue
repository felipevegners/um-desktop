<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';

const router = useRouter();
defineOptions({
  name: 'BackLink',
});
</script>
<template>
  <Button
    variant="ghost"
    class="mb-8 flex items-center text-zinc-700 hover:text-zinc-900"
    @click="router.back()"
  >
    <ArrowLeft class="w-5 h-5" />
    Voltar
  </Button>
</template>

<style scoped></style>
