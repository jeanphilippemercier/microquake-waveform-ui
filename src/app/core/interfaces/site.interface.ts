export interface Network {
  code: string;
  contact_email: string;
  contact_name: string;
  contact_phone: string;
  description: string;
  id: number;
  name: string;
  site: number;
}

export interface Site {
  code: string;
  coordinate_system: string;
  country: string;
  description: string;
  id: number;
  name: string;
  networks: Network[];
  operator: string;
  timezone: string;
}
