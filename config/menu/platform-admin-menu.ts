import {
  Building2,
  CalendarDays,
  Coins,
  HandCoins,
  User,
  UserCog,
} from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

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
      title: 'Gerenciar Filiais',
      url: '#',
      icon: Building2,
      isActive: true,
      items: [
        {
          title: 'Filiais Cadastradas',
          url: '/admin/branches',
        },
        {
          title: 'Cdastrar Filial',
          url: '/admin/branches/add',
        },
        {
          title: 'Editar Filial',
          url: '/admin/branches/edit',
        },
      ],
    },
    {
      title: 'Usuários',
      url: '#',
      icon: User,
      isActive: false,
      items: [
        {
          title: 'Usuários cadastrados',
          url: '/admin/users',
        },
        {
          title: 'Restrições de Usuários',
          url: '/admin/users/restrictions',
        },
      ],
    },
    {
      title: 'Atendimentos',
      url: '',
      icon: CalendarDays,
      isActive: false,
      items: [
        {
          title: 'Abertos',
          url: '/admin/rides/active',
        },
        {
          title: 'Realizados',
          url: '/admin/rides/completed',
        },
        {
          title: 'Cancelados',
          url: '/admin/rides/canceled',
        },
        {
          title: '+ Novo agendamento',
          url: '/admin/rides/new',
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
          url: '/admin/invoices/active',
        },
        {
          title: 'Faturas canceladas',
          url: '/admin/invoices/canceled',
        },
      ],
    },
  ],
  settings: [
    {
      name: 'Budget',
      url: '/admin/budget',
      icon: Coins,
    },
    {
      name: 'Gerenciar Acessos',
      url: '/admin/accounts',
      icon: UserCog,
    },
  ],
};
