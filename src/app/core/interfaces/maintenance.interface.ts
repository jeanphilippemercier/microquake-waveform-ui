export interface MaintenanceEventBase {
  name: string;
  date: string;
  status: string;
  category: string;
  attachments: MaintenanceEventAttachment[];
  description: string;
}

export interface MaintenanceEvent extends MaintenanceEventBase {
  id: number;
  station: {
    id: number;
    name: string;
    code: string;
  };
}

export interface MaintenanceEventAttachment {
  description: string;
  file: string;
  id: number;
  uploading?: boolean;
  error?: boolean;
}

export interface MaintenanceCategory {
  name: string;
  description?: string;
}
export interface MaintenanceStatus {
  name: string;
  description?: string;
}
