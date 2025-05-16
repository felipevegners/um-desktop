import { CalendarDays, HandCoins, UserCog } from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

export const platformCorpUserMenu = {
  title: 'Painel Usuário Corporativo',
  user: {
    name: user.username,
    company: user.role, //mudar para contract company
    email: user.email,
    avatar: '',
  },
  navMain: [
    {
      title: 'Atendimentos',
      url: '',
      icon: CalendarDays,
      isActive: true,
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
      name: 'Minha conta',
      url: '/admin/account',
      icon: UserCog,
    },
  ],
};
