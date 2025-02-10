import {
  Building2,
  CalendarDays,
  Car,
  Coins,
  LayoutDashboard,
  HandCoins,
  SquarePercent,
  UserPen,
} from "lucide-vue-next";

export const sideMenuData = {
  user: {
    name: "Felipe Vegners",
    company: "Urban Mobi",
    email: "vegners@urbanmobi.com.br",
    avatar: "",
  },
  navMain: [
    {
      title: "Clientes",
      url: "#",
      icon: Building2,
      isActive: false,
      items: [
        {
          title: "Ativos",
          url: "/admin/customers/active",
        },
        {
          title: "Inativos",
          url: "/admin/customers/inactive",
        },
        {
          title: "Usuários Ativos",
          url: "admin/passengers/active",
        },
        {
          title: "Usuários Inativos",
          url: "admin/passengers/inactive",
        },
      ],
    },
    {
      title: "Motoristas",
      url: "#",
      icon: Car,
      items: [
        {
          title: "Base de Motoristas",
          url: "/admin/drivers/active",
        },
        {
          title: "Parceiros",
          url: "#",
        },
        {
          title: "Inativos",
          url: "#",
        },
      ],
    },
    {
      title: "Agendamentos",
      url: "#",
      icon: CalendarDays,
      items: [
        {
          title: "Abertos",
          url: "#",
        },
        {
          title: "Realizados",
          url: "#",
        },
        {
          title: "Cancelados",
          url: "#",
        },
        {
          title: "+ Novo agendamento",
          url: "#",
        },
      ],
    },
    {
      title: "Financeiro",
      url: "#",
      icon: HandCoins,
      items: [
        {
          title: "Faturas em aberto",
          url: "#",
        },
        {
          title: "Balanço",
          url: "#",
        },
        {
          title: "Canceladas",
          url: "#",
        },
        {
          title: "Pagamento Motoristas",
          url: "#",
        },
      ],
    },
  ],
  settings: [
    {
      name: "Tarifas",
      url: "#",
      icon: Coins,
    },
    {
      name: "Repasse Motorista",
      url: "#",
      icon: SquarePercent,
    },
    {
      name: "Usuários",
      url: "#",
      icon: UserPen,
    },
    {
      name: "Configurar Dashboards",
      url: "#",
      icon: LayoutDashboard,
    },
  ],
};
