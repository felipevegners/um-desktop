export interface Product {
  id: string;
  image: {
    name: string;
    url: string;
  };
  code: string;
  name: string;
  type: string;
  capacity: number;
  category: string;
  basePrice: string;
  includedHours: string;
  includedKms: number;
  kmPrice: string;
  minutePrice: string;
  description: string;
  enabled: boolean;
}
