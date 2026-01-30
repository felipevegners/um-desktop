import {
  Building2,
  CalendarDays,
  HandCoins,
  Handshake,
  Headset,
  User,
} from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;
const route = useRoute();

export const masterManagerMenu = {
  title: 'Painel Gestor Master',
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
          title: '+ Novo Atendimento',
          url: '/corporative/rides/new',
        },
      ],
    },
    {
      title: 'Gerenciar Contrato',
      url: '#',
      icon: Handshake,
      isActive: route.path.startsWith('contracts'),
      items: [
        {
          title: 'Contrato Ativo',
          url: '/corporative/contracts/edit',
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
      isActive: route.path.includes('accounts'),
      items: [
        {
          title: 'Usuários Ativos',
          url: '/corporative/accounts/active',
        },
        {
          title: 'Usuários Inativos',
          url: '/corporative/accounts/inactive',
        },
        {
          title: '+ Novo Usuário',
          url: '/corporative/accounts/new',
        },
      ],
    },
    {
      title: 'Financeiro',
      url: '/corporative/finances/reports',
      icon: HandCoins,
      isActive: route.path.includes('finances'),
      items: [
        {
          title: 'Relatórios Financeiros',
          url: '/corporative/finances/reports',
        },
      ],
    },
  ],
  // settings: [
  //   {
  //     name: 'Budget',
  //     // url: '/corporative/budget',
  //     url: '#',
  //     icon: Coins,
  //   },
  //   // {
  //   //   name: 'Gerenciar Acessos',
  //   //   url: '/corporative/accounts',
  //   //   icon: UserCog,
  //   // },
  // ],
  sac: [
    {
      name: 'Fale Conosco',
      url: '#',
      icon: Headset,
    },
  ],
};
