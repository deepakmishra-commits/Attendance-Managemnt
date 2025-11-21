import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Printer, Calendar, Filter, Pencil, Save, X, History, User, Clock, AlertCircle } from 'lucide-react';
import { AttendanceStatus, UserRole } from '../types';
import { OFFICE_START_HOUR } from '../constants';

type ReportType = 'daily' | 'monthly_employee';

const Reports: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, attendance, updateAttendanceRecord } = useData();
  
  // View State
  const [reportType, setReportType] = useState<ReportType>('daily');
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Edit Mode State
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{checkIn: string, checkOut: string}>({checkIn: '', checkOut: ''});
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const departments = ['All', ...Array.from(new Set(users.map(u => u.department)))];
  const statuses = ['All', ...Object.values(AttendanceStatus)];

  // --- Helpers ---

  const calculateDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '-';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffMs = e - s;
    if (diffMs < 0) return '-';
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  const calculateLateness = (checkIn: string | null) => {
    if (!checkIn) return '-';
    const checkInDate = new Date(checkIn);
    
    // Construct target time (Office Start Time on the same day)
    const targetTime = new Date(checkInDate);
    targetTime.setHours(OFFICE_START_HOUR, 0, 0, 0); 
    
    if (checkInDate <= targetTime) return '-';
    
    const diffMs = checkInDate.getTime() - targetTime.getTime();
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hrs === 0 && mins === 0) return '-';
    
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`;
  };

  const handleEditClick = (record: any) => {
      setEditingRecord(record.id);
      setEditForm({
          checkIn: record.checkInTime ? new Date(record.checkInTime).toISOString().slice(0, 16) : '',
          checkOut: record.checkOutTime ? new Date(record.checkOutTime).toISOString().slice(0, 16) : ''
      });
      setShowHistory(null);
  };

  const handleSaveEdit = async (recordId: string) => {
      try {
          const updates: any = {};
          if (editForm.checkIn) updates.checkInTime = new Date(editForm.checkIn).toISOString();
          if (editForm.checkOut) updates.checkOutTime = new Date(editForm.checkOut).toISOString();
          
          // Recalculate status if needed (simplified)
          if (updates.checkInTime) {
              const newTime = new Date(updates.checkInTime);
              if (newTime.getHours() >= OFFICE_START_HOUR && newTime.getMinutes() > 15) {
                  updates.status = AttendanceStatus.LATE;
              } else {
                  updates.status = AttendanceStatus.PRESENT;
              }
          }

          await updateAttendanceRecord(recordId, updates);
          setEditingRecord(null);
      } catch (e) {
          alert("Failed to update record");
      }
  };

  // --- Data Processing ---

  const getDailyData = () => {
      let filteredUsers = deptFilter === 'All' ? users : users.filter(u => u.department === deptFilter);
      return filteredUsers.map(u => {
          const record = attendance.find(a => a.userId === u.id && a.date === selectedDate);
          return { user: u, record };
      }).filter(item => {
          if (statusFilter === 'All') return true;
          const status = item.record?.status || 'Absent';
          return status === statusFilter;
      });
  };

  const getMonthlyData = () => {
      if (!selectedEmployeeId) return [];
      // Get all days in month
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = [];
      
      for(let i=1; i<=daysInMonth; i++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const record = attendance.find(a => a.userId === selectedEmployeeId && a.date === dateStr);
          days.push({ date: dateStr, record });
      }
      // Sort descending (newest first)
      return days.reverse();
  };

  // --- Render Components ---

  const AuditHistoryRow = ({ record }: { record: any }) => {
      if (!record?.auditLogs || record.auditLogs.length === 0) return null;
      return (
        <tr className="bg-slate-50/80 animate-in fade-in">
            <td colSpan={100} className="px-6 py-3">
                <div className="text-xs border-l-4 border-blue-400 pl-4 py-1 bg-blue-50/50 rounded-r-lg">
                    <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                        <History className="w-3 h-3 mr-1" /> Modification History
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {record.auditLogs.map((log: any) => (
                            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center text-slate-600 gap-1 sm:gap-2 pb-2 border-b border-blue-100 last:border-0">
                                <span className="font-mono text-[10px] text-slate-400 min-w-[120px]">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                                <div className="flex-1">
                                    <span className="font-semibold text-slate-800">{log.changedBy}</span> 
                                    <span className="mx-1">changed record.</span>
                                    <span className="text-slate-500 line-through mx-1">{log.oldValue}</span>
                                    <span className="text-blue-600 font-medium">→ {log.newValue}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </td>
        </tr>
      );
  };

  return (
    <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-blue-600" />
                    Attendance Reports
                </h1>
                <p className="text-sm text-slate-500 mt-1">View and manage employee attendance records</p>
            </div>
            <div className="flex space-x-2">
                <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm print:hidden">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                </button>
            </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 print:border-none print:shadow-none">
            <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Report View</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setReportType('daily')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${reportType === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Daily Overview
                    </button>
                    <button 
                        onClick={() => { setReportType('monthly_employee'); if(!selectedEmployeeId && users.length > 0) setSelectedEmployeeId(users[0].id); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${reportType === 'monthly_employee' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Monthly Detail
                    </button>
                </div>
            </div>
            
            {reportType === 'daily' ? (
                <>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-9 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <select 
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full pl-9 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                            >
                                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </>
            ) : (
                <>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Employee</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <select 
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="w-full pl-9 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                            >
                                <option value="">Select Employee</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="month" 
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full pl-9 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* TABLE VIEW */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50/50 border-b border-slate-200">
                        <tr>
                            {reportType === 'daily' ? (
                                <>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Status</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Work Duration</th>
                                    <th className="px-6 py-4">Late By</th>
                                </>
                            )}
                            {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reportType === 'daily' ? (
                            // DAILY ROWS
                            getDailyData().length > 0 ? (
                                getDailyData().map(({ user, record }) => {
                                    const isEditing = editingRecord === record?.id;
                                    const status = record?.status || AttendanceStatus.ABSENT;

                                    return (
                                        <React.Fragment key={user.id}>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{user.name}</div>
                                                    <div className="text-xs text-slate-400">{user.designation}</div>
                                                </td>
                                                <td className="px-6 py-4">{user.department}</td>
                                                <td className="px-6 py-4 font-mono">
                                                    {isEditing ? (
                                                        <input 
                                                            type="datetime-local" 
                                                            value={editForm.checkIn}
                                                            onChange={e => setEditForm({...editForm, checkIn: e.target.value})}
                                                            className="border rounded p-1 text-xs w-full bg-white"
                                                        />
                                                    ) : (
                                                        record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono">
                                                    {isEditing ? (
                                                        <input 
                                                            type="datetime-local" 
                                                            value={editForm.checkOut}
                                                            onChange={e => setEditForm({...editForm, checkOut: e.target.value})}
                                                            className="border rounded p-1 text-xs w-full bg-white"
                                                        />
                                                    ) : (
                                                        record?.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-800' :
                                                        status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {status === AttendanceStatus.LATE && <AlertCircle className="w-3 h-3 mr-1" />}
                                                        {status}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-6 py-4 text-right">
                                                        {record ? (
                                                            <div className="flex items-center justify-end space-x-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button onClick={() => handleSaveEdit(record.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors"><Save className="w-4 h-4" /></button>
                                                                        <button onClick={() => setEditingRecord(null)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => handleEditClick(record)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Edit Time"><Pencil className="w-4 h-4" /></button>
                                                                        {record.auditLogs && record.auditLogs.length > 0 && (
                                                                            <button 
                                                                                onClick={() => setShowHistory(showHistory === record.id ? null : record.id)} 
                                                                                className={`p-1.5 rounded-md transition-colors ${showHistory === record.id ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                                                title="View Audit History"
                                                                            >
                                                                                <History className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 italic">No Check-in</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                            {showHistory === record?.id && <AuditHistoryRow record={record} />}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No records found for this date.</td></tr>
                            )
                        ) : (
                            // MONTHLY ROWS
                            getMonthlyData().length > 0 ? (
                                getMonthlyData().map(({ date, record }) => {
                                    const isEditing = editingRecord === record?.id;
                                    const status = record?.status || 'Absent';
                                    const duration = calculateDuration(record?.checkInTime || null, record?.checkOutTime || null);
                                    const lateBy = calculateLateness(record?.checkInTime || null);

                                    return (
                                        <React.Fragment key={date}>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-800' :
                                                        status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-600">
                                                    {isEditing ? (
                                                        <input 
                                                            type="datetime-local" 
                                                            value={editForm.checkIn}
                                                            onChange={e => setEditForm({...editForm, checkIn: e.target.value})}
                                                            className="border rounded p-1 text-xs w-full bg-white"
                                                        />
                                                    ) : (
                                                        record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-600">
                                                    {isEditing ? (
                                                        <input 
                                                            type="datetime-local" 
                                                            value={editForm.checkOut}
                                                            onChange={e => setEditForm({...editForm, checkOut: e.target.value})}
                                                            className="border rounded p-1 text-xs w-full bg-white"
                                                        />
                                                    ) : (
                                                        record?.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">
                                                    {duration}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {lateBy !== '-' ? (
                                                        <span className="text-red-600 font-bold flex items-center text-xs">
                                                            <Clock className="w-3 h-3 mr-1" /> {lateBy}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                     <td className="px-6 py-4 text-right">
                                                        {record ? (
                                                            <div className="flex items-center justify-end space-x-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button onClick={() => handleSaveEdit(record.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors"><Save className="w-4 h-4" /></button>
                                                                        <button onClick={() => setEditingRecord(null)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => handleEditClick(record)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Edit Time"><Pencil className="w-4 h-4" /></button>
                                                                        {record.auditLogs && record.auditLogs.length > 0 && (
                                                                            <button 
                                                                                onClick={() => setShowHistory(showHistory === record.id ? null : record.id)} 
                                                                                className={`p-1.5 rounded-md transition-colors ${showHistory === record.id ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                                                title="View Audit History"
                                                                            >
                                                                                <History className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 italic">Absent</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                            {showHistory === record?.id && <AuditHistoryRow record={record} />}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                                    {selectedEmployeeId ? "No records found for this period." : "Select an employee to view the report."}
                                </td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Reports;