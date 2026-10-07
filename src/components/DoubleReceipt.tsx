import React, { useRef, useState } from 'react';
import { Student, FeeTransaction } from '../types';
import { INSTITUTE_INFO } from '../constants';
import { amountInWords, formatPKR } from '../utils/numberToWords';
import { Printer, X, Download, ShieldCheck, CheckCircle2, FileText, Loader2, User } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from './Logo';

interface DoubleReceiptProps {
  student: Student;
  currentTransaction: FeeTransaction;
  allTransactions: FeeTransaction[]; // all past & current deposits for this student
  onClose?: () => void;
}

export const DoubleReceipt: React.FC<DoubleReceiptProps> = ({
  student,
  currentTransaction,
  allTransactions,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Sort transactions chronologically
  const sortedHistory = [...allTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalPaidToDate = sortedHistory.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const remainingBalance = Math.max(0, (student.netPayableFee || 0) - totalPaidToDate);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Capture element as high-res canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // Standard A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const printableWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, Math.min(imgHeight, pageHeight - (margin * 2)));
      pdf.save(`CityCon_Receipt_${currentTransaction.receiptNo}_${student.rollNo}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to print dialog if canvas fails
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderSingleVoucher = (copyLabel: 'STUDENT COPY' | 'OFFICE / ACCOUNTS COPY') => {
    return (
      <div className="voucher-copy bg-white border border-slate-300 rounded p-4 text-xs font-sans text-slate-800 shadow-sm relative flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="border-b-2 border-slate-700 pb-2 mb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-0.5 rounded-full bg-slate-50 border border-slate-300 shrink-0">
                  <Logo size="md" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                    {INSTITUTE_INFO.name}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                    {INSTITUTE_INFO.subtitle}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-red-100 text-red-950 font-bold rounded text-[10px] uppercase tracking-wider border border-red-300">
                  {copyLabel}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  RCP: <span className="font-bold text-slate-900">{currentTransaction.receiptNo}</span>
                </p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap justify-between items-center text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span>📍 {INSTITUTE_INFO.address}</span>
              <span className="font-semibold text-slate-800">
                📞 {INSTITUTE_INFO.phones.join('  |  ')}
              </span>
            </div>
          </div>

          {/* Student & Receipt Meta Grid (with optional Student Photo) */}
          <div className="flex items-start gap-3 mb-2 bg-slate-50/70 p-2 rounded border border-slate-200 text-[11px]">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 flex-1">
              <div>
                <span className="text-slate-500 font-medium">Roll No:</span>{' '}
                <span className="font-bold text-slate-900">{student.rollNo}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Receipt Date:</span>{' '}
                <span className="font-bold text-slate-900">{currentTransaction.date}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Student Name:</span>{' '}
                <span className="font-bold text-slate-900 uppercase">{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Father's Name:</span>{' '}
                <span className="font-semibold text-slate-900">{student.fatherName}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Program/Course:</span>{' '}
                <span className="font-bold text-red-950">{student.program}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Session / Batch:</span>{' '}
                <span className="font-semibold text-slate-900">{student.session}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Payment Mode:</span>{' '}
                <span className="font-semibold text-slate-900">
                  {currentTransaction.paymentMethod}
                  {currentTransaction.referenceNo ? ` (${currentTransaction.referenceNo})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Contact:</span>{' '}
                <span className="font-semibold text-slate-900">{student.phone}</span>
              </div>
            </div>

            {student.photo && (
              <div className="w-14 h-16 rounded border border-slate-300 bg-white p-0.5 overflow-hidden shrink-0 shadow-2xs">
                <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover rounded-xs" />
              </div>
            )}
          </div>

          {/* Current Deposited Box (Highlighted) */}
          <div className="bg-red-50 border border-red-300 rounded p-2 mb-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-900">
                Current Deposited Amount
              </div>
              <div className="text-base font-extrabold text-red-950 font-mono">
                {formatPKR(currentTransaction.amount)}
              </div>
              <div className="text-[10px] text-red-900 italic">
                In words: <span className="font-semibold">{amountInWords(currentTransaction.amount)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-xs font-bold text-red-900 bg-red-100 px-2 py-1 rounded border border-red-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-red-700" />
                VERIFIED PAYMENT
              </span>
              {currentTransaction.remarks && (
                <p className="text-[10px] text-slate-600 mt-1 max-w-[150px] truncate">
                  Note: {currentTransaction.remarks}
                </p>
              )}
            </div>
          </div>

          {/* History of all deposited record with remaining balance */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <span className="w-1.5 h-1.5 bg-red-700 rounded-full mr-1"></span>
                History of Deposited Records & Account Ledger
              </h4>
              <span className="text-[10px] text-slate-500">
                Total Deposits: {sortedHistory.length}
              </span>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                    <th className="py-1 px-1.5 w-6 text-center">#</th>
                    <th className="py-1 px-1.5">Date</th>
                    <th className="py-1 px-1.5">Receipt #</th>
                    <th className="py-1 px-1.5">Mode</th>
                    <th className="py-1 px-1.5 text-right">Deposited</th>
                    <th className="py-1 px-1.5 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedHistory.map((rec, idx) => {
                    const isCurrent = rec.id === currentTransaction.id;
                    return (
                      <tr
                        key={rec.id || idx}
                        className={isCurrent ? 'bg-red-50 font-bold text-slate-900' : 'text-slate-700'}
                      >
                        <td className="py-1 px-1.5 text-center">{idx + 1}</td>
                        <td className="py-1 px-1.5 whitespace-nowrap">{rec.date}</td>
                        <td className="py-1 px-1.5 font-mono text-[9.5px]">
                          {rec.receiptNo}
                          {isCurrent && <span className="ml-1 text-[9px] text-red-700">(Current)</span>}
                        </td>
                        <td className="py-1 px-1.5">{rec.paymentMethod}</td>
                        <td className="py-1 px-1.5 text-right font-mono font-semibold">
                          {formatPKR(rec.amount)}
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono text-slate-600">
                          {formatPKR(rec.remainingBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Balance Summary (Total Course Fee removed as requested) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-100 p-2.5 rounded border border-slate-300 text-center mb-2">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-red-800 font-semibold">
                Total Deposited To Date
              </div>
              <div className="text-xs sm:text-sm font-bold text-red-950 font-mono mt-0.5">
                {formatPKR(totalPaidToDate)}
              </div>
            </div>
            <div className="border-l border-slate-300 pl-2">
              <div className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
                Current Remaining Balance
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-red-700 font-mono mt-0.5">
                {formatPKR(remainingBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className="mt-2 pt-2 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600">
            <div>
              <div className="h-6 border-b border-dashed border-slate-400 mb-0.5"></div>
              <span>Student / Depositor</span>
            </div>
            <div className="flex flex-col items-center justify-end">
              <span className="text-[9px] text-slate-400 italic">Institute Stamp</span>
            </div>
            <div>
              <div className="h-6 border-b border-dashed border-slate-400 mb-0.5"></div>
              <span className="font-semibold text-slate-800">Accounts Officer</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 text-center mt-1">
            * This receipt is computer generated. Please keep this copy safe for future reference and exam slip clearance.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Official Fee Receipt Voucher (Double Copy)
              </h3>
              <p className="text-xs text-slate-400">
                Receipt #{currentTransaction.receiptNo} · {student.fullName} ({student.rollNo})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 1. Direct PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center px-4 py-2 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Download clean A4 PDF file of double copy voucher"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  Download PDF
                </>
              )}
            </button>

            {/* 2. Direct Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer border border-slate-700"
              title="Print voucher or save as PDF via system dialog"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-300" />
              Print Receipt
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Double Copy Container (Attached to ref for PDF & #printable-double-receipt for print isolation) */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
          <div 
            ref={receiptRef}
            id="printable-double-receipt"
            className="max-w-4xl mx-auto space-y-4 bg-white p-4 rounded-xl border border-slate-200"
          >
            {/* COPY 1: STUDENT COPY */}
            <div>
              {renderSingleVoucher('STUDENT COPY')}
            </div>

            {/* Perforated Divider Line */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="border-t-2 border-dashed border-slate-400 w-full"></div>
              <span className="bg-white px-3 text-[10px] text-slate-500 font-mono uppercase tracking-wider absolute flex items-center space-x-1">
                <span>✂</span>
                <span>Cut Along Dotted Line (Student Copy Above / Institute Copy Below)</span>
                <span>✂</span>
              </span>
            </div>

            {/* COPY 2: OFFICE / ACCOUNTS COPY */}
            <div>
              {renderSingleVoucher('OFFICE / ACCOUNTS COPY')}
            </div>
          </div>
        </div>

        {/* Bottom Bar Info */}
        <div className="no-print bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Complete history of all deposited installments is permanently logged.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline"
            >
              Export as PDF
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 rounded font-medium cursor-pointer"
            >
              Close Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
