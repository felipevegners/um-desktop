<script setup lang="ts">
import { SharedBackLink } from '#components';
import { CalendarDays, X } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Visualizar Atendimento | Urban Mobi',
});

const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

onBeforeMount(async () => {
  await getRideByIdAction(route.params.id as string);
});
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays :size="24" />
        Detalhes do Atendimento - #{{ ride?.code }}
      </h1>
      <Button @click="">
        <X :size="18" />
        Cancelar Atendimento
      </Button>
    </section>
    <section v-if="loadingData" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <div class="mb-6 md:grid md:grid-cols-5 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Código</p>
              <p class="text-xl font-bold">{{ ride?.code }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Status</p>
              <p
                class="mt-3 px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs uppercase w-fit"
                :class="`${ride?.status === 'created' ? 'bg-blue-600' : ride?.status === 'accepted' ? 'bg-green-600' : ride?.status === 'completed' ? 'bg-zinc-900' : 'bg-red-600'}`"
              >
                {{
                  ride?.status === 'created'
                    ? 'Agendada'
                    : ride?.status === 'accepted'
                      ? 'Confirmada'
                      : ride?.status === 'completed'
                        ? 'Realizada'
                        : 'Cancelada'
                }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="text-xl font-bold">{{ ride?.travel.date }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Hora Partida</p>
              <p class="text-xl font-bold">{{ ride?.travel.departTime }}HS</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Passageiros</p>
              <p class="text-xl font-bold">{{ ride?.travel.passengers }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5">
              <p class="text-sm text-zinc-600">Origem</p>
              <p class="text-xl font-bold">{{ ride?.travel.originAddress }}</p>
            </div>

            <div class="p-6 bg-white rounded-md col-span-5">
              <p class="text-sm text-zinc-600">Destino</p>
              <p class="text-xl font-bold">{{ ride?.travel.destinationAddress }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Distância</p>
              <p class="text-xl font-bold">{{ ride?.travel.distance }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Duração</p>
              <p class="text-xl font-bold">{{ ride?.travel.duration }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Serviço Contratado</p>
              <p class="text-xl font-bold">
                {{ ride?.product.code }} {{ ride?.product.name }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Custo</p>
              <p class="text-xl font-bold">{{ currencyFormat(ride?.price) }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Pagamento</p>
              <p class="text-base font-bold">
                {{
                  ride?.billing.paymentMethod === 'creditcard'
                    ? 'Cartão de Crédito'
                    : ride?.billing.paymentMethod === 'pix'
                      ? 'À Vista - PIX'
                      : 'Faturamento Corp.'
                }}
              </p>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Dados do Motorista</h2>
          <div class="md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md col-span-2">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">{{ ride?.driver.name || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Celular</p>
              <p class="text-xl font-bold">{{ ride?.driver.phone }}</p>
            </div>
          </div>
        </section>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
