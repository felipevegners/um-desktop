<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import { WPP_API } from '@/config/paths';
import {
  Car,
  Check,
  Edit,
  Eye,
  File,
  FileWarning,
  Info,
  LoaderCircle,
  MessageCircleMore,
} from 'lucide-vue-next';
import { dateFormat, sanitizePhone } from '~/lib/utils';
import { useDriverStore } from '~/stores/drivers.store';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: `Backoffice - Visualizar Motorista | Urban Mobi`,
});

const driverStore = useDriverStore();
const { getDriverByIdAction } = driverStore;
const { loadingData, driver } = storeToRefs(driverStore);

const route = useRoute();
await getDriverByIdAction(route.params.id as string);
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Car :size="24" />
        Detalhes do Motorista
        <p
          class="px-2 text-white font-bold text-lg uppercase rounded-md"
          :class="`${driver?.enabled ? 'bg-green-600' : 'bg-red-600'}`"
        >
          {{ driver?.enabled ? 'Ativo' : 'Inativo' }}
        </p>
      </h1>
      <Button
        @click="
          navigateTo({
            name: 'admin-drivers-edit-id',
            //@ts-ignore
            params: { id: driver?.id },
          })
        "
      >
        <Edit class="w-4 h-4" />
        Editar Motorista
      </Button>
    </section>
    <section
      v-if="loadingData"
      class="min-h-[300px] flex items-center justify-center bg-zinc-200"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div class="mb-6 flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold">Dados Pessoais</h2>
          <div class="p-6 flex justify-between bg-white rounded-md">
            <article class="flex flex-col items-start gap-4">
              <small class="text-zinc-600">Situação do Cadastro</small>
              <div class="flex items-center gap-4">
                <p
                  class="p-2 rounded-md font-bold uppercase inline-block text-white"
                  :class="`${driver?.status === 'validated' ? 'bg-green-600' : 'bg-yellow-500'}`"
                >
                  {{ driver?.status === 'validated' ? 'Validado' : 'Pendente' }}
                </p>
                <p
                  v-if="driver?.accept_terms === false"
                  class="flex items-center gap-2 text-red-800"
                >
                  <Info :size="18" />
                  O motorista ainda não aceitou os termos de uso.
                </p>
              </div>
            </article>
            <article class="flex flex-col items-center gap-4">
              <small class="text-zinc-600">Data do Cadastro</small>
              <div class="flex items-center gap-4">
                <p class="font-bold">
                  {{ dateFormat(driver?.createdAt) }}
                </p>
              </div>
            </article>
          </div>
          <div class="flex gap-6">
            <div class="p-6 bg-white rounded-md">
              <div class="flex gap-4">
                <NuxtImg
                  :src="driver?.driverFiles?.picture.url"
                  loading="lazy"
                  placeholder="/images/no-avatar.png"
                  class="w-[200px] h-[240px] object-cover"
                  v-slot="{ src, isLoaded, imgAttrs }"
                  preload
                  :custom="true"
                >
                  <img v-if="isLoaded" v-bind="imgAttrs" :src="src" />
                  <div v-else class="rounded-md flex items-center justify-center">
                    <img v-bind="imgAttrs" src="/images/no-avatar.png" />
                  </div>
                </NuxtImg>
                <div class="flex flex-col items-start gap-4">
                  <article>
                    <small class="text-zinc-600">Nome</small>
                    <p class="text-xl font-bold">
                      {{ driver?.name }}
                    </p>
                  </article>
                  <article>
                    <small class="text-zinc-600">E-mail</small>
                    <p>
                      {{ driver?.email }}
                    </p>
                  </article>
                  <article>
                    <small class="text-zinc-600">Celular</small>
                    <a
                      :href="
                        WPP_API.replace(
                          '[[phone]]',
                          sanitizePhone(driver?.phone as string),
                        )
                      "
                      class="flex items-center gap-2"
                      target="_blank"
                    >
                      {{ driver?.phone }}
                      <MessageCircleMore :size="18" class="text-green-500" />
                    </a>
                  </article>
                  <div class="flex gap-6">
                    <article>
                      <small class="text-zinc-600">CNH / Categoria</small>
                      <p>{{ driver?.driverLicense }} - {{ driver?.licenseCategory }}</p>
                    </article>
                    <article>
                      <small class="text-zinc-600">Validade CNH</small>
                      <p>
                        {{ driver?.licenseExpiration }}
                      </p>
                    </article>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-6 bg-white rounded-md flex-1">
              <article>
                <small class="text-zinc-600">Endereço</small>
                <p class="text-xl font-bold">
                  {{ driver?.address.streetName }}, {{ driver?.address.streetNumber }}
                  {{ driver?.address.complement ? driver?.address.complement : '' }}
                  {{ driver?.address.neighborhood }}
                </p>
              </article>
              <article>
                <small class="text-zinc-600">Cidade / Estado</small>
                <p class="text-xl font-bold">
                  {{ driver?.address.city }} - {{ driver?.address.state }}
                </p>
              </article>
              <article>
                <small class="text-zinc-600">CEP</small>
                <p class="text-xl font-bold">
                  {{ driver?.address.zipcode }}
                </p>
              </article>
              <article>
                <small class="text-zinc-600">Área de Atuação</small>
                <p class="text-xl font-bold">{{ driver?.actuationArea }} KMs</p>
              </article>
            </div>
          </div>
        </div>
        <div class="mb-6 flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold">Documentos Enviados</h2>
          <div class="p-6 bg-white rounded-md">
            <ul class="w-full">
              <li class="mb-2 p-4 bg-white border border-zinc-300 rounded-md">
                <div class="flex gap-2 items-center justify-between">
                  <div class="flex gap-2">
                    <File class="w-5 h-5 text-zinc-700" />
                    <p>
                      Cópia CNH:
                      <span class="text-zinc-500 underline">{{
                        driver?.driverFiles?.cnhCopy?.name
                      }}</span>
                    </p>
                    <Check
                      v-if="driver?.driverFiles?.cnhCopy?.name"
                      class="w-5 h-5 text-green-500"
                    />
                  </div>
                  <div class="flex items-center gap-4 border-separate">
                    <small class="text-small">Ações:</small>
                    <a
                      v-if="driver?.driverFiles?.cnhCopy?.name"
                      target="_blank"
                      :href="driver?.driverFiles.cnhCopy.url"
                      alt="Visualizar"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Eye class="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <p>Ver documento</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </a>
                  </div>
                </div>
              </li>
              <li class="mb-2 p-4 bg-white border border-zinc-300 rounded-md">
                <div class="flex gap-2 items-center justify-between">
                  <div class="flex gap-2">
                    <File class="w-5 h-5 text-zinc-700" />
                    <p>
                      Comprovante de Endereço:
                      <span class="text-zinc-500 underline">{{
                        driver?.driverFiles?.addressCopy?.name
                      }}</span>
                    </p>
                    <Check
                      v-if="driver?.driverFiles?.addressCopy?.name"
                      class="w-5 h-5 text-green-500"
                    />
                  </div>
                  <div class="flex items-center gap-4 border-separate">
                    <small class="text-small">Ações:</small>
                    <a
                      v-if="driver?.driverFiles?.addressCopy?.name"
                      target="_blank"
                      :href="driver?.driverFiles.addressCopy.url"
                      alt="Visualizar"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Eye class="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <p>Ver documento</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </a>
                  </div>
                </div>
              </li>
              <li class="mb-2 p-4 bg-white border border-zinc-300 rounded-md">
                <div class="flex gap-2 items-center justify-between">
                  <div class="flex gap-2">
                    <File class="w-5 h-5 text-zinc-700" />
                    <p>
                      Comprovante Bancário:
                      <span class="text-zinc-500 underline">{{
                        driver?.driverFiles?.bankCopy?.name
                      }}</span>
                    </p>
                    <Check
                      v-if="driver?.driverFiles?.bankCopy?.name"
                      class="w-5 h-5 text-green-500"
                    />
                  </div>
                  <div class="flex items-center gap-4 border-separate">
                    <small class="text-small">Ações:</small>
                    <a
                      v-if="driver?.driverFiles?.bankCopy?.name"
                      target="_blank"
                      :href="driver?.driverFiles.bankCopy.url"
                      alt="Visualizar"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Eye class="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <p>Ver documento</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="mb-6 flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold">Veículos Cadastrados</h2>
          <div class="md:grid md:grid-cols-2 gap-6">
            <article v-for="car in driver?.driverCars" :key="car.carPlate">
              <div class="p-6 flex items-start justify-between bg-white rounded-md">
                <div>
                  <small class="text-zinc-600">Marca / Modelo / Ano</small>
                  <p class="text-xl font-bold">{{ car.carModel }} - {{ car.carYear }}</p>
                  <small class="text-zinc-600">Cor</small>
                  <p class="text-xl font-bold">
                    {{ car.carColor }}
                  </p>
                  <div class="flex flex-col items-start gap-1">
                    <small class="text-zinc-600">Placa</small>
                    <p
                      class="p-2 text-xl font-bold border border-zinc-900 uppercase font-mono inline-block rounded-md tracking-wider"
                    >
                      {{ car.carPlate }}
                    </p>
                  </div>
                </div>
                <Button
                  v-if="car.carDocumentFile.url !== ''"
                  type="button"
                  @click="
                    navigateTo(`${car.carDocumentFile.url}`, {
                      external: true,
                      open: { target: '_blank' },
                    })
                  "
                >
                  <Eye />
                  Ver Documento
                </Button>
                <div
                  v-else
                  class="p-2 flex flex-col items-center border border-zinc-900 rounded-md"
                >
                  <FileWarning />
                  <small class="uppercase">sem documento</small>
                </div>
              </div>
            </article>
          </div>
        </div>
        <div class="mb-6 flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold">Configurações</h2>
          <div class="flex items-start gap-6">
            <div class="p-6 flex items-start justify-between bg-white rounded-md">
              <article class="flex items-center gap-6">
                <p class="font-bold">Agenda Aberta?</p>
                <p
                  class="p-2 rounded-md text-white text-md uppercase text-center"
                  :class="`${driver?.scheduleOpen ? 'bg-green-600' : 'bg-red-500'}`"
                >
                  {{ driver?.scheduleOpen ? 'sim' : 'não' }}
                </p>
              </article>
            </div>
            <div class="p-6 flex items-start justify-between bg-white rounded-md">
              <article class="flex items-center gap-6">
                <p class="font-bold">Atuando Fora da Área?</p>
                <p
                  class="p-2 rounded-md text-white text-md uppercase text-center"
                  :class="`${driver?.outsideActuation ? 'bg-green-600' : 'bg-red-500'}`"
                >
                  {{ driver?.outsideActuation ? 'sim' : 'não' }}
                </p>
              </article>
            </div>
          </div>
        </div>
        <div class="mb-6 flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold">Histórico</h2>
          <div class="p-6 flex items-start justify-between bg-white rounded-md">
            <p>Nenhum histórico encontrado.</p>
          </div>
        </div>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
