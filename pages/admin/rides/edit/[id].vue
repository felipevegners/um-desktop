<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import DatePicker from '@/components/shared/DatePicker.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useContractsStore } from '@/stores/contracts.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  CalendarDate,
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from '@internationalized/date';
import { CalendarDays, Waypoints, X } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { GoogleMap, Marker, Polyline } from 'vue3-google-map';
import { useAccountStore } from '~/stores/account.store';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Backoffice - Editar Atendimento | Urban Mobi',
});
const { toast } = useToast();
const { data } = useAuth();
const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction } = ridesStore;
const { ride } = storeToRefs(ridesStore);

const accountStore = useAccountStore();
const { getUsersAccountsAction } = accountStore;
const { accounts } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

await getRideByIdAction(route?.params?.id as string);

const loadingProducts = ref<boolean>(false);
const loadingRoute = ref<boolean>(false);
const availableUsers = ref();
const showAvailableProducts = ref<boolean>(true);
const availableProducts = ref<any>([]);
const selectedProduct = ref<any>();
const travelDate = ref<any>();
const originCoords = ref<any>({
  lat: '',
  lng: '',
});
const originLocationDetails = ref<any>({
  address: '',
  url: '',
});
const destinationCoords = ref<any>({
  lat: '',
  lng: '',
});
const destinationLocationDetails = ref<any>({
  address: '',
  url: '',
});

onBeforeMount(async () => {
  await getUsersAccountsAction();
  const filteredUsers = accounts.value.filter(
    (user: any) => user.enabled === true && user.role !== 'admin',
  );
  availableUsers.value = filteredUsers.map((user: any) => {
    return {
      label: user.username,
      value: user.id,
    };
  });

  await getContractByIdAction(ride?.value.billing.contractId);
  availableProducts.value = contract?.value.products;
  selectedProduct.value = { id: ride?.value?.product?.id };
  const splitDate = ride?.value.travel.date.split('/').reverse();
  const dateNumbers = splitDate.map((str: string) => Number(str));
  travelDate.value = new CalendarDate(dateNumbers[0], dateNumbers[1], dateNumbers[2]);
});

// const df = new DateFormatter('pt-BR', {
//   dateStyle: 'short',
// });

const setSelectedProduct = (value: any) => {
  selectedProduct.value = value;
};

// Set the location based on the place selected
const setOriginPlace = (place: any) => {
  originCoords.value.lat = place.geometry.location.lat();
  originCoords.value.lng = place.geometry.location.lng();
  // Update the location details
  originLocationDetails.value.address = place.formatted_address;
  originLocationDetails.value.url = place.url;
  form.setValues({
    origin: place.formatted_address,
  });
};
// Set the location based on the place selected
const setDestinationPlace = (place: any) => {
  destinationCoords.value.lat = place.geometry.location.lat();
  destinationCoords.value.lng = place.geometry.location.lng();
  // Update the location details
  destinationLocationDetails.value.address = place.formatted_address;
  destinationLocationDetails.value.url = place.url;
  form.setValues({
    destination: place.formatted_address,
  });
};

const form = useForm({
  validationSchema: '',
  keepValuesOnUnmount: true,
  initialValues: {
    user: ride?.value.user.id,
    reason: ride?.value.reason,
    passengers: ride?.value.travel.passengers,
    departTime: ride?.value.travel.departTime,
    origin: ride?.value.travel.originAddress,
    destination: ride?.value.travel.destinationAddress,
  },
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays class="w-6 h-6" />
        Editar Atendimento
      </h1>
      <div class="flex gap-10 items-center">
        <Button variant="destructive" @click=""> <X class="w-4 h-4" /> Cancelar </Button>
      </div>
    </section>
    <form @submit.prevent="" @keydown.enter.prevent="true">
      <Card class="py-6 bg-zinc-200">
        <CardHeader>
          <CardTitle>Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="md:grid md:grid-cols-2 gap-6">
            <!-- COLUNA DE DADOS -->
            <div class="flex flex-col gap-6">
              <div class="md:grid md:grid-cols-2 gap-6">
                <FormField v-slot="{ componentField }" name="user">
                  <FormItem>
                    <FormLabel>Selecione o Usuário*</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="availableUsers"
                        :label="'Selecione'"
                        @on-select=""
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
              <div v-if="showAvailableProducts">
                <LoaderCircle v-if="loadingProducts" class="animate-spin" />
                <div v-else>
                  <label class="text-sm font-medium">Selecione o Produto*</label>
                  <ul class="mt-2 flex justify-evenly gap-4">
                    <li
                      class="w-full"
                      v-for="product in availableProducts"
                      :key="product.id"
                    >
                      <article
                        class="p-4 flex items-center justify-start gap-4 bg-white rounded-md border border-zinc-900"
                      >
                        <Checkbox
                          @update:checked="setSelectedProduct(product)"
                          :checked="selectedProduct?.id === product.id"
                        />
                        <div
                          class="font-normal uppercase flex items-center justify-start gap-2"
                        >
                          <div
                            class="w-[50px] h-[50px] rounded-md bg-zinc-200 bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
                            :style="{ backgroundImage: `url(${product.image?.url})` }"
                          />
                          <small
                            class="px-2 py-1 uppercase text-white text-center rounded-md"
                            :class="`${product.type === 'contract' ? 'bg-zinc-800' : product.type === 'free-km' ? 'bg-orange-400' : 'bg-purple-400'}`"
                          >
                            {{ product.code }}
                          </small>
                          <small>{{ product.name }}</small>
                          <div class="flex items-center justify-start">
                            <Users :size="14" />
                            <small class="ml-1 font-bold">{{ product.capacity }}</small>
                          </div>
                        </div>
                      </article>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                v-if="selectedProduct"
                class="p-6 flex flex-col items-start gap-6 border border-zinc-900 rounded-md"
              >
                <CardTitle>Dados da Viagem</CardTitle>
                <div class="flex flex-col gap-6 w-full">
                  <div class="md:grid md:grid-cols-2 gap-6">
                    <FormField v-slot="{ componentField }" name="reason">
                      <FormItem>
                        <FormLabel>Motivo / Justificativa</FormLabel>
                        <FormControl>
                          <Input type="text" v-bind="componentField" />
                        </FormControl>
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="passengers">
                      <FormItem>
                        <FormLabel>Nº Passageiros*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            v-bind="componentField"
                            :max="selectedProduct.capacity"
                          />
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </div>
                  <div class="flex items-center gap-6">
                    <div class="flex flex-col">
                      <label class="mb-2 text-sm font-medium">Data*</label>
                      <DatePicker v-model="travelDate" />
                    </div>
                    <div class="flex items-end gap-4">
                      <FormField v-slot="{ componentField }" name="departTime">
                        <FormItem class="md:min-w-[200px]">
                          <FormLabel>Hora da Partida</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              v-bind="componentField"
                              v-maska="'##:##'"
                            />
                          </FormControl>
                        </FormItem>
                      </FormField>
                    </div>
                  </div>
                  <FormField v-slot="{ componentField, value }" name="origin">
                    <FormItem>
                      <FormLabel>Origem*</FormLabel>
                      <FormControl>
                        <div class="flex flex-col items-start gap-2">
                          <div class="flex items-center w-full gap-2">
                            <SquareDot />
                            <GMapAutocomplete
                              placeholder="Insira a Origem"
                              @place_changed="setOriginPlace"
                              v-bind="componentField"
                              :value="value"
                              id="originField"
                              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField, value }" name="destination">
                    <FormItem>
                      <FormLabel>Destino*</FormLabel>
                      <FormControl>
                        <div class="flex items-center gap-2">
                          <SquareSquare />
                          <GMapAutocomplete
                            placeholder="Insira o Destino"
                            @place_changed="setDestinationPlace"
                            v-bind="componentField"
                            :value="value"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
                <Button type="button" @click.prevent="">
                  <LoaderCircle v-if="loadingRoute" class="animate-spin" />
                  <Waypoints v-else />
                  {{
                    form.values.origin !== ride.travel.originAddress ||
                    form.values.destination !== ride.travel.destinationAddress
                      ? 'Calcular Nova Rota'
                      : 'Calcular Rota'
                  }}
                </Button>
              </div>
            </div>
            <!-- COLUNA MAPA E ROTA -->
            <div>
              <pre class="max-w-[500px]">{{ ride }}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  </main>
</template>

<style scoped></style>
