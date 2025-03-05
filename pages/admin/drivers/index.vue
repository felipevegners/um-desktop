<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, LoaderCircle, CircleCheck, ArrowUpDown } from 'lucide-vue-next';
import { createColumnHelper } from '@tanstack/vue-table';
import AddCarsForm from '~/components/admin/drivers/AddCarsForm.vue';
import { Button } from '@/components/ui/button';
import { userDriverStore } from '~/stores/admin/drivers.store';
import { storeToRefs } from 'pinia';
import DataTable from '@/components/shared/DataTable.vue';
import EditDeleteActions from '~/components/admin/drivers/EditDeleteActions.vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useToast } from "@/components/ui/toast/use-toast";
import FormSelect from '~/components/shared/FormSelect.vue';

const { toast } = useToast();

const driverStore = userDriverStore();
const { loadingData, drivers, loadingSend } = storeToRefs(driverStore);
const { getDriversAction, createNewDriverAction, deleteDriverAction } = driverStore;

definePageMeta({
	layout: 'admin'
});

useHead({
	title: "Motoristas ativos | Cadastrar novo motorista"
});

const showAddForm = ref<boolean>(false);
const driverCars = reactive([
	{ carModel: '', carColor: '', carPlate: '', carYear: '' },
]);

onMounted(async () => {
	await getDriversAction();
});

const toggleShowAddForm = () => {
	showAddForm.value = !showAddForm.value;
};

const handleDeleteDriver = async (id: string) => {
	await deleteDriverAction(id);
};

const columnHelper = createColumnHelper<any>();

const columns = [
	columnHelper.accessor('name', {
		enablePinning: true,
		header: ({ column }) => {
			return h(
				Button,
				{
					variant: 'ghost',
					onClick: () =>
						column.toggleSorting(column.getIsSorted() === 'asc'),
				},
				() => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
			);
		},
		cell: ({ row }) =>
			h('div', { class: 'capitalize' }, row.getValue('name')),
	}),
	columnHelper.accessor('email', {
		header: () => h('div', { class: 'text-left' }, 'E-mail'),
		cell: ({ row }) =>
			h('div', { class: 'lowercase' }, row.getValue('email')),
	}),
	columnHelper.accessor('phone', {
		header: () => h('div', { class: 'text-left' }, 'Celular'),
		cell: ({ row }) =>
			h('div', { class: 'capitalize' }, row.getValue('phone')),
	}),
	columnHelper.accessor('document', {
		header: () => h('div', { class: 'text-left' }, 'CPF'),
		cell: ({ row }) => {
			return h(
				'div',
				{ class: 'text-left font-medium' },
				row.getValue('document'),
			);
		},
	}),
	columnHelper.accessor('status', {
		header: () => h('div', { class: 'text-left' }, 'Status'),
		cell: ({ row }) => {
			const status = row.getValue('status');
			return h(
				'div',
				{
					class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${status === 'active' ? 'bg-green-600' : 'bg-red-600'
						}`,
				},
				status === 'active' ? 'Ativo' : 'Inativo',
			);
		},
	}),
	columnHelper.accessor('enabled', {
		header: () => h('div', { class: 'text-left' }, 'Acesso'),
		cell: ({ row }) => {
			const enabled = row.getValue('enabled');
			return h(
				'div',
				{
					class: `px-1 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${enabled === true ? 'bg-blue-600' : 'bg-zinc-600'
						}`,
				},
				enabled === true ? 'Permitido' : 'Negado',
			);
		},
	}),

	columnHelper.display({
		id: 'actions',
		enableHiding: false,
		header: () => h('div', { class: 'text-left' }, 'Ações'),
		cell: ({ row }) => {
			const driverData = row.original;
			return h(
				'div',
				{ class: 'relative text-left' },
				h(EditDeleteActions, {
					data: driverData,
					remove: handleDeleteDriver,
					formControl: toggleShowAddForm,
				}),
			);
		},
	}),
];

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const driverSchema = toTypedSchema(
	z.object({
		name: z.string().min(2).max(50),
		email: z.string().min(2).max(50),
		phone: z.string().min(2).max(50),
		document: z.string().min(2).max(50),
		driverLicense: z.string().min(2).max(50),
		status: z.string().min(2).max(50),
		picture: z
			.any()
			.refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
			.refine(
				(file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
				"Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos "
			),
		cnhCopy: z
			.any()
			.refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
			.refine(
				(file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
				"Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos "
			)
	})
);

const driversForm = useForm({
	validationSchema: driverSchema,
});

// Handling with Driver Files

const { handleFileInput, files: driverPicture } = useFileStorage()
const { handleFileInput: driverLicenseHandler, files: driverLicense } = useFileStorage()


const onSubmit = driversForm.handleSubmit(async (values) => {
	const driverFiles = [...driverPicture.value, ...driverLicense.value]
	const newDriverData = {
		driverCars,
		name: values.name,
		email: values.email,
		phone: values.phone,
		document: values.document,
		picture: driverPicture.value[0].name,
		driverLicense: values.driverLicense,
		driverFiles: { cnhCopy: driverLicense.value[0].name },
		rating: ["1"],
		history: [],
		status: values.status,
		enabled: true
	}
	try {
		await createNewDriverAction(newDriverData)
	} catch (error) {
		toast({
			title: "Oops!",
			class: "bg-red-600 border-0 text-white text-2xl",
			description: `Ocorreu um erro ${error} ao adicionar o motorista.`
		});
	} finally {
		showAddForm.value = !showAddForm.value;
		toast({
			title: "Sucesso!",
			class: "bg-green-600 border-0 text-white text-2xl",
			description: `O motorista ${values.name} foi cadastrado com sucesso!`
		});
		const submitFiles = await $fetch('/api/files', {
			method: 'POST',
			body: {
				files: driverFiles
			}
		})
		if (!submitFiles) {
			toast({
				title: "Oops!",
				class: "bg-red-600 border-0 text-white text-2xl",
				description: `Ocorreu um erro ${error} ao enviar os arquivos do motorista.`
			});
		}
		await getDriversAction()
	}

})
</script>

<template>
	<main class="p-6">
		<section class="mb-6 flex items-center gap-6">
			<h1 class="font-bold text-black text-3xl">Base de Motoristas</h1>
			<div>
				<Button @click="toggleShowAddForm">
					<Plus class="w-4 h-4" /> Cadastrar Motorista
				</Button>
			</div>
		</section>
		<section v-if="showAddForm" class="mb-4 py-4">
			<Card class="bg-zinc-200">
				<CardHeader>
					<CardTitle>Cadastrar novo motorista</CardTitle>
				</CardHeader>
				<CardContent>
					<form @submit="onSubmit">
						<h2 class="mt-4 mb-6 text-lg font-bold">
							Dados Pessoais
						</h2>
						<div class="mb-4 w-full grid grid-cols-3 gap-8">
							<FormField v-slot="{ componentField }" name="name">
								<FormItem>
									<FormLabel>Nome</FormLabel>
									<FormControl>
										<Input type="text" placeholder="ex.: João Silva" v-bind="componentField" />
									</FormControl>
									<FormMessage />
								</FormItem>
							</FormField>
							<FormField v-slot="{ componentField }" name="email">
								<FormItem>
									<FormLabel>E-mail</FormLabel>
									<FormControl>
										<Input type="text" placeholder="joao_silva@email.com.br" v-bind="componentField" />
									</FormControl>
									<FormMessage />
								</FormItem>
							</FormField>
							<FormField v-slot="{ componentField }" name="phone">
								<FormItem>
									<FormLabel>Celular</FormLabel>
									<FormControl>
										<Input type="text" placeholder="ex.: (11) 99876-5432" v-bind="componentField" />
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
										<Input type="text" placeholder="222.333.444-56" v-bind="componentField" />
									</FormControl>
									<FormMessage />
								</FormItem>
							</FormField>
							<FormField v-slot="{ componentField }" name="driverLicense">
								<FormItem class="col-span-1">
									<FormLabel>Número CNH</FormLabel>
									<FormControl>
										<Input type="text" placeholder="ex. 23456789019" v-bind="componentField" />
									</FormControl>
									<FormMessage />
								</FormItem>
							</FormField>
							<FormField v-slot="{ componentField }" name="status">
								<FormItem>
									<FormLabel>Status</FormLabel>
									<FormControl>
										<FormSelect v-bind="componentField" :items="[
											{ label: 'Ativo', value: 'active' },
											{ label: 'Inativo', value: 'inactive' },
										]" :label="'Selecione'" />
									</FormControl>
								</FormItem>
							</FormField>
						</div>
						<div class="mb-4 w-full grid grid-cols-3 gap-8"></div>
						<section class="my-10">
							<h2 class="mb-4 text-lg font-bold">
								Dados do(s) Veículo(s)
							</h2>
							<Separator class="mb-4" />
							<div class="grid grid-cols-3 gap-8">
								<AddCarsForm v-model="driverCars" class="col-span-3" />
							</div>
						</section>
						<section class="mt-6 mb-8">
							<h2 class="mb-4 text-lg font-bold">
								Enviar arquivos
							</h2>
							<div class="grid grid-cols-3 gap-6">
								<FormField v-slot="{ handleChange, handleBlur }" name="picture">
									<FormItem class="col-span-1">
										<FormLabel>Foto Pessoal</FormLabel>
										<FormDescription>*enviar foto de rosto com fundo
											claro e sem
											adereços</FormDescription>

										<FormControl>
											<Input id="picture" type="file" @change="handleChange" @blur="handleBlur"
												@input="handleFileInput" />
										</FormControl>
										<FormMessage />
									</FormItem>
								</FormField>
								<FormField v-slot="{ handleChange, handleBlur }" name="cnhCopy">
									<FormItem class="col-span-1">
										<FormLabel>Cópia CNH</FormLabel>
										<FormDescription>*enviar frente e
											verso</FormDescription>
										<FormControl>
											<Input id="cnhCopy" type="file" @change="handleChange" @blur="handleBlur"
												@input="driverLicenseHandler" />
										</FormControl>
										<FormMessage />
									</FormItem>
								</FormField>
							</div>
						</section>
						<section class="pt-8">
							<Button type="submit">
								<LoaderCircle v-if="loadingSend" class="w-10 h-10 animate-spin" />
								Cadastrar
							</Button>
							<Button variant="ghost" class="ml-4" @click.prevent="toggleShowAddForm">
								Cancelar
							</Button>
						</section>
					</form>
				</CardContent>
			</Card>
		</section>
		<section v-if="loadingData" class="p-10 flex items-center justify-center">
			<LoaderCircle class="w-10 h-10 animate-spin" />
		</section>
		<section v-else>
			<DataTable :columns="columns" :data="drivers" sortby="name" :columnPin="['name']" />
		</section>
	</main>
</template>

<style scoped></style>
