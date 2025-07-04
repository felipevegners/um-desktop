import { CalendarDays, HandCoins, UserCog } from 'lucide-vue-next';

const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

export const platformDriverMenu = {
  title: 'Painel do Motorista',
  user: {
    name: user.username,
    company: user.role, //mudar para contract company
    email: user.email,
    avatar: '',
  },
  navMain: [
    {
      title: 'Meus Atendimentos',
      url: '',
      icon: CalendarDays,
      isActive: true,
      items: [
        {
          title: 'Abertos',
          url: '/driver/rides/open',
        },
        {
          title: 'Realizados',
          url: '/driver/rides/completed',
        },
        {
          title: 'Cancelados',
          url: '/driver/rides/canceled',
        },
      ],
    },
    {
      title: 'Meus Pagamentos',
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
      url: '/driver/account',
      icon: UserCog,
    },
  ],
};
