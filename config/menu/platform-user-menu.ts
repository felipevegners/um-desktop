import { CalendarDays, HandCoins, UserCog } from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

export const platformUserMenu = {
  title: 'Painel do Usuário',
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
          url: '/personal/rides/open',
        },
        {
          title: 'Realizados',
          url: '/personal/rides/completed',
        },
        {
          title: 'Cancelados',
          url: '/personal/rides/canceled',
        },
        {
          title: '+ Novo agendamento',
          url: '/personal/rides/new',
        },
      ],
    },
    {
      title: 'Pagamentos',
      url: '#',
      icon: HandCoins,
      isActive: false,
      items: [
        {
          title: 'Histórico de Pagamentos',
          url: '/personal/invoices/active',
        },
      ],
    },
  ],
  settings: [
    {
      name: 'Minha conta',
      url: '/personal/account',
      icon: UserCog,
    },
  ],
};
