export const rideStatusTranslated = {
  created: 'Agendado',
  pending: 'Pendente',
  accepted: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Finalizado',
  refused: 'Recusado',
  'in-progress': 'Em Andamento',
};

export const rideStatusOptions = [
  { label: 'Todos', value: 'all', color: 'zinc-600' },
  { label: 'Agendado', value: 'created', color: 'blue-600' },
  { label: 'Pendente', value: 'pending', color: 'amber-400' },
  { label: 'Confirmado', value: 'accepted', color: 'green-600' },
  { label: 'Cancelado', value: 'cancelled', color: 'red-600' },
  { label: 'Finalizado', value: 'completed', color: 'zinc-900' },
  { label: 'Recusado', value: 'refused', color: 'red-600' },
  { label: 'Budget', value: 'over_quota', color: 'red-600' },
  { label: 'Em Andamento', value: 'in-progress', color: 'violet-600' },
];

export const paymentStatusOptions = [
  { label: 'Todos', value: 'all', color: 'zinc-600' },
  { label: 'Pago', value: 'paid', color: 'green-600' },
  { label: 'Faturar', value: 'invoice', color: 'zinc-900' },
  { label: 'Autorizado', value: 'authorized', color: 'green-600' },
  { label: 'Pendente', value: 'pending', color: 'amber-600' },
  { label: 'Não Pago', value: 'unpaid', color: 'amber-600' },
  { label: 'Negado', value: 'denied', color: 'red-600' },
  { label: 'Expirado', value: 'expired', color: 'red-600' },
  { label: 'Cancelado', value: 'voided', color: 'red-600' },
  { label: 'Não finalizado', value: 'NotFinalized', color: 'blue-600' },
  { label: 'Erro', value: 'error', color: 'red-600' },
];
