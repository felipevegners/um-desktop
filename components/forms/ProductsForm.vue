<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useProductsStore } from '@/stores/admin/products.store';
import { Plus } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, ref } from 'vue';

defineOptions({
  name: 'ProductsForm',
});

const store = useProductsStore();
const { getProductsAction } = store;
const { enabledProducts } = storeToRefs(store);

const showNewProductsList = ref<boolean>(false);
const newProductsList = ref<any>([]);

onBeforeMount(async () => {
  await getProductsAction();
});

defineEmits(['update:modelValue']);
const props = defineProps(['modelValue', 'products', 'editMode']);

const eligibleProducts = computed(() => {
  const eligibles = enabledProducts.value.filter(
    (item: any) => !props.products.some((some: any) => some.id === item.id),
  );
  return eligibles;
});

const addProduct = (value: any) => {
  const index = props.modelValue.findIndex((obj: any) => obj.id === value.id);
  if (index > -1) {
    props.modelValue.splice(index, 1);
  } else {
    props.modelValue.push(value);
  }
};

const addNewProduct = (value: any) => {
  const index = newProductsList.value.findIndex((obj: any) => obj.id === value.id);
  if (index > -1) {
    newProductsList.value.splice(index, 1);
  } else {
    newProductsList.value.push(value);
  }
};
const showNewProducts = () => {
  showNewProductsList.value = !showNewProductsList.value;
};

const saveNewProducts = () => {
  props.modelValue.push(...newProductsList.value);
  newProductsList.value = [];
  showNewProductsList.value = !showNewProductsList.value;
};

const cancelNewProducts = () => {
  newProductsList.value = [];
  showNewProductsList.value = !showNewProductsList.value;
};

const checkAdded = (id: string) => {
  return !!props.modelValue.find((item: any) => item.id === id);
};
</script>
<template>
  <section class="px-6">
    <div v-if="editMode" class="my-6 p-6 flex items-center gap-6 bg-white rounded-md">
      <div class="flex gap-4">
        <Button
          v-if="!showNewProductsList && eligibleProducts.length > 0"
          type="button"
          @click.prevent="showNewProducts"
        >
          <Plus class="w-6 h-6" />
          Adicionar Produtos
        </Button>
        <Button
          v-if="showNewProductsList"
          type="button"
          class="bg-green-500 hover:bg-green-600"
          @click.prevent="saveNewProducts"
        >
          Salvar
        </Button>
        <Button
          v-if="showNewProductsList"
          type="button"
          variant="ghost"
          @click.prevent="cancelNewProducts"
        >
          Cancelar
        </Button>
      </div>
      <p v-if="newProductsList.length" class="text-md text-zinc-500">
        Você adicionou <strong>{{ newProductsList.length }}</strong>
        {{ newProductsList.length === 1 ? 'novo produto' : 'novos produtos' }}
      </p>
      <p v-if="eligibleProducts.length === 0" class="text-md text-zinc-500">
        Não há mais produtos ativos para serem adicionados ao contrato.
      </p>
    </div>
    <div class="md:grid md:grid-cols-2 gap-4 items-start">
      <div
        v-for="product in editMode ? props.modelValue : enabledProducts"
        :key="product.id"
        class="p-6 flex flex-col gap-4 bg-white rounded-md"
      >
        <Checkbox
          id="terms"
          @update:checked="addProduct(product)"
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
            <p class="mb-8 font-bold border-b border-b-zinc-700">Editar valores</p>
            <div class="md:grid md:grid-cols-2 gap-4">
              <div>
                <Label for="basePrice">Valor Base</Label>
                <Input
                  type="text"
                  v-model="product.basePrice"
                  name="basePrice"
                  class="mt-2"
                  v-maska="'R$ 9#.99#,##'"
                  data-maska-tokens="9:[0-9]:repeated"
                  data-maska-reversed
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
                <Label for="includedHours">Km Adicional</Label>
                <Input
                  type="text"
                  v-model="product.kmPrice"
                  name="kmPrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Minuto Adicional</Label>
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
            <p class="mb-8 font-bold border-b border-b-zinc-700">Editar valores</p>
            <div class="md:grid md:grid-cols-2 gap-4">
              <div>
                <Label for="basePrice">Valor Base</Label>
                <Input
                  type="text"
                  v-model="product.basePrice"
                  name="basePrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Valor Km Adicional</Label>
                <Input
                  type="text"
                  v-model="product.kmPrice"
                  name="kmPrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Valor Minuto Adicional</Label>
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

      <!-- NEW PRODUCTS  -->
      <div
        v-if="showNewProductsList"
        v-for="product in eligibleProducts"
        :key="product.id"
        class="p-6 flex flex-col gap-4 bg-white rounded-md"
      >
        <Checkbox
          id="terms"
          @update:checked="addNewProduct(product)"
          :checked="!!newProductsList.find((item: any) => item.id === product.id)"
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
            <p class="mb-8 font-bold border-b border-b-zinc-700">Editar valores</p>
            <div class="md:grid md:grid-cols-2 gap-4">
              <div>
                <Label for="basePrice">Valor Base</Label>
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
                <Label for="includedHours">Km Adicional</Label>
                <Input
                  type="text"
                  v-model="product.kmPrice"
                  name="kmPrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Minuto Adicional</Label>
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
            <p class="mb-8 font-bold border-b border-b-zinc-700">Editar valores</p>
            <div class="md:grid md:grid-cols-2 gap-4">
              <div>
                <Label for="basePrice">Valor Base</Label>
                <Input
                  type="text"
                  v-model="product.basePrice"
                  name="basePrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Valor Km Adicional</Label>
                <Input
                  type="text"
                  v-model="product.kmPrice"
                  name="kmPrice"
                  class="mt-2"
                />
              </div>
              <div>
                <Label for="includedHours">Valor Minuto Adicional</Label>
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
