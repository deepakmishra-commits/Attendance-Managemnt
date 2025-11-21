export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  baseSalary: number;
  joinDate: string;
  avatarUrl: string;
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  LATE = 'Late',
  ABSENT = 'Absent',
  HALF_DAY = 'Half Day',
  ON_LEAVE = 'On Leave'
}

export interface AuditLog {
  id: string;
  recordId: string;
  changedBy: string; // User Name
  timestamp: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // ISO Date string YYYY-MM-DD
  checkInTime: string | null; // ISO string
  checkOutTime: string | null; // ISO string
  status: AttendanceStatus;
  locationLat: number;
  locationLng: number;
  isRemote: boolean;
  auditLogs?: AuditLog[];
}

export interface SalarySlip {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  generatedDate: string;
  basicSalary: number;
  hra: number; // House Rent Allowance
  da: number; // Dearness Allowance
  bonuses: number;
  deductions: number;
  tax: number;
  netSalary: number;
  presentDays: number;
  totalDays: number;
}

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface Notification {
  id: string;
  userId: string; // Who receives it
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'alert' | 'info' | 'success';
}

export interface AppState {
  users: User[];
  attendance: AttendanceRecord[];
  salarySlips: SalarySlip[];
}