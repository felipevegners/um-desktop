import {
  Building2,
  CalendarDays,
  Coins,
  HandCoins,
  Headset,
  User,
  UserCog,
} from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;
const route = useRoute();

export const platformAdminMenu = {
  title: 'Painel Admin Filial',
  user: {
    name: user.username,
    company: user.role,
    email: user.email,
    avatar: '',
  },
  navMain: [
    {
      title: 'Atendimentos',
      url: '',
      icon: CalendarDays,
      isActive: route.path.startsWith('rides'),
      items: [
        {
          title: 'Abertos',
          url: '/corporative/rides/active',
        },
        {
          title: 'Realizados',
          url: '/corporative/rides/completed',
        },
        {
          title: 'Cancelados',
          url: '/corporative/rides/canceled',
        },
        {
          title: '+ Novo agendamento',
          url: '/corporative/rides/new',
        },
      ],
    },
    {
      title: 'Gerenciar Filiais',
      url: '#',
      icon: Building2,
      isActive: route.path.startsWith('branches'),
      items: [
        {
          title: 'Editar Filial',
          url: '/corporative/branches/edit',
        },
      ],
    },
    {
      title: 'Usuários',
      url: '#',
      icon: User,
      isActive: route.path.startsWith('accounts'),
      items: [
        {
          title: 'Usuários da Filial',
          url: '/corporative/accounts',
        },
        {
          title: 'Restrições de Usuários',
          url: '/corporative/accounts/restrictions',
        },
      ],
    },
    {
      title: 'Financeiro',
      url: '#',
      icon: HandCoins,
      isActive: false,
      items: [
        {
          title: 'Faturas em aberto',
          url: '/corporative/invoices/active',
        },
        {
          title: 'Faturas canceladas',
          url: '/corporative/invoices/canceled',
        },
      ],
    },
  ],
  settings: [
    {
      name: 'Budget',
      url: '/corporative/budget',
      icon: Coins,
    },
    {
      name: 'Gerenciar Acessos',
      url: '/corporative/accounts',
      icon: UserCog,
    },
  ],
  sac: [
    {
      name: 'Fale Conosco',
      url: '#',
      icon: Headset,
    },
  ],
};
