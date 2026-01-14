import { Building2, CalendarDays, HandCoins, Headset, User } from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;
const route = useRoute();

export const branchManagerMenu: any = {
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
      ],
    },
    {
      title: 'Usuários',
      url: '#',
      icon: User,
      isActive: route.path.startsWith('accounts'),
      items: [
        {
          title: 'Usuários Ativos',
          url: '/corporative/accounts/active',
        },
        {
          title: 'Usuários Inativos',
          url: '/corporative/accounts/inactive',
        },
        // {
        //   title: 'Restrições de Usuários',
        //   url: '#',
        // },
      ],
    },
    {
      title: 'Financeiro',
      url: '#',
      icon: HandCoins,
      isActive: route.path.startsWith('invoices'),
      items: [
        {
          title: 'Faturas em Aberto',
          url: '#',
        },
        // {
        //   title: 'Faturas canceladas',
        //   url: '#',
        // },
      ],
    },
  ],
  settings: [
    // {
    //   name: 'Budget',
    //   url: '/corporative/budget',
    //   icon: Coins,
    // },
    // {
    //   name: 'Gerenciar Acessos',
    //   url: '/corporative/accounts',
    //   icon: UserCog,
    // },
  ],
  sac: [
    {
      name: 'Fale Conosco',
      url: '#',
      icon: Headset,
    },
  ],
};
