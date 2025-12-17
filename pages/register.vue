<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, Info, LoaderCircle, UserPlus } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { useAccountStore } from '~/stores/account.store';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

const { toast } = useToast();

const accountStore = useAccountStore();
const { registerUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

const driverStore = useDriverStore();
const { createNewDriverAction } = driverStore;

const route = useRoute();
const viewPassword = ref<boolean>(false);
const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};
const isLoading = ref<boolean>(false);
const userType = ref('');
userType.value = route?.query?.type as string;

useHead({
  title: `${userType.value === 'driver' ? 'Seja um motorista parceiro' : 'Nova conta de usuário'} | Urban Mobi`,
});

const registerType = {
  personal: 'platform-user',
  corporative: 'master-manager',
  driver: 'platform-driver',
};
const registerTypeTranslate = {
  personal: 'Pessoa Física',
  corporative: 'Corporativo',
  driver: 'Motorista Parceiro',
};

const termsTypeTranslate = computed(() => {
  //@ts-ignore
  return registerTypeTranslate[route?.query?.type];
});
const newAccountType = computed(() => {
  //@ts-ignore
  return registerType[route?.query?.type];
});

const formSchema = toTypedSchema(
  z.object({
    name: z.string({ message: 'Campo obrigatório' }).min(2, 'Mínimo 2 caracteres'),
    email: z.string().min(2, 'Insira um e-mail válido').email(),
    document: z.string().min(2, 'Insira um documento válido').max(18).optional(),
    password: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .max(8, 'Máximo de 8 caracteres'),
    phone: z.string({ message: 'Campo obrigatório' }),
    position: z.string().optional(),
    department: z.string().optional(),
    acceptTerms: z.boolean(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    acceptTerms: false,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    username: values.name,
    document: values.document,
    email: values.email,
    password: values.password,
    role: newAccountType.value || 'platform-user',
    enabled: true,
    status: 'pending',
    phone: values.phone,
    position: values.position || '',
    department: values.department || '',
    acceptTerms: values.acceptTerms,
    emailConfirmed: false,
    avatar: {
      name: '',
      url: '',
    },
    contract: {
      contractId: '-',
      name: '-',
      branchId: '-',
      area: '-',
    },
  };

  const newAccount: any = await registerUserAccountAction(accountData);

  if (newAccount.success) {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description:
        'Conta de Usuário cadastrado com sucesso. Acesse seu e-mail para prosseguir!',
    });
    setTimeout(() => {
      navigateTo('/registersuccess');
    }, 1000);
  } else {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: newAccount.error,
    });
  }
});
</script>
<template>
  <main class="bg-black min-h-screen">
    <section class="mx-auto lg:grid lg:grid-cols-2 lg:gap-6 h-full">
      <div
        class="p-10 lg:p-20 bg-black flex flex-col items-center lg:items-end justify-center bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat"
      >
        <img class="h-8 lg:h-14" src="/images/logo_horizontal_white.svg" alt="" />
      </div>
      <div class="p-10 lg:p-20 flex items-center max-w-xl mx-auto">
        <form
          @submit.prevent="onSubmit"
          @keydown.enter.prevent="true"
          class="mx-auto w-full"
          :validation-schema="formSchema"
        >
          <div class="flex flex-col gap-8 dark">
            <div class="space-y-4">
              <UserPlus class="text-um-primary" :size="32" />
              <h2 class="text-2xl md:text-3xl font-bold text-um-primary tracking-tight">
                {{
                  userType === 'driver'
                    ? 'Seja um motorista parceiro UM'
                    : 'Crie sua conta UM'
                }}
              </h2>
              <p v-if="userType === 'driver'" class="text-muted-foreground text-sm">
                Trabalhe com uma plataforma que valoriza seus parceiros, oferece
                segurança, atendimento diferenciado e suporte total online e offline.
              </p>
              <p v-else class="text-muted-foreground text-sm">
                Para realizarmos seu atendimento, insira seus dados abaixo. Você receberá
                um e-mail de confirmação. Leva apenas 2 minutos.
              </p>
            </div>
            <div class="flex flex-col gap-6 dark:text-white">
              <FormField v-slot="{ componentField, errorMessage }" name="name">
                <FormItem class="relative">
                  <FormLabel>Nome Completo*</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <!-- <FormMessage class="absolute left-0 text-xs text-red-200" /> -->
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem class="relative">
                  <FormLabel>Celular*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-bind="componentField"
                      v-maska="'(##) #####-####'"
                    />
                  </FormControl>
                  <!-- <FormMessage class="absolute right-0 text-xs" /> -->
                </FormItem>
              </FormField>
              <FormField
                v-if="userType === 'corporative'"
                v-slot="{ componentField }"
                name="document"
              >
                <FormItem class="relative">
                  <FormLabel>CNPJ*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-bind="componentField"
                      v-maska="'##.###.###/####-##'"
                    />
                  </FormControl>
                  <FormMessage class="absolute right-0 text-xs" />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="email">
                <FormItem class="relative dark">
                  <FormLabel>E-mail*</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage class="absolute right-0 text-xs" />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="password">
                <FormItem class="relative">
                  <FormLabel>Senha*</FormLabel>
                  <FormControl>
                    <div v-if="viewPassword" class="relative">
                      <Input
                        type="text"
                        placeholder="Insira a senha"
                        v-bind="componentField"
                        :disabled="isLoading"
                      />
                      <EyeOff
                        class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                        :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                        @click.prevent="revealPassword"
                      />
                    </div>
                    <div v-else class="relative">
                      <Input
                        type="password"
                        placeholder="Insira a sua senha"
                        v-bind="componentField"
                        :disabled="isLoading"
                      />
                      <Eye
                        class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                        :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                        @click.prevent="revealPassword"
                      />
                    </div>
                  </FormControl>
                  <FormMessage class="absolute right-0 text-xs" />
                  <small class="text-xs text-muted-foreground flex items-center gap-2">
                    <Info :size="14" />
                    A senha deve conter de 6 a 8 caracteres
                  </small>
                </FormItem>
              </FormField>
              <FormField v-slot="{ handleChange }" type="checkbox" name="acceptTerms">
                <FormItem
                  class="flex items-center gap-x-3 space-y-0 rounded-md border border-um-primary/30 p-4"
                >
                  <FormControl>
                    <Checkbox @update:checked="handleChange" />
                  </FormControl>
                  <div class="space-y-1 leading-none">
                    <FormLabel class="text-xs">
                      Declaro que li e aceito os

                      <Dialog>
                        <DialogTrigger as-child>
                          <span class="underline hover:text-um-primary cursor-pointer">
                            termos de uso da plataforma.
                          </span>
                        </DialogTrigger>
                        <DialogContent
                          class="max-w-[425px] lg:max-w-[700px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]"
                        >
                          <DialogHeader class="p-10 pb-0">
                            <DialogTitle class="text-center flex flex-col gap-2">
                              <h2>Termos de uso da plataforma Urban Mobi</h2>
                              <p class="text-sm text-muted-foreground">
                                Leia com atenção nossos termos de uso antes de criar sua
                                conta.
                              </p>
                            </DialogTitle>
                          </DialogHeader>
                          <div class="grid gap-4 py-4 overflow-y-auto px-8 text-justify">
                            <div class="flex flex-col gap-6 text-center text-sm">
                              <h2 class="text-2xl">{{ termsTypeTranslate }}</h2>
                              <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                Maecenas sed consequat risus. Nam ut purus velit. In hac
                                habitasse platea dictumst. Sed maximus, nisi et dignissim
                                fringilla, lorem felis euismod nisi, non interdum metus
                                dui ut velit. Vestibulum rhoncus purus turpis, nec
                                scelerisque nibh interdum ac. Aenean sodales vel ligula
                                vestibulum venenatis. Phasellus mauris ligula, porta sit
                                amet erat tincidunt, tempor tempor velit. Nunc aliquam
                                ante finibus, gravida sem fringilla, dignissim lacus.
                                Morbi ut convallis orci, nec lobortis nunc. Nullam
                                placerat odio eget gravida accumsan. Quisque vel
                                vestibulum erat. Donec tempus risus ut magna consequat
                                rhoncus. Proin sapien felis, hendrerit tristique
                                vestibulum id, vulputate a orci. Praesent scelerisque,
                                diam eu tincidunt vestibulum, lectus nisl accumsan metus,
                                vitae vestibulum erat lectus eu nulla. Phasellus fringilla
                                pellentesque magna, quis scelerisque risus dictum et.
                              </p>
                              <p>
                                Aliquam erat metus, aliquam sit amet rutrum in, porta nec
                                erat. Mauris et lorem sit amet odio eleifend iaculis
                                sollicitudin eget nibh. Fusce facilisis posuere nisi, at
                                lobortis dui pretium non. Vestibulum porttitor posuere
                                erat at tincidunt. Integer porttitor tellus nec accumsan
                                vestibulum. Nunc egestas nunc enim, ut convallis mauris
                                auctor eget. Sed sit amet ullamcorper nisi. Proin volutpat
                                erat ac euismod vulputate. Pellentesque habitant morbi
                                tristique senectus et netus et malesuada fames ac turpis
                                egestas. Maecenas eu nulla ut dui imperdiet fermentum.
                                Nulla sem tellus, posuere vel euismod vitae, vulputate non
                                urna. Donec sed diam lacus. Pellentesque eu arcu risus.
                                Praesent blandit nec ligula vel tincidunt. In hac
                                habitasse platea dictumst. Nulla volutpat tellus quis
                                pulvinar facilisis.
                              </p>
                              <p>
                                Fusce nec vehicula libero. Interdum et malesuada fames ac
                                ante ipsum primis in faucibus. Etiam bibendum augue non
                                vulputate placerat. Proin sollicitudin porta orci ut
                                imperdiet. Nulla placerat ligula eu nibh cursus, at
                                fringilla arcu vulputate. Sed in turpis quis neque gravida
                                aliquet malesuada mollis mi. Nulla maximus mi tellus, et
                                laoreet enim auctor eu. Vivamus a pharetra erat, id
                                laoreet neque. Donec tortor sapien, pharetra sed nibh ac,
                                pulvinar tincidunt purus. Etiam tincidunt semper luctus.
                                Sed dignissim, erat sed suscipit consectetur, ex urna
                                consectetur nisi, nec dictum massa urna ac elit. In eget
                                neque et metus vehicula sagittis vitae ac diam. Nunc
                                placerat erat elit, quis dapibus libero consequat in. In
                                sed diam massa. Duis pharetra pretium augue, ac faucibus
                                erat tristique sed. Aenean vehicula scelerisque ante, ac
                                tristique ligula fermentum nec.
                              </p>
                              <p>
                                Vivamus a rutrum orci. Sed fermentum enim sit amet iaculis
                                tempus. Praesent vestibulum purus ac quam pellentesque
                                vulputate. Sed dolor enim, placerat a ligula sed, lacinia
                                bibendum massa. Ut id fringilla urna, ac consectetur
                                libero. Nulla massa dolor, sodales at mattis sed, suscipit
                                nec risus. Suspendisse et accumsan odio. Orci varius
                                natoque penatibus et magnis dis parturient montes,
                                nascetur ridiculus mus. In tristique elit lorem, eu
                                iaculis nulla consequat auctor. Duis scelerisque non
                                mauris eu cursus.
                              </p>
                            </div>
                          </div>
                          <DialogFooter class="p-6 pt-0">
                            <DialogClose as-child class="mx-auto">
                              <Button type="button" variant="outline"> Fechar </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              </FormField>
            </div>
            <Button
              :disabled="!form.values.acceptTerms"
              class="mt-4 w-full h-[48px] bg-um-primary hover:bg-gradient-to-t from-um-primary to-black/20 text-black uppercase font-bold"
              type="submit"
              variant="ghost"
            >
              <LoaderCircle v-if="isLoadingSend" class="animate-spin" :size="24" />
              Criar conta
            </Button>
            <div class="flex items-center justify-center gap-1 text-muted-foreground">
              <small>Já possui uma conta?</small>
              <NuxtLink
                class="text-xs hover:text-um-primary hover:underline"
                :href="'/auth/login'"
              >
                Acesse aqui.
              </NuxtLink>
            </div>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped></style>
