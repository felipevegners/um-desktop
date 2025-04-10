<script setup lang="ts">
defineOptions({
  name: 'ProductsForm',
});

defineEmits(['update:modelValue']);
const props = defineProps(['modelValue', 'products']);

const productsData = (value: any) => {
  const newProduct = {
    id: value.id,
    name: value.name,
    code: value.code,
    image: value.image,
    type: value.type,
    capacity: value.capacity,
    basePrice: value.basePrice,
    includedHours: value.includedHours || '-',
    includedKms: value.includedKms || 0,
    kmPrice: value.kmPrice,
    minutePrice: value.minutePrice,
    description: value.description || '-',
    enabled: value.enabled,
  };
  const index = props.modelValue.findIndex((obj: any) => obj.id === value.id);
  if (index > -1) {
    props.modelValue.splice(index, 1);
  } else {
    props.modelValue.push(newProduct);
  }
};

const filteredProducts = computed(() => {
  return props.products.filter((product: any) => product.enabled);
});

const checkAdded = (id: string) => {
  return !!props.modelValue.find((item: any) => item.id === id);
};
</script>
<template>
  <section class="px-6">
    <div class="md:grid md:grid-cols-2 gap-4 items-start">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="p-6 flex flex-col gap-4 bg-white rounded-md"
      >
        <Checkbox
          id="terms"
          @update:checked="productsData(product)"
          :checked="checkAdded(product.id)"
        />
        <div class="font-normal uppercase flex items-center gap-4">
          <div
            class="mb-4 w-[80px] h-[80px] rounded-md bg-zinc-200 bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
            :style="{ backgroundImage: `url(${product.image?.url})` }"
          />
          <p>
            <span
              class="mr-2 px-2 py-1 uppercase text-white text-center rounded-md"
              :class="`${product.type === 'contract' ? 'bg-zinc-800' : product.type === 'free-km' ? 'bg-orange-400' : 'bg-purple-400'}`"
              >{{ product.code }}</span
            >
            {{ product.name }}
          </p>
        </div>
        <p class="text-sm text-zinc-500">{{ product.description }}</p>
        <div v-if="checkAdded(product.id)">
          <div
            v-if="product.type === 'contract'"
            class="p-4 border border-zinc-700 rounded-md"
          >
            <p class="mb-8 font-bold border-b border-b-zinc-700">
              Editar valores
            </p>
            <div class="md:grid md:grid-cols-2 gap-4">
              <div>
                <Label for="basePrice">Valor Base (R$)</Label>
                <Input
                  type="text"
                  v-model="product.basePrice"
                  name="basePrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Franquia de Horas</Label>
                <Input
                  type="text"
                  :default-value="product.includedHours"
                  v-model="product.includedHours"
                  name="includedHours"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Franquia de KMs</Label>
                <Input
                  type="text"
                  :default-value="product.includedKms"
                  v-model="product.includedKms"
                  name="includedKms"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Km Adicional (R$)</Label>
                <Input
                  type="text"
                  v-model="product.kmPrice"
                  name="kmPrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Minuto Adicional (R$)</Label>
                <Input
                  type="text"
                  :default-value="product.minutePrice"
                  v-model="product.minutePrice"
                  name="minutePrice"
                  class="mt-2"
                />
              </div>
            </div>
          </div>
          <div
            v-if="product.type === 'free-km' || product.type === 'free'"
            class="p-4 border border-zinc-700 rounded-md"
          >
            <p class="mb-8 font-bold border-b border-b-zinc-700">
              Editar valores
            </p>
            <div class="md:grid md:grid-cols-2 gap-4">
              <div>
                <Label for="basePrice">Valor Base (R$)</Label>
                <Input
                  type="text"
                  v-model="product.basePrice"
                  name="basePrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Valor Km Adicional (R$)</Label>
                <Input
                  type="text"
                  v-model="product.kmPrice"
                  name="kmPrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Valor Minuto Adicional (R$)</Label>
                <Input
                  type="text"
                  :default-value="product.minutePrice"
                  v-model="product.minutePrice"
                  name="minutePrice"
                  class="mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped></style>
