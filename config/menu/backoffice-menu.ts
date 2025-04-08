import {
  Box,
  Building2,
  CalendarDays,
  Car,
  Coins,
  HandCoins,
  Handshake,
  LayoutDashboard,
  Plus,
  SquarePercent,
  User,
  UserPen,
} from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

export const backofficeMenuData = {
  title: 'Painel Backoffice',
  user: {
    name: user.username,
    company: user.role,
    email: user.email,
    avatar: '',
  },
  navMain: [
    {
      title: 'Contratos',
      url: '#',
      icon: Handshake,
      isActive: true,
      items: [
        {
          title: 'Contratos Ativos',
          url: '/admin/contracts/active',
        },
        {
          title: 'Contratos Inativos',
          url: '/admin/contracts/inactive',
        },
        {
          title: 'Novo Contrato',
          url: '/admin/contracts/new',
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
      isActive: false,
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
          title: 'Novo agendamento',
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
      name: 'Produtos',
      url: '/admin/configurations/products/',
      icon: Box,
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
