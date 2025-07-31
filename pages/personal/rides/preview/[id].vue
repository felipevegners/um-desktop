<script setup lang="ts">
import { SharedBackLink } from '#components';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { CalendarDays, LoaderCircle, X } from 'lucide-vue-next';
import { currencyFormat } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: 'Visualizar Atendimento | Urban Mobi',
});

const { toast } = useToast();
const route = useRoute();
const ridesStore = useRidesStore();
const { getRideByIdAction, updateRideAction } = ridesStore;
const { ride, loadingData } = storeToRefs(ridesStore);

const showCancelationModal = ref<boolean>(false);

const toggleCancelationModal = () => {
  showCancelationModal.value = !showCancelationModal.value;
};

const cancelRide = async () => {
  const payload = {
    ...ride?.value,
    status: 'cancelled',
  };
  try {
    await updateRideAction(payload);
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao cancelar o atendimento. Tente novamente.`,
      variant: 'destructive',
    });
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Atendimento cancelado com sucesso!`,
    });
    navigateTo('/personal/rides/open');
  }
};

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

      <AlertDialog :open="showCancelationModal">
        <AlertDialogContent class="flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deseja cancelar o atendimento {{ ride?.code }}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>AVISO:</strong> O estorno do pagamento será processado em até 3 dias
              úteis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter class="mt-10">
            <AlertDialogCancel @click="toggleCancelationModal">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction class="bg-red-500 hover:bg-red-600" @click="cancelRide">
              <LoaderCircle v-if="loadingData" class="animate-spin" />
              Cancelar Atendimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        @click="toggleCancelationModal"
        type="button"
        variant="destructive"
        class="p-6"
      >
        <X :size="18" />
        Cancelar Atendimento
      </Button>
    </section>
    <section v-if="loadingData" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="animate-spin" />
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
              <RideStatusFlag :ride-status="ride.status" />
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="text-xl font-bold">
                {{ new Date(ride.travel.date as string).toLocaleDateString('pt-BR') }}
              </p>
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
              <p class="text-xl font-bold">
                {{ ride?.driver.name || 'Sem motorista' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Celular</p>
              <p class="text-xl font-bold">{{ ride?.driver.phone || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Veículo</p>
              <p class="text-xl font-bold">{{ ride?.driver?.car?.model || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-4">
              <p class="text-sm text-zinc-600">Observações ao Motorista</p>
              <p class="text-xl font-bold">{{ ride?.observations || '-' }}</p>
            </div>
          </div>
        </section>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Agendado por</h2>
          <div class="md:grid md:grid-cols-3 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ ride?.dispatcher.user || '-' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">E-mail</p>
              <p class="text-xl font-bold">{{ ride?.dispatcher.email || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="text-xl font-bold">{{ ride?.dispatcher.dispatchDate || '-' }}</p>
            </div>
          </div>
        </section>
      </Card>
      <!-- <pre>{{ ride }}</pre> -->
    </section>
  </main>
</template>

<style scoped></style>
