import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { Clock, Calendar, CheckCircle, AlertTriangle, Users, Filter } from 'lucide-react';

const COLORS = ['#22c55e', '#ef4444', '#eab308', '#3b82f6'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { attendance, users } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter attendance for the selected date
  const dailyRecords = attendance.filter(a => a.date === selectedDate);
  
  // Stats Calculation
  const presentCount = dailyRecords.filter(a => a.status === 'Present').length;
  const lateCount = dailyRecords.filter(a => a.status === 'Late').length;
  const absentCount = dailyRecords.filter(a => a.status === 'Absent').length;
  const totalTracked = presentCount + lateCount + absentCount;
  
  // For Employee View: Total Employees is just 1 (themselves)
  // For Admin View: Total Employees is the full list count
  const totalEmployees = users.length;

  // User's specific status for today (for the header)
  const userRecordForDate = attendance.find(a => a.date === selectedDate && a.userId === user?.id);

  const statusData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: absentCount },
    { name: 'Late', value: lateCount },
  ];

  // Only show chart if there is data
  const hasData = statusData.some(d => d.value > 0);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 text-white`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}</h1>
            <p className="text-slate-500">Overview for {new Date(selectedDate).toDateString()}</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-600 mr-2 font-medium">Filter Date:</span>
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm text-slate-800 focus:outline-none bg-transparent font-medium"
            />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Employees" 
            value={totalEmployees} 
            icon={Users} 
            color="bg-blue-500" 
            subtext="Registered in system"
        />
        <StatCard 
            title="Present Today" 
            value={presentCount} 
            icon={CheckCircle} 
            color="bg-green-500" 
            subtext={`Checked in on ${selectedDate.split('-')[2]}`}
        />
        <StatCard 
            title="Late Arrivals" 
            value={lateCount} 
            icon={Clock} 
            color="bg-yellow-500" 
        />
        <StatCard 
            title="Absences" 
            value={absentCount} 
            icon={AlertTriangle} 
            color="bg-red-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Attendance Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <RechartsTooltip />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center text-slate-400">
                    <PieChart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No data for selected date</p>
                </div>
            )}
          </div>
          {hasData && (
            <div className="flex justify-center space-x-4 text-sm mt-4">
                {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[index]}}></span>
                        {entry.name}: {entry.value}
                    </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Log ({selectedDate})</h3>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                {dailyRecords.length > 0 ? (
                    dailyRecords.slice().reverse().map((rec) => {
                        const recUser = users.find(u => u.id === rec.userId);
                        return (
                            <div key={rec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        rec.status === 'Present' ? 'bg-green-500' : 
                                        rec.status === 'Late' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{recUser?.name || 'Unknown User'}</p>
                                        <p className="text-xs text-slate-500">
                                            {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No Check-in'}
                                            {' - '}
                                            {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Working'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    rec.status === 'Present' ? 'bg-green-100 text-green-700' : 
                                    rec.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {rec.status}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>No activity recorded for this date.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;