import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AttendanceRecord, SalarySlip, Notification, UserRole } from '../types';
import { dbService, calculateSlip } from '../services/mockMsSql';
import { useAuth } from './AuthContext';

interface DataContextType {
  users: User[];
  attendance: AttendanceRecord[];
  salarySlips: SalarySlip[];
  notifications: Notification[];
  refreshData: () => Promise<void>;
  markCheckIn: (lat: number, lng: number, isRemote: boolean) => Promise<void>;
  markCheckOut: () => Promise<void>;
  // New: Preview calculation without saving
  calculatePreviewSlip: (userId: string, monthYear: string) => Promise<SalarySlip | null>;
  // New: Save the slip
  saveSalarySlip: (slip: SalarySlip) => Promise<void>;
  addNewUser: (userData: Omit<User, 'id' | 'avatarUrl'>) => Promise<void>;
  updateAttendanceRecord: (recordId: string, updates: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    
    const allUsers = await dbService.getUsers();
    setUsers(allUsers);

    const allAttendance = await dbService.getAttendance(
      user.role === UserRole.ADMIN || user.role === UserRole.MANAGER ? undefined : user.id
    );
    setAttendance(allAttendance);

    const allSlips = await dbService.getSalarySlips(
      user.role === UserRole.ADMIN ? undefined : user.id
    );
    setSalarySlips(allSlips);

    const notifs = await dbService.getNotifications(user.id, user.role);
    setNotifications(notifs);

  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const markCheckIn = async (lat: number, lng: number, isRemote: boolean) => {
    if (!user) return;
    await dbService.markCheckIn(user.id, lat, lng, isRemote);
    await refreshData();
  };

  const markCheckOut = async () => {
    if (!user) return;
    await dbService.markCheckOut(user.id);
    await refreshData();
  };

  const calculatePreviewSlip = async (userId: string, monthYear: string): Promise<SalarySlip | null> => {
      const targetUser = await dbService.getUserById(userId);
      if (!targetUser) return null;

      const userAttendance = await dbService.getAttendance(userId);
      const relevantAttendance = userAttendance.filter(a => a.date.startsWith(monthYear));
      
      // Basic logic: Count present/late days.
      // Real app would have complex logic for half-days, weekends etc.
      const presentDays = relevantAttendance.length;
      
      return calculateSlip(targetUser, monthYear, presentDays > 0 ? presentDays : 0);
  };

  const saveSalarySlip = async (slip: SalarySlip) => {
      await dbService.createSalarySlip(slip);
      await refreshData();
  };

  const addNewUser = async (userData: Omit<User, 'id' | 'avatarUrl'>) => {
    await dbService.createUser(userData);
    await refreshData();
  };

  const updateAttendanceRecord = async (recordId: string, updates: any) => {
      if (!user || user.role !== UserRole.ADMIN) throw new Error("Unauthorized");
      await dbService.updateAttendanceRecord(recordId, updates, user.name);
      await refreshData();
  };

  return (
    <DataContext.Provider value={{ 
      users, 
      attendance, 
      salarySlips,
      notifications,
      refreshData,
      markCheckIn,
      markCheckOut,
      calculatePreviewSlip,
      saveSalarySlip,
      addNewUser,
      updateAttendanceRecord
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};