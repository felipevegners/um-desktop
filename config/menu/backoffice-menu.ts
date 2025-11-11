import {
  Box,
  Building2,
  CalendarDays,
  Car,
  HandCoins,
  Handshake,
  SquarePercent,
  UserPen,
} from 'lucide-vue-next';

const route = useRoute();
const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

export const backofficeMenu = {
  title: 'Painel Backoffice',
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
          url: '/admin/rides/open',
        },
        {
          title: 'Finalizados',
          url: '/admin/rides/completed',
        },
        {
          title: 'Cancelados',
          url: '/admin/rides/cancelled',
        },
        {
          title: '+ Novo Atendimento',
          url: '/admin/rides/new',
        },
      ],
    },
    {
      title: 'Motoristas',
      url: '/admin/drivers/active',
      icon: Car,
      isActive: route.path.startsWith('drivers'),
      items: [
        {
          title: 'Motoristas Ativos',
          url: '/admin/drivers/active',
        },
        {
          title: 'Motoristas Inativos',
          url: '/admin/drivers/inactive',
        },
        {
          title: '+ Novo Motorista',
          url: '/admin/drivers/new',
        },
        {
          title: 'Parceiros',
          url: '#',
        },
      ],
    },
    {
      title: 'Contratos',
      url: '/admin/contracts/active',
      icon: Handshake,
      isActive: route.path.startsWith('contracts'),
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
          title: '+ Novo Contrato',
          url: '/admin/contracts/new',
        },
      ],
    },
    {
      title: 'Filiais',
      url: '/admin/branches/active',
      icon: Building2,
      isActive: route.path.startsWith('branches'),
      items: [
        {
          title: 'Filiais Ativas',
          url: '/admin/branches/active',
        },
        {
          title: 'Filiais Inativas',
          url: '/admin/branches/inactive',
        },
        {
          title: '+ Nova Filial',
          url: '/admin/branches/new',
        },
      ],
    },
    {
      title: 'Contas de Usuários',
      url: '/admin/accounts/active',
      icon: UserPen,
      isActive: route.path.startsWith('accounts'),
      items: [
        {
          title: 'Usuários Ativos',
          url: '/admin/accounts/active',
        },
        {
          title: 'Usuários Inativos',
          url: '/admin/accounts/inactive',
        },
        {
          title: '+ Novo Usuário',
          url: '/admin/accounts/new',
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
          url: '/admin/finances/commissions',
        },
      ],
    },
  ],
  settings: [
    {
      name: 'Produtos',
      url: '/admin/configurations/products/',
      icon: Box,
      active: route.path.startsWith('products'),
    },
    {
      name: 'Taxas e Repasses',
      url: '/admin/configurations/fees',
      icon: SquarePercent,
      active: route.path.startsWith('fees'),
    },
    // {
    //   name: 'Configurar Dashboards',
    //   url: '#',
    //   icon: LayoutDashboard,
    //   active: '',
    // },
  ],
};
