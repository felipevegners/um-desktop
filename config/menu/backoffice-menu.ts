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
      isActive: route.path.includes('rides'),
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
      isActive: route.path.includes('drivers'),
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
          title: 'Novo Motorista',
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
      isActive: route.path.includes('contracts'),
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
      title: 'Empresas',
      url: '/admin/branches/active',
      icon: Building2,
      isActive: route.path.includes('branches'),
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
          title: 'Nova Filial',
          url: '/admin/branches/new',
        },
      ],
    },
    {
      title: 'Contas de Usuários',
      url: '/admin/accounts/active',
      icon: UserPen,
      isActive: route.path.includes('accounts'),
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
          title: 'Novo Usuário',
          url: '/admin/accounts/new',
        },
      ],
    },
    {
      title: 'Financeiro',
      url: '#',
      icon: HandCoins,
      isActive: route.path.includes('invoices'),
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
      active: route.path.includes('products'),
    },
    {
      name: 'Comissões e Taxas',
      url: '/admin/configurations/fees',
      icon: SquarePercent,
      active: route.path.includes('fees'),
    },
    // {
    //   name: 'Configurar Dashboards',
    //   url: '#',
    //   icon: LayoutDashboard,
    //   active: '',
    // },
  ],
};
