export interface Passenger {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  department?: String;
  position: string;
  restrictions: Array<string>;
  status: string;
  active: boolean;
  history?: Record<string, string>;
}
