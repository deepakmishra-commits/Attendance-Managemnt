import { User, AttendanceRecord, SalarySlip, UserRole, AttendanceStatus, Notification, AuditLog } from '../types';
import { OFFICE_START_HOUR, OFFICE_LATE_THRESHOLD_MINUTES } from '../constants';

// Initial Seed Data
const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@techflow.com',
    role: UserRole.ADMIN,
    department: 'Management',
    designation: 'System Admin',
    baseSalary: 1200000, // 12 LPA
    joinDate: '2022-01-01',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  },
  {
    id: 'u2',
    name: 'Rahul Manager',
    email: 'manager@techflow.com',
    role: UserRole.MANAGER,
    department: 'Engineering',
    designation: 'Engineering Manager',
    baseSalary: 1800000,
    joinDate: '2022-03-15',
    avatarUrl: 'https://ui-avatars.com/api/?name=Rahul+Manager&background=random'
  },
  {
    id: 'u3',
    name: 'Priya Sharma',
    email: 'priya@techflow.com',
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    designation: 'Frontend Developer',
    baseSalary: 800000,
    joinDate: '2023-06-10',
    avatarUrl: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random'
  },
  {
    id: 'u4',
    name: 'Amit Singh',
    email: 'amit@techflow.com',
    role: UserRole.EMPLOYEE,
    department: 'Marketing',
    designation: 'SEO Specialist',
    baseSalary: 600000,
    joinDate: '2023-07-22',
    avatarUrl: 'https://ui-avatars.com/api/?name=Amit+Singh&background=random'
  }
];

// Generate some dummy attendance for past days
const generatePastAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  SEED_USERS.forEach(user => {
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Randomize check-in times
      const hour = 9 + Math.floor(Math.random() * 2); // 9 or 10
      const minute = Math.floor(Math.random() * 60);
      
      const checkIn = new Date(date);
      checkIn.setHours(hour, minute, 0);
      
      const checkOut = new Date(date);
      checkOut.setHours(18, 0, 0);

      let status = AttendanceStatus.PRESENT;
      // Late logic: After 10:15
      if (hour > OFFICE_START_HOUR || (hour === OFFICE_START_HOUR && minute > OFFICE_LATE_THRESHOLD_MINUTES)) {
         status = AttendanceStatus.LATE;
      }

      // Random absences
      if (Math.random() > 0.9) status = AttendanceStatus.ABSENT;
      // Weekend check
      const day = date.getDay();
      if (day === 0 || day === 6) continue;

      if (status !== AttendanceStatus.ABSENT) {
        records.push({
          id: `att-${user.id}-${dateStr}`,
          userId: user.id,
          date: dateStr,
          checkInTime: checkIn.toISOString(),
          checkOutTime: checkOut.toISOString(),
          status,
          locationLat: 12.9716 + (Math.random() * 0.001),
          locationLng: 77.5946 + (Math.random() * 0.001),
          isRemote: false,
          auditLogs: []
        });
      }
    }
  });
  return records;
};

// Helper to generate a slip object
export const calculateSlip = (user: User, monthYear: string, presentDays: number): SalarySlip => {
    const totalDaysInMonth = 30; // Simplified
    const monthlyBase = user.baseSalary / 12;
    
    // Salary pro-rated based on attendance
    const dailyRate = monthlyBase / totalDaysInMonth;
    const basicEarned = dailyRate * presentDays;

    // Indian Salary Structure (Approx)
    const basicComponent = basicEarned * 0.5; // 50% is Basic
    const hra = basicEarned * 0.4; // 40% of Basic is HRA
    const da = basicEarned * 0.1; // 10% Special/DA
    
    const gross = basicComponent + hra + da;
    
    // Professional Tax & TDS (Simplified)
    const pt = 200; 
    const tds = gross > 50000 ? gross * 0.1 : 0;
    const deductions = pt + tds;
    
    const net = gross - deductions;

    return {
      id: `slip-${user.id}-${monthYear}-${Date.now()}`,
      userId: user.id,
      month: monthYear,
      generatedDate: new Date().toISOString(),
      basicSalary: Math.round(basicComponent),
      hra: Math.round(hra),
      da: Math.round(da),
      bonuses: 0,
      deductions: Math.round(deductions),
      tax: Math.round(tds),
      netSalary: Math.round(net),
      presentDays,
      totalDays: totalDaysInMonth
    };
};

// Generate past 3 months slips automatically
const generatePastSalarySlips = (): SalarySlip[] => {
    const slips: SalarySlip[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1); 
        const monthYear = d.toISOString().slice(0, 7); // YYYY-MM
        
        SEED_USERS.forEach(user => {
            const presentDays = 22; // Standard for history
            slips.push(calculateSlip(user, monthYear, presentDays));
        });
    }
    return slips;
}

class MockMsSqlService {
  private users: User[] = [];
  private attendance: AttendanceRecord[] = [];
  private salarySlips: SalarySlip[] = [];
  private notifications: Notification[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const users = localStorage.getItem('tf_users');
    const attendance = localStorage.getItem('tf_attendance');
    const salary = localStorage.getItem('tf_salary');

    this.users = users ? JSON.parse(users) : SEED_USERS;
    
    if (!attendance) {
        this.attendance = generatePastAttendance();
        this.saveAttendance();
    } else {
        this.attendance = JSON.parse(attendance);
    }

    if (!salary || JSON.parse(salary).length === 0) {
        this.salarySlips = generatePastSalarySlips();
        this.saveSalary();
    } else {
        this.salarySlips = JSON.parse(salary);
    }
    
    if (!users) this.saveUsers();
  }

  private saveUsers() {
    localStorage.setItem('tf_users', JSON.stringify(this.users));
  }
  private saveAttendance() {
    localStorage.setItem('tf_attendance', JSON.stringify(this.attendance));
  }
  private saveSalary() {
    localStorage.setItem('tf_salary', JSON.stringify(this.salarySlips));
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async createUser(userData: Omit<User, 'id' | 'avatarUrl'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`
    };
    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  // --- Attendance ---
  async getAttendance(userId?: string): Promise<AttendanceRecord[]> {
      if (userId) {
          return this.attendance.filter(a => a.userId === userId);
      }
      return this.attendance;
  }

  async markCheckIn(userId: string, lat: number, lng: number, isRemote: boolean): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = this.attendance.find(a => a.userId === userId && a.date === today);
    if (existing) return existing;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    let status = AttendanceStatus.PRESENT;
    // Late logic
    if (hour > OFFICE_START_HOUR || (hour === OFFICE_START_HOUR && minute > OFFICE_LATE_THRESHOLD_MINUTES)) {
         status = AttendanceStatus.LATE;
    }

    const record: AttendanceRecord = {
      id: `att-${userId}-${today}`,
      userId,
      date: today,
      checkInTime: now.toISOString(),
      checkOutTime: null,
      status: status,
      locationLat: lat,
      locationLng: lng,
      isRemote,
      auditLogs: []
    };

    this.attendance.push(record);
    this.saveAttendance();
    return record;
  }

  async markCheckOut(userId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const index = this.attendance.findIndex(a => a.userId === userId && a.date === today);

    if (index === -1) throw new Error("No check-in record found for today.");
    // User cannot revert
    if (this.attendance[index].checkOutTime) {
        throw new Error("Check-out already marked. Cannot revert.");
    }

    this.attendance[index].checkOutTime = new Date().toISOString();
    this.saveAttendance();
    return this.attendance[index];
  }

  // ADMIN ONLY: Edit Attendance
  async updateAttendanceRecord(recordId: string, updates: Partial<AttendanceRecord>, adminName: string): Promise<void> {
      const index = this.attendance.findIndex(a => a.id === recordId);
      if (index === -1) throw new Error("Record not found");

      const oldRecord = this.attendance[index];
      
      const auditLog: AuditLog = {
          id: `audit-${Date.now()}`,
          recordId: recordId,
          changedBy: adminName,
          timestamp: new Date().toISOString(),
          oldValue: `In: ${oldRecord.checkInTime ? new Date(oldRecord.checkInTime).toLocaleTimeString() : 'N/A'}, Out: ${oldRecord.checkOutTime ? new Date(oldRecord.checkOutTime).toLocaleTimeString() : 'N/A'}`,
          newValue: `In: ${updates.checkInTime ? new Date(updates.checkInTime).toLocaleTimeString() : 'N/A'}, Out: ${updates.checkOutTime ? new Date(updates.checkOutTime).toLocaleTimeString() : 'N/A'}`,
          reason: "Admin Correction"
      };

      this.attendance[index] = { 
          ...oldRecord, 
          ...updates,
          auditLogs: [...(oldRecord.auditLogs || []), auditLog]
      };
      this.saveAttendance();
  }

  // --- Salary ---
  async createSalarySlip(slip: SalarySlip): Promise<void> {
    // Remove existing slip for same month/user to prevent duplicates
    this.salarySlips = this.salarySlips.filter(s => !(s.userId === slip.userId && s.month === slip.month));
    this.salarySlips.push(slip);
    this.saveSalary();
  }

  async getSalarySlips(userId?: string): Promise<SalarySlip[]> {
    const stored = localStorage.getItem('tf_salary');
    if (stored) this.salarySlips = JSON.parse(stored);
    
    if (userId) {
      return this.salarySlips.filter(s => s.userId === userId);
    }
    return this.salarySlips;
  }

  // --- Notifications ---
  async getNotifications(userId: string, role: UserRole): Promise<Notification[]> {
    const notifs: Notification[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Check for Late arrivals today (For Admin and the User themselves)
    const todayAttendance = this.attendance.filter(a => a.date === today);
    
    todayAttendance.forEach(record => {
        if (record.status === AttendanceStatus.LATE) {
            const user = this.users.find(u => u.id === record.userId);
            if (!user) return;

            // Notify Admin
            if (role === UserRole.ADMIN || role === UserRole.MANAGER) {
                 notifs.push({
                     id: `notif-late-admin-${record.id}`,
                     userId: userId,
                     title: 'Late Arrival Alert',
                     message: `${user.name} checked in late today at ${new Date(record.checkInTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`,
                     date: today,
                     isRead: false,
                     type: 'alert'
                 });
            }

            // Notify Employee (Self)
            if (userId === user.id) {
                notifs.push({
                    id: `notif-late-self-${record.id}`,
                    userId: userId,
                    title: 'Late Mark',
                    message: `You have been marked late today (>15 mins). Please ensure timely arrival.`,
                    date: today,
                    isRead: false,
                    type: 'alert'
                });
            }
        }
    });

    return notifs;
  }
}

export const dbService = new MockMsSqlService();