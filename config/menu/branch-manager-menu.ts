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

export const branchManagerMenu = {
  title: 'Painel Gestor Filial',
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
          url: '/corporative/rides/open',
        },
        {
          title: 'Finalizados',
          url: '/corporative/rides/completed',
        },
        {
          title: 'Cancelados',
          url: '/corporative/rides/cancelled',
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
          title: 'Filiais Ativas',
          url: '/corporative/branches/active',
        },
        {
          title: 'Filiais Inativas',
          url: '/corporative/branches/inactive',
        },
        {
          title: '+ Cadastrar Filial',
          url: '/corporative/branches/new',
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
          title: 'Usuários cadastrados',
          url: '/corporative/accounts/active',
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
      isActive: route.path.startsWith('invoices'),
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
