<script setup lang="ts">
defineOptions({
  name: 'ProductsForm',
});

defineProps<{
  products: any;
}>();

const selectedProducts = ref<any>([]);

const productsData = (value: any) => {
  selectedProducts.value = [...value];
};
</script>
<template>
  <section class="px-6">
    <FormItem>
      <div class="md:grid md:grid-cols-2 gap-4">
        <FormField
          v-for="(product, i) in products"
          v-slot="{ handleChange, value }"
          :key="product.id"
          type="checkbox"
          :value="product"
          :unchecked-value="false"
          name="products"
        >
          <FormItem class="p-6 flex flex-col items-start bg-white rounded-md">
            <FormControl>
              <Checkbox
                class="w-6 h-6"
                :checked="!!value.find((item: any) => item.id === product.id)"
                @update:checked="handleChange"
              />
            </FormControl>
            <div>
              <FormLabel class="font-normal uppercase text-lg">
                <div
                  class="w-[80px] h-[80px] rounded-md bg-white bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
                  :style="{ backgroundImage: `url(${product.image?.url})` }"
                />
                <span
                  class="mr-2 px-2 py-1 uppercase text-white text-center rounded-md"
                  :class="`${product.type === 'contract' ? 'bg-zinc-800' : product.type === 'free-km' ? 'bg-orange-400' : 'bg-purple-400'}`"
                  >{{ product.code }}</span
                >
                {{ product.name }}
              </FormLabel>
            </div>
            <div v-if="!!value.find((item: any) => item.id === product.id)">
              <div
                v-if="product.type === 'contract'"
                class="p-6 md:grid md:grid-cols-3 gap-4 border border-zinc-700 rounded-md"
              >
                <FormField v-slot="{ componentField }" name="basePrice">
                  <FormItem>
                    <FormLabel>Valor do Base (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="includedHours">
                  <FormItem>
                    <FormLabel>Franquia Horas</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="includedKms">
                  <FormItem>
                    <FormLabel>Franquia KMs</FormLabel>
                    <FormControl>
                      <Input type="number" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="kmPrice">
                  <FormItem>
                    <FormLabel>Valor KM Adicional (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="minutePrice">
                  <FormItem>
                    <FormLabel>Valor Minuto Adicional (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
              <div
                v-if="product.type === 'free' || product.type === 'free-km'"
                class="p-6 border-2 border-zinc-700 rounded-md"
              >
                <div class="p-6 md:grid md:grid-cols-3 gap-4">
                  <FormField v-slot="{ componentField }" name="basePrice">
                    <FormItem>
                      <FormLabel>Valor Base (R$)</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                        <FormMessage />
                      </FormControl>
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="kmPrice">
                    <FormItem>
                      <FormLabel>Valor KM (R$)</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                        <FormMessage />
                      </FormControl>
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="minutePrice">
                    <FormItem>
                      <FormLabel>Valor Minuto (R$)</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                        <FormMessage />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </div>
          </FormItem>
        </FormField>
      </div>
      <FormMessage />
      {{ selectedProducts }}
    </FormItem>
  </section>
</template>
<style scoped></style>
