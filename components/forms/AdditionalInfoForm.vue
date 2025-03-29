<script setup lang="ts">
definePageMeta({
  name: 'AdditionalInfoForm',
});
</script>
<template>
  <section class="px-6">
    <FormField v-slot="{ componentField }" name="additionalInfo">
      <FormItem>
        <FormLabel class="text-sm text-muted-foreground">*opcional</FormLabel>
        <FormControl>
          <Textarea
            v-bind="componentField"
            class="mt-4 resize-none bg-white h-[150px]"
          />
        </FormControl>
      </FormItem>
    </FormField>
  </section>
</template>
<style scoped></style>
