import {
  Building2,
  CalendarDays,
  Car,
  Coins,
  HandCoins,
  LayoutDashboard,
  SquarePercent,
  User,
  UserPen,
} from 'lucide-vue-next';

export const sideMenuData = {
  user: {
    name: 'Felipe Vegners',
    company: 'Urban Mobi',
    email: 'vegners@urbanmobi.com.br',
    avatar: '',
  },
  navMain: [
    {
      title: 'Clientes',
      url: '#',
      icon: Building2,
      isActive: false,
      items: [
        {
          title: 'Base de Clientes',
          url: '/admin/customers',
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
          title: 'Base de Usuários',
          url: '/admin/users',
        },
      ],
    },
    {
      title: 'Motoristas',
      url: '#',
      icon: Car,
      items: [
        {
          title: 'Base de Motoristas',
          url: '/admin/drivers',
        },
        {
          title: 'Parceiros',
          url: '#',
        },
        {
          title: 'Inativos',
          url: '#',
        },
      ],
    },
    {
      title: 'Atendimentos',
      url: '',
      icon: CalendarDays,
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
      items: [
        {
          title: 'Faturas em aberto',
          url: '#',
        },
        {
          title: 'Balanço',
          url: '#',
        },
        {
          title: 'Canceladas',
          url: '#',
        },
        {
          title: 'Pagamento Motoristas',
          url: '#',
        },
      ],
    },
  ],
  settings: [
    {
      name: 'Tarifas',
      url: '#',
      icon: Coins,
    },
    {
      name: 'Repasse Motorista',
      url: '#',
      icon: SquarePercent,
    },
    {
      name: 'Usuários',
      url: '/admin/accounts',
      icon: UserPen,
    },
    {
      name: 'Configurar Dashboards',
      url: '#',
      icon: LayoutDashboard,
    },
  ],
};
