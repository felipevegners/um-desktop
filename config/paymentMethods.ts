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
    label: 'Cartão de Crédito (À Vista)',
    icon: 'CreditCard',
    logo: [
      '/images/logos/mastercard.svg',
      '/images/logos/visa.svg',
      '/images/logos/elo.svg',
      '/images/logos/hipercard.svg',
      '/images/logos/amex.svg',
    ],
    value: 'creditcard',
  },
  {
    id: 'cielo',
    label: 'Cartão de Crédito (Parcelado)',
    icon: 'CreditCard',
    logo: [
      '/images/logos/mastercard.svg',
      '/images/logos/visa.svg',
      '/images/logos/elo.svg',
      '/images/logos/amex.svg',
    ],
    value: 'cielo',
  },
  {
    id: 'corporative',
    label: 'Faturamento Corporativo',
    icon: 'Building',
    logo: [''],
    value: 'corporative',
  },
];
