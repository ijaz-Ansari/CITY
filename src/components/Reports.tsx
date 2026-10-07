import React, { useState, useMemo, useRef } from 'react';
import { getTransactions, getStudents } from '../utils/storage';
import { INSTITUTE_INFO, COURSES_LIST } from '../constants';
import { formatPKR } from '../utils/numberToWords';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  CreditCard, 
  Filter, 
  ArrowUpRight, 
  FileSpreadsheet,
  Building2,
  CalendarRange
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Reports: React.FC = () => {
  const allTransactions = useMemo(() => getTransactions(), []);
  const allStudents = useMemo(() => getStudents(), []);

  // Student map for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map();
    allStudents.forEach((s) => map.set(s.id, s));
    return map;
  }, [allStudents]);

  // Determine earliest and latest dates
  const today = new Date().toISOString().split('T')[0];
  const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  // Filter State
  const [filterPreset, setFilterPreset] = useState<'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all' | 'custom'>('this-month');
  const [startDate, setStartDate] = useState<string>(firstDayThisMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedProgram, setSelectedProgram] = useState<string>('All');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Handle Preset changes
  const applyPreset = (preset: 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all') => {
    setFilterPreset(preset);
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    if (preset === 'this-month') {
      const start = new Date(currYear, currMonth, 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(today);
    } else if (preset === 'last-month') {
      const start = new Date(currYear, currMonth - 1, 1).toISOString().split('T')[0];
      const end = new Date(currYear, currMonth, 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'last-3-months') {
      const start = new Date(currYear, currMonth - 2, 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(today);
    } else if (preset === 'last-6-months') {
      const start = new Date(currYear, currMonth - 5, 1).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(today);
    } else if (preset === 'this-year') {
      const start = `${currYear}-01-01`;
      setStartDate(start);
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(today);
    }
  };

  // Filtered Transactions
  const filteredTxs = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Date filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Method filter
      if (selectedMethod !== 'All' && tx.paymentMethod !== selectedMethod) return false;

      // Program filter
      if (selectedProgram !== 'All') {
        const student = studentMap.get(tx.studentId);
        if (student && student.program !== selectedProgram) return false;
      }

      return true;
    });
  }, [allTransactions, startDate, endDate, selectedMethod, selectedProgram, studentMap]);

  // Overall Metrics
  const totalAmountCollected = useMemo(() => {
    return filteredTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [filteredTxs]);

  const totalReceiptsCount = filteredTxs.length;
  const averagePerReceipt = totalReceiptsCount > 0 ? totalAmountCollected / totalReceiptsCount : 0;

  // Monthly Grouping
  const monthlySummary = useMemo(() => {
    const monthsMap = new Map<string, {
      monthKey: string;
      monthLabel: string;
      total: number;
      count: number;
      methods: { [key: string]: number };
      transactions: typeof filteredTxs;
    }>();

    filteredTxs.forEach((tx) => {
      const dateObj = new Date(tx.date);
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          monthKey,
          monthLabel,
          total: 0,
          count: 0,
          methods: {},
          transactions: []
        });
      }

      const m = monthsMap.get(monthKey)!;
      m.total += Number(tx.amount || 0);
      m.count += 1;
      m.methods[tx.paymentMethod] = (m.methods[tx.paymentMethod] || 0) + Number(tx.amount || 0);
      m.transactions.push(tx);
    });

    // Return sorted descending by month
    return Array.from(monthsMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredTxs]);

  // Program Breakdown in the selected range
  const programBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filteredTxs.forEach((tx) => {
      const st = studentMap.get(tx.studentId);
      const prog = st?.program || 'Other Course';
      if (!map.has(prog)) {
        map.set(prog, { total: 0, count: 0 });
      }
      const p = map.get(prog)!;
      p.total += Number(tx.amount || 0);
      p.count += 1;
    });

    return Array.from(map.entries())
      .map(([program, data]) => ({ program, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs, studentMap]);

  // Payment Method Breakdown
  const methodBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredTxs.forEach((tx) => {
      map.set(tx.paymentMethod, (map.get(tx.paymentMethod) || 0) + Number(tx.amount || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredTxs]);

  // Export to CSV for Excel
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Receipt No,Date,Student Name,Roll No,Course,Payment Method,Reference No,Amount (PKR),Remarks,Remaining Balance\n';

    filteredTxs.forEach((tx) => {
      const st = studentMap.get(tx.studentId);
      const row = [
        `"${tx.receiptNo}"`,
        `"${tx.date}"`,
        `"${st?.fullName || 'N/A'}"`,
        `"${st?.rollNo || 'N/A'}"`,
        `"${st?.program || 'N/A'}"`,
        `"${tx.paymentMethod}"`,
        `"${tx.referenceNo || ''}"`,
        tx.amount,
        `"${tx.remarks || ''}"`,
        tx.remainingBalance
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CityCon_MonthlyCollectionReport_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleDownloadPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);

    try {
      const canvas = await html2canvas(reportContainerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const printableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, Math.min(imgHeight, pageHeight - margin * 2));
      pdf.save(`CityCon_FeeCollectionReport_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Financial Audit & Analytics
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Monthly Collection Summary Report
          </h2>
          <p className="text-sm text-slate-500">
            {INSTITUTE_INFO.name} · {INSTITUTE_INFO.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-700" />
            Export Excel (CSV)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isExportingPdf ? 'Generating PDF...' : 'Download Report PDF'}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5 text-slate-300" />
            Print Report
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Date Range & Presets
            </h3>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => applyPreset('this-month')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterPreset === 'this-month' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset('last-month')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterPreset === 'last-month' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => applyPreset('last-3-months')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterPreset === 'last-3-months' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 3 Months
            </button>
            <button
              onClick={() => applyPreset('last-6-months')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterPreset === 'last-6-months' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => applyPreset('this-year')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterPreset === 'this-year' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => applyPreset('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterPreset === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        {/* Custom Date Pickers & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">From Date (Start):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilterPreset('custom');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">To Date (End):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilterPreset('custom');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Course / Program:</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="All">All Courses</option>
              {COURSES_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Payment Mode:</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="All">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Root Container */}
      <div 
        ref={reportContainerRef}
        id="printable-report-container"
        className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs"
      >
        {/* Official Institute Report Header */}
        <div className="border-b-2 border-emerald-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white font-extrabold flex flex-col items-center justify-center border border-emerald-950 shadow-xs">
                <span className="text-xs text-emerald-300">CITY</span>
                <span className="text-[10px]">CON</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
                  {INSTITUTE_INFO.name}
                </h1>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  {INSTITUTE_INFO.subtitle} · Accounts & Finance Department
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  📍 {INSTITUTE_INFO.address} · 📞 {INSTITUTE_INFO.phones.join('  |  ')}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold rounded-md text-xs uppercase tracking-wider border border-emerald-300">
                Monthly Collection Report
              </span>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                Period: <strong className="text-slate-900">{startDate}</strong> to <strong className="text-slate-900">{endDate}</strong>
              </p>
              <p className="text-[10px] text-slate-400">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total Fees Collected
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-950 mt-1.5">
              {formatPKR(totalAmountCollected)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              In selected date range
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Receipts Issued
              </span>
              <CreditCard className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1.5">
              {totalReceiptsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Fee transactions recorded
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Average Per Receipt
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1.5">
              {formatPKR(averagePerReceipt)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Average deposit installment
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Active Months
              </span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1.5">
              {monthlySummary.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Monthly periods with collections
            </div>
          </div>
        </div>

        {/* Section 1: Month-by-Month Collection Summary Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></span>
              Monthly Collection Breakdown ({monthlySummary.length} Months)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Net Total: <strong className="text-emerald-900 font-bold">{formatPKR(totalAmountCollected)}</strong>
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Month & Year</th>
                  <th className="py-2.5 px-4 text-center">Receipts Count</th>
                  <th className="py-2.5 px-4">Mode Breakdown</th>
                  <th className="py-2.5 px-4 text-right">Average / Trx</th>
                  <th className="py-2.5 px-4 text-right font-extrabold">Total Fee Collected</th>
                  <th className="py-2.5 px-4 text-right w-24">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlySummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No fee collections found for the selected date range ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  monthlySummary.map((m, idx) => {
                    const share = totalAmountCollected > 0 ? (m.total / totalAmountCollected) * 100 : 0;
                    const avg = m.count > 0 ? m.total / m.count : 0;
                    return (
                      <tr key={m.monthKey} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {m.monthLabel}
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            Period: {m.monthKey}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {m.count} receipts
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(m.methods).map(([method, amt]) => (
                              <span key={method} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                {method}: <strong className="font-mono">{formatPKR(amt)}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {formatPKR(avg)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-900 text-sm">
                          {formatPKR(m.total)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {share.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {monthlySummary.length > 0 && (
                <tfoot className="bg-emerald-900 text-white font-bold text-xs">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 uppercase tracking-wider">
                      Grand Total in Period
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {totalReceiptsCount} Receipts
                    </td>
                    <td className="py-3 px-4 font-normal text-emerald-200 text-[11px]">
                      {startDate} to {endDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatPKR(averagePerReceipt)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-emerald-300">
                      {formatPKR(totalAmountCollected)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Section 2: Program and Payment Method Side-by-Side Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Program Distribution */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>📚 Course-Wise Collections</span>
              <span className="text-[11px] text-slate-500">{programBreakdown.length} Programs</span>
            </h4>

            <div className="space-y-2">
              {programBreakdown.map((p) => {
                const pct = totalAmountCollected > 0 ? (p.total / totalAmountCollected) * 100 : 0;
                return (
                  <div key={p.program} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{p.program}</span>
                      <span className="font-mono font-extrabold text-emerald-900">
                        {formatPKR(p.total)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{p.count} Receipts</span>
                      <span className="font-mono">{pct.toFixed(1)}% of total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>💳 Payment Mode Breakdown</span>
              <span className="text-[11px] text-slate-500">{methodBreakdown.length} Modes</span>
            </h4>

            <div className="space-y-2">
              {methodBreakdown.map(([method, amt]) => {
                const pct = totalAmountCollected > 0 ? (amt / totalAmountCollected) * 100 : 0;
                return (
                  <div key={method} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{method}</span>
                      <span className="font-mono font-extrabold text-emerald-900">
                        {formatPKR(amt)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Channel: {method}</span>
                      <span className="font-mono">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Sign-off & Audit Stamp */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
          <div>
            <div className="h-8 border-b border-dashed border-slate-400 mb-1"></div>
            <span className="font-medium text-slate-700">Prepared by (Accounts)</span>
          </div>
          <div className="flex flex-col items-center justify-end">
            <span className="text-[10px] text-slate-400 italic">Institute Official Seal</span>
          </div>
          <div>
            <div className="h-8 border-b border-dashed border-slate-400 mb-1"></div>
            <span className="font-bold text-slate-900">Principal / Director Approval</span>
          </div>
        </div>
      </div>
    </div>
  );
};
