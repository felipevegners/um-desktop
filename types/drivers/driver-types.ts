export interface Driver {
  id?: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  picture: string;
  driverLicense: string;
  driverFiles: Array<any>;
  driverCars: Array<any>;
  rating: Array<any>;
  history: Array<any>;
  status: string;
  enabled: boolean;
}
