<script setup lang="ts">
import { LoaderCircle } from "lucide-vue-next";

const emit = defineEmits(["show-form", "fetch-customer"]);
const showPassengerForm = () => {
  emit("show-form");
};
</script>

<template>
  <form @submit="">
    <div class="mb-8 p-8 gap-4 bg-zinc-300 rounded-md">
      <div class="grid grid-cols-5 gap-4 items-center">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem class="relative">
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: João Silva"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="email">
          <FormItem class="relative">
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: joao_silva@email.com.br"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="phone">
          <FormItem>
            <FormLabel>Celular</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: 11-9987605432"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="document">
          <FormItem>
            <FormLabel>CPF</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: 123.345.567-89"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>
      </div>
      <div class="mt-4 py-4 flex gap-4">
        <Button type="submit">
          <LoaderCircle v-if="false" class="w-10 h-10 animate-spin" />
          Salvar</Button
        >
        <Button variant="ghost" @click.prevent="showPassengerForm"
          >Cancelar</Button
        >
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
