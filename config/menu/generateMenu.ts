import { backofficeMenuData } from './backoffice-menu';
import { masterManagerMenu } from './master-manager-menu';
import { platformUserMenu } from './platform-user-menu';

export const generateMenu = (role: string) => {
  switch (role) {
    case 'admin':
      return backofficeMenuData;
      break;
    case 'master-manager':
      return masterManagerMenu;
      break;
    case 'platform-user':
      return platformUserMenu;
      break;
    default:
      return backofficeMenuData;
  }
};
