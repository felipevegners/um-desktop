export const rolesList = [
  { label: 'Backoffice', value: 'admin' },
  { label: 'Gestor Master', value: 'master-manager' },
  { label: 'Gestor Filial', value: 'branch-manager' },
  { label: 'Administrador Filial', value: 'platform-admin' },
  {
    label: 'Usuário Corporativo',
    value: 'platform-corp-user',
  },
  { label: 'Usuário UM', value: 'platform-user' },
  { label: 'Motorista UM', value: 'platform-driver' },
];

export const rolesTypes: any = {
  admin: 'Gestor Backoffice',
  'master-manager': 'Gestor Master',
  'branch-manager': 'Gestor Filial',
  'platform-admin': 'Adminstrador Filial',
  'platform-corp-user': 'Usuário Corporativo',
  'platform-user': 'Usuário UM',
  'platform-driver': 'Motorista UM',
};

export const userRestrictions = [
  {
    id: 'week',
    label: 'Semanal',
  },
  {
    id: 'weekend',
    label: 'Fins de Semana',
  },
  {
    id: 'night',
    label: 'Atendimento Noturno',
  },
  {
    id: 'vacations',
    label: 'Férias',
  },
] as const;
