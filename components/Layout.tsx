import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  LayoutDashboard, 
  MapPin, 
  DollarSign, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Bot,
  Bell,
  FileBarChart,
  Info
} from 'lucide-react';
import { UserRole } from '../types';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 print:hidden
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide">GeoAttend</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
            <div className="mb-6 px-4 py-3 bg-slate-800 rounded-xl flex items-center space-x-3">
                <img src={user?.avatarUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-blue-500" />
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.role}</p>
                </div>
            </div>

            <nav className="space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/mark-attendance" icon={MapPin} label="Mark Attendance" />
            <NavItem to="/salary-slips" icon={DollarSign} label="Salary Slips" />
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
                <>
                    <NavItem to="/employees" icon={Users} label="Employees" />
                    <NavItem to="/reports" icon={FileBarChart} label="Reports" />
                </>
            )}
            <NavItem to="/ai-assistant" icon={Bot} label="AI Assistant" />
            </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b flex items-center justify-between px-6 z-10 print:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto relative">
            {/* Notifications */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
                >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700 text-sm">Notifications</h3>
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{notifications.length}</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No new notifications</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-1.5 rounded-full mt-0.5 ${
                                                notif.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {notif.type === 'alert' ? <Info className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                                                <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(notif.date).toDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;