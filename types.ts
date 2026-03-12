export type ONTStatus = 'active' | 'operational' | 'isolated' | 'critical';

export interface ONTRecord {
  id: string;
  msan: string;
  location: string;
  sn: string;
  version: string;
  vendorId: string; // Added field for Vendor ID
  status: ONTStatus; // Derived or simulated for the KPI cards
}

export interface KPIStats {
  searched: number;
  total: number;
  isolated: number;
  critical: number;
  repeated: number;
  huaweiCount?: number;
  nokiaCount?: number;
}

export interface FilterState {
  sn: string;
  location: string;
  msan: string;
  status?: ONTStatus | null;
  showRepeated?: boolean;
  massiveSns?: string[]; // Array of SNs for Massive Search
  vendor?: 'nokia' | 'huawei' | null;
}

export interface User {
  username: string;
  role?: string;
  password?: string;
  createdAt?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  is_blocked?: boolean;
}