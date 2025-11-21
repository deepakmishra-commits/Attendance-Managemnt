import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Printer, DollarSign, Lock, Filter, Plus, CheckCircle } from 'lucide-react';
import { COMPANY_NAME, COMPANY_ADDRESS, CURRENCY_SYMBOL } from '../constants';
import { SalarySlip, UserRole, User } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SalarySlipGenerator: React.FC = () => {
  const { user } = useAuth();
  const { salarySlips, users, refreshData, calculatePreviewSlip, saveSalarySlip } = useData();
  
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Creation Form
  const [createForm, setCreateForm] = useState({
    userId: '',
    month: new Date().toISOString().slice(0, 7)
  });
  const [previewSlip, setPreviewSlip] = useState<SalarySlip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const filteredSlips = salarySlips.filter(s => {
     const matchesMonth = filterMonth ? s.month === filterMonth : true;
     // If admin, show all matching filter. If employee, show only theirs.
     // Note: context already filters by user ID for non-admins, but good to be safe.
     return matchesMonth;
  }).sort((a,b) => b.generatedDate.localeCompare(a.generatedDate));

  const totalPayout = filteredSlips.reduce((sum, slip) => sum + slip.netSalary, 0);

  const handlePreview = async () => {
      if (!createForm.userId) return;
      setIsProcessing(true);
      try {
          const slip = await calculatePreviewSlip(createForm.userId, createForm.month);
          setPreviewSlip(slip);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleGenerate = async () => {
      if (!previewSlip) return;
      setIsProcessing(true);
      try {
          await saveSalarySlip(previewSlip);
          setPreviewSlip(null);
          setViewMode('list');
          // Refresh triggers automatically in saveSalarySlip
      } finally {
          setIsProcessing(false);
      }
  };

  const downloadPDF = () => {
    const input = document.getElementById('printable-slip');
    if (!input) return;

    // Temporarily remove shadow/border for cleaner PDF
    input.style.boxShadow = 'none';
    input.style.border = 'none';

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SalarySlip_${selectedSlip?.month}.pdf`);
      
      // Restore styles
      input.style.boxShadow = '';
      input.style.border = '';
    });
  };

  const SalarySlipDesign = ({ slip, userData }: { slip: SalarySlip, userData: User | undefined }) => (
    <div id="printable-slip" className="bg-white p-10 max-w-3xl mx-auto text-slate-800 print:w-full print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">{COMPANY_NAME}</h1>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">{COMPANY_ADDRESS}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-semibold text-blue-600">Payslip</h2>
                <p className="text-lg font-medium text-slate-600 mt-1">{slip.month}</p>
            </div>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Employee Name</p>
                <p className="text-lg font-bold text-slate-800">{userData?.name || 'Unknown'}</p>
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Employee ID</p>
                <p className="text-lg font-mono text-slate-800">{userData?.id.toUpperCase()}</p>
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Designation</p>
                <p className="font-medium text-slate-700">{userData?.designation}</p>
            </div>
            <div>
                 <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Department</p>
                 <p className="font-medium text-slate-700">{userData?.department}</p>
            </div>
             <div>
                 <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pay Days</p>
                 <p className="font-medium text-slate-700">{slip.presentDays} / {slip.totalDays}</p>
            </div>
             <div>
                 <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Generated On</p>
                 <p className="font-medium text-slate-700">{new Date(slip.generatedDate).toLocaleDateString()}</p>
            </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="mb-8">
            <div className="grid grid-cols-2 gap-8">
                {/* Earnings */}
                <div>
                    <h3 className="text-sm font-bold uppercase text-slate-500 mb-3 border-b pb-2">Earnings</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Basic Salary</span>
                            <span className="font-medium">{CURRENCY_SYMBOL}{slip.basicSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">HRA</span>
                            <span className="font-medium">{CURRENCY_SYMBOL}{slip.hra.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Special/DA</span>
                            <span className="font-medium">{CURRENCY_SYMBOL}{slip.da.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Bonuses</span>
                            <span className="font-medium text-green-600">+{CURRENCY_SYMBOL}{slip.bonuses.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div>
                    <h3 className="text-sm font-bold uppercase text-slate-500 mb-3 border-b pb-2">Deductions</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Tax / TDS</span>
                            <span className="font-medium text-red-500">-{CURRENCY_SYMBOL}{slip.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Provident Fund / Other</span>
                            <span className="font-medium text-red-500">-{CURRENCY_SYMBOL}{slip.deductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Net Pay */}
        <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center shadow-lg print:shadow-none print:bg-slate-800 print:text-white">
            <div>
                <p className="text-sm opacity-80 uppercase font-semibold">Net Salary Payable</p>
                <p className="text-xs opacity-60">Transfer to Bank Account</p>
            </div>
            <span className="text-3xl font-bold">{CURRENCY_SYMBOL}{slip.netSalary.toLocaleString()}</span>
        </div>

        <div className="mt-12 text-center border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-400">This is a computer-generated document and does not require a physical signature.</p>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
        
        {/* Top Bar: Stats and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Salary Management</h1>
                <p className="text-sm text-slate-500">
                    {viewMode === 'list' ? 'View and manage employee payslips' : 'Generate new payslip'}
                </p>
            </div>
            
            {viewMode === 'list' && user?.role === UserRole.ADMIN && (
                 <button 
                    onClick={() => setViewMode('create')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Slip
                </button>
            )}
             {viewMode === 'create' && (
                 <button 
                    onClick={() => { setViewMode('list'); setPreviewSlip(null); setCreateForm({userId: '', month: filterMonth}); }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all"
                >
                    Cancel
                </button>
            )}
        </div>

        {/* Main Content */}
        {viewMode === 'list' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left: Filter & List */}
                <div className="lg:col-span-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-[calc(100vh-12rem)]">
                    {/* Summary Card */}
                    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <p className="text-sm opacity-70 mb-1">
                            {user?.role === UserRole.ADMIN ? 'Total Payout' : 'Total Earned'} ({new Date(filterMonth).toLocaleString('default', { month: 'long', year: 'numeric' })})
                        </p>
                        <p className="text-2xl font-bold">{CURRENCY_SYMBOL}{totalPayout.toLocaleString()}</p>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filter Period</label>
                        <div className="relative">
                            <input 
                                type="month" 
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredSlips.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p>No slips found for this period.</p>
                            </div>
                        ) : (
                            filteredSlips.map(slip => {
                                const slipUser = users.find(u => u.id === slip.userId);
                                return (
                                    <div 
                                        key={slip.id}
                                        onClick={() => setSelectedSlip(slip)}
                                        className={`p-3 rounded-lg cursor-pointer border transition-all hover:shadow-md ${
                                            selectedSlip?.id === slip.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{slipUser?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{slipUser?.department}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-700 text-sm">{CURRENCY_SYMBOL}{slip.netSalary.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(slip.generatedDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right: View Area */}
                <div className="lg:col-span-2 bg-slate-100 rounded-xl p-6 flex flex-col items-center justify-center overflow-hidden relative border border-slate-200">
                    {selectedSlip ? (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex justify-end space-x-2 mb-4 print:hidden">
                                <button onClick={() => window.print()} className="flex items-center px-3 py-2 bg-white text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 border border-slate-200 transition-colors text-sm">
                                    <Printer className="w-4 h-4 mr-2" /> Print
                                </button>
                                <button onClick={downloadPDF} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm">
                                    <Download className="w-4 h-4 mr-2" /> Download PDF
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                                <SalarySlipDesign slip={selectedSlip} userData={users.find(u => u.id === selectedSlip.userId)} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Select a salary slip to view details</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            /* Creation Mode */
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-4">1. Select Parameters</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                                    <select 
                                        value={createForm.userId}
                                        onChange={(e) => setCreateForm({...createForm, userId: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Employee</option>
                                        {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pay Period</label>
                                    <input 
                                        type="month"
                                        value={createForm.month}
                                        onChange={(e) => setCreateForm({...createForm, month: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handlePreview}
                                    disabled={!createForm.userId || isProcessing}
                                    className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex justify-center items-center"
                                >
                                    {isProcessing ? 'Calculating...' : 'Preview Calculation'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center items-center">
                        {previewSlip ? (
                            <div className="w-full text-center space-y-6">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Ready to Generate</h3>
                                    <p className="text-slate-500 text-sm">Review the calculated totals below.</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-lg border border-slate-100 text-left">
                                    <span className="text-slate-500">Payable Days:</span>
                                    <span className="font-bold text-right">{previewSlip.presentDays}</span>
                                    
                                    <span className="text-slate-500">Gross Earnings:</span>
                                    <span className="font-bold text-right">{CURRENCY_SYMBOL}{(previewSlip.basicSalary + previewSlip.hra + previewSlip.da).toLocaleString()}</span>
                                    
                                    <span className="text-slate-500">Deductions:</span>
                                    <span className="font-bold text-red-500 text-right">-{CURRENCY_SYMBOL}{(previewSlip.tax + previewSlip.deductions).toLocaleString()}</span>
                                    
                                    <span className="text-slate-800 font-bold border-t pt-2">Net Payable:</span>
                                    <span className="font-bold text-green-600 text-right border-t pt-2">{CURRENCY_SYMBOL}{previewSlip.netSalary.toLocaleString()}</span>
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg transition-transform transform active:scale-95 font-bold"
                                >
                                    {isProcessing ? 'Saving...' : 'Confirm & Generate Slip'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <p>Select parameters to preview calculation.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SalarySlipGenerator;