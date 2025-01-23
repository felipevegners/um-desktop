export interface Customer {
  name: string;
  document: string;
  address: {
    street: string;
    streetNumber: string;
    zipcode: string;
  };
  phone: string;
  website?: string;
  logo?: string;
  adminId: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
}
