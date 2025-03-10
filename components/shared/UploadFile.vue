<script setup lang="ts">
  const alert = (msg: string) => {
    window.alert(msg);
  };

  const { startUpload } = useUploadThing("driverFiles", {
    onClientUploadComplete(res) {
      console.log(`onClientUploadComplete  ->`, res);
      alert("Upload Completed");
    },
  });
</script>

<template>
  <label>
    <input type="file" @change="
      async (e) => {
        console.log(`e`, e);
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        console.log('FILE NAME ->', file.name)
        await startUpload([file]);
      }
    " />
  </label>
</template>
