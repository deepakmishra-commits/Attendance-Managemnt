import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Mail, Briefcase, DollarSign, X, UserPlus, UserCheck } from 'lucide-react';
import { UserRole, User } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

const EmployeesList: React.FC = () => {
  const { users, addNewUser } = useData();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    designation: '',
    baseSalary: 500000,
    joinDate: new Date().toISOString().split('T')[0]
  });

  const canEdit = currentUser?.role === UserRole.ADMIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addNewUser(formData);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: UserRole.EMPLOYEE,
        department: 'Engineering',
        designation: '',
        baseSalary: 500000,
        joinDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Failed to add user", error);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Employee Directory</h1>
        {canEdit && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm flex items-center"
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(employee => (
            <div key={employee.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <img src={employee.avatarUrl} alt={employee.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 group-hover:border-blue-200 transition-colors" />
                        <div>
                            <h3 className="font-bold text-slate-800">{employee.name}</h3>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                employee.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                                employee.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {employee.role}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                        {employee.designation} <span className="text-slate-300 mx-1">|</span> {employee.department}
                    </div>
                    <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-slate-400" />
                        {employee.email}
                    </div>
                     {currentUser?.role === UserRole.ADMIN && (
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                            {CURRENCY_SYMBOL}{employee.baseSalary.toLocaleString()}/yr
                        </div>
                     )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">View Profile</button>
                </div>
            </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                        Add New Employee
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Sarah Connor"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. sarah@techflow.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select 
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value={UserRole.EMPLOYEE}>Employee</option>
                                <option value={UserRole.MANAGER}>Manager</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                            <select 
                                value={formData.department}
                                onChange={e => setFormData({...formData, department: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="Engineering">Engineering</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="HR">HR</option>
                                <option value="Management">Management</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                            <input 
                                type="text" 
                                required
                                value={formData.designation}
                                onChange={e => setFormData({...formData, designation: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. UX Designer"
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Join Date</label>
                             <input 
                                type="date" 
                                required
                                value={formData.joinDate}
                                onChange={e => setFormData({...formData, joinDate: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                             />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (Yearly)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-400">{CURRENCY_SYMBOL}</span>
                            </div>
                            <input 
                                type="number" 
                                required
                                value={formData.baseSalary}
                                onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                                className="w-full pl-8 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            Create Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;