export interface Customer {
  id?: string;
  name: string;
  document: string;
  address: {
    zipcode: string;
    streetName: string;
    streetNumber: string;
    city: string;
    state: string;
  };
  phone: string;
  website?: string;
  logo?: string;
  adminId: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  passengers?: Record<string, string>;
  ccAreas: [
    {
      areaCode: string;
      areaName: string;
    }
  ];
}
