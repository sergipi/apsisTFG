export type Role = 'ADMIN' | 'REQUESTER' | 'IT_TECHNICIAN' | 'VIEWER';

export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  department?: number;
  location?: number;
  profile?: number;
  allowed_profiles?: number[];
  allocated_products?: number[];
  gps_number?: string;
}

export interface ApsisRequest {
  id: number;
  request_type: string;
  status: string;
  requester: number;
  requester_name: string;
  technician?: number;
  technician_name?: string;
  target_user_name?: string;
  target_user_email?: string;
  target_gps_number?: string;
  location?: number;
  department?: number;
  profile?: number;
  created_at: string;
  updated_at: string;
  due_date?: string;
  is_overdue?: boolean;
  progress_percentage: number;
}
