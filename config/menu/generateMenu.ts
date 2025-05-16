import { backofficeMenu } from './backoffice-menu';
import { branchManagerMenu } from './branch-manager-menu';
import { masterManagerMenu } from './master-manager-menu';
import { platformAdminMenu } from './platform-admin-menu';
import { platformCorpUserMenu } from './platform-corp-user-menu';
import { platformUserMenu } from './platform-user-menu';

export const generateMenu = (role: string) => {
  switch (role) {
    case 'admin':
      return backofficeMenu;
      break;
    case 'master-manager':
      return masterManagerMenu;
      break;
    case 'branch-manager':
      return branchManagerMenu;
      break;
    case 'platform-admin':
      return platformAdminMenu;
      break;
    case 'platform-corp-user':
      return platformCorpUserMenu;
      break;
    case 'platform-user':
      return platformUserMenu;
      break;
    default:
      return backofficeMenu;
  }
};
