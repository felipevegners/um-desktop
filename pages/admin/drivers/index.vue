<script setup lang="ts">
import { ref } from "vue";
import { Plus, LoaderCircle } from "lucide-vue-next";
import AddCarsForm from "~/components/admin/drivers/AddCarsForm.vue";

definePageMeta({
  layout: "admin"
});

const showAddForm = ref<boolean>(false);
const driverCars = reactive([
  { carModel: "", carColor: "", carPlate: "", carYear: "" }
]);

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
};
</script>

<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Base de Motoristas</h1>
      <div>
        <Button @click="">
          <Plus class="w-4 h-4" /> Cadastrar Motorista
        </Button>
      </div>
    </section>
    <section v-if="true" class="mb-4 py-4">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Cadastrar novo motorista</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="">
            <h2 class="mt-4 mb-6 text-lg font-bold">Dados Pessoais</h2>
            <div class="mb-4 w-full grid grid-cols-3 gap-8">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex.: João Silva"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="joao_silva@email.com.br"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex.: (11) 99876-5432"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
              <FormField v-slot="{ componentField }" name="document">
                <FormItem class="col-span-1">
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="222.333.444-56"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="driverLicense">
                <FormItem class="col-span-1">
                  <FormLabel>Número CNH</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex. 23456789019"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-3 gap-8"></div>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold">Dados do(s) Veículo(s)</h2>
              <Separator class="mb-4" />
              <pre>{{ driverCars }}</pre>
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverCars" class="col-span-3" />
              </div>
            </section>
            <section class="my-6">
              <h2 class="mb-4 text-lg font-bold">Enviar arquivos</h2>
              <div class="grid grid-cols-3 gap-6">
                <FormField v-slot="{ componentField }" name="picture">
                  <FormItem class="col-span-1">
                    <FormLabel>Foto Pessoal</FormLabel>
                    <FormDescription
                      >*enviar foto de rosto com fundo claro e sem
                      adereços</FormDescription
                    >

                    <FormControl>
                      <Input
                        type="file"
                        placeholder="Selecione uma foto"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="cnhCopy">
                  <FormItem class="col-span-1">
                    <FormLabel>Cópia CNH</FormLabel>
                    <FormDescription>*enviar frente e verso</FormDescription>
                    <FormControl>
                      <Input
                        type="file"
                        placeholder="Selecione uma foto"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="carDocumentCopy">
                  <FormItem class="col-span-1">
                    <FormLabel>Cópia CRV-L</FormLabel>
                    <FormDescription>*enviar frente e verso</FormDescription>

                    <FormControl>
                      <Input
                        type="file"
                        placeholder="Selecione uma foto"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section class="mt-6">
              <Button type="submit">
                <LoaderCircle v-if="true" class="w-10 h-10 animate-spin" />
                Cadastrar
              </Button>
              <Button
                variant="ghost"
                class="ml-4"
                @click.prevent="toggleShowAddForm"
              >
                Cancelar
              </Button>
            </section>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
