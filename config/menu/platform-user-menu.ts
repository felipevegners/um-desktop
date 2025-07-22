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
      url: '/personal/rides/open',
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
          title: '+ Novo Atendimento',
          url: '/personal/rides/new',
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
          title: 'Meus Recibos',
          url: '/personal/invoices/',
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
