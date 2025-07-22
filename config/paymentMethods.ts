export const paymentMethods = [
  {
    id: 'pix',
    label: 'À vista - PIX',
    icon: 'Banknote',
    logo: ['/images/logos/logo_pix.svg'],
    value: 'pix',
  },
  {
    id: 'creditcard',
    label: 'Cartão de Crédito',
    icon: 'CreditCard',
    logo: [
      '/images/logos/mastercard.svg',
      '/images/logos/visa.svg',
      '/images/logos/elo.svg',
      '/images/logos/hipercard.svg',
    ],
    value: 'creditcard',
  },
  {
    id: 'corporative',
    label: 'Faturamento Corporativo',
    icon: 'Building',
    logo: [''],
    value: 'corporative',
  },
];
