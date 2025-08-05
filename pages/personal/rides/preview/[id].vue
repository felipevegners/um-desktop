<script setup lang="ts">
import { SharedBackLink } from '#components';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  CalendarDays,
  LoaderCircle,
  SquareCheck,
  SquareDot,
  SquareSquare,
  X,
} from 'lucide-vue-next';
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

      <Button @click="toggleCancelationModal" type="button" variant="destructive">
        <X />
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
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Código</p>
              <p class="text-xl font-bold">{{ ride?.code }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Status</p>
              <RideStatusFlag :ride-status="ride.status" />
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Data</p>
              <p class="text-xl font-bold">
                {{ new Date(ride.travel.date as string).toLocaleDateString('pt-BR') }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Hora Partida</p>
              <p class="text-xl font-bold">{{ ride?.travel.departTime }}HS</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Passageiros</p>
              <p class="text-xl font-bold">{{ ride?.travel.passengers }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5 space-y-2">
              <p class="text-sm text-zinc-600">Origem</p>
              <p class="text-xl font-bold flex items-center gap-2">
                <SquareDot />
                {{ ride?.travel.originAddress }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5 space-y-2">
              <p class="text-sm text-zinc-600">Paradas</p>
              <div
                v-if="ride?.travel.stops.length"
                v-for="(stop, index) in ride?.travel.stops"
                class="mt-3"
              >
                <p class="font-normal">Parada {{ index + 1 }}</p>
                <p class="text-xl font-bold flex items-center gap-2">
                  <SquareSquare />
                  {{ stop.address }}
                </p>
              </div>
              <div v-else class="mt-3">
                <p class="font-bold">Não há paradas neste percurso.</p>
              </div>
            </div>
            <div class="p-6 bg-white rounded-md col-span-5 space-y-2">
              <p class="text-sm text-zinc-600">Destino</p>
              <p class="text-xl font-bold flex items-center gap-2">
                <SquareCheck />
                {{ ride?.travel.destinationAddress }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Distância</p>
              <p class="text-xl font-bold">{{ ride?.travel.distance }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Duração</p>
              <p class="text-xl font-bold">{{ ride?.travel.duration }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Serviço Contratado</p>
              <p class="text-xl font-bold">
                <SharedProductTag
                  :label="ride?.product.name"
                  :type="ride?.product.name"
                />
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Valor total</p>
              <p class="text-xl font-bold">{{ currencyFormat(ride?.price) }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Pagamento</p>
              <SharedPaymentStatusFlag :payment-status="ride?.billing.status" />
              <p class="text-base font-bold">
                {{
                  ride?.billing.paymentMethod === 'creditcard'
                    ? 'Cartão de Crédito'
                    : ride?.billing.paymentMethod === 'pix'
                      ? 'À Vista - PIX'
                      : ride?.billing.paymentMethod === 'cielo'
                        ? 'Cartão de Crédito'
                        : 'Faturamento Corp.'
                }}
              </p>
              <p v-if="ride?.billing.installments">
                Parcelado {{ ride.billing.installments }}x
              </p>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Dados do Motorista</h2>
          <div class="md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md col-span-2 space-y-2">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ ride?.driver.name || 'Sem motorista' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Celular</p>
              <p class="text-xl font-bold">{{ ride?.driver.phone || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Veículo</p>
              <p class="text-xl font-bold">{{ ride?.driver?.car?.model || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-4 space-y-2">
              <p class="text-sm text-zinc-600">Observações ao Motorista</p>
              <p class="text-xl font-bold">{{ ride?.observations || '-' }}</p>
            </div>
          </div>
        </section>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Agendado por</h2>
          <div class="md:grid md:grid-cols-3 md:gap-6">
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ ride?.dispatcher.user || '-' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
              <p class="text-sm text-zinc-600">E-mail</p>
              <p class="text-xl font-bold">{{ ride?.dispatcher.email || '-' }}</p>
            </div>
            <div class="p-6 bg-white rounded-md space-y-2">
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
