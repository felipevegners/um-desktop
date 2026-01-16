<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-vue-next';

defineOptions({
  name: 'DownloadCsvTemplate',
});

const props = defineProps<{
  title?: string;
}>();

// Define the file URL and filename
const fileUrl =
  'https://1f76f02ebg.ufs.sh/f/kwE4poT2ybagBSXadA4PnCxr6t7DUXmGL4Z09QRV8dwklfiN'; // Replace with your file URL
const fileName = 'template_usuarios_um.csv'; // Desired download filename

// Download function
const downloadFile = async () => {
  const response = await fetch(fileUrl, { method: 'GET' });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
</script>

<template>
  <Button type="button" variant="link" @click.prevent="downloadFile">
    <Download />
    {{ title && title.length ? title : 'Baixar template' }}
  </Button>
</template>
