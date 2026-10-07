import React, { useState } from 'react';
import { Student } from '../types';
import { COURSES_LIST, SESSIONS_LIST, PAYMENT_METHODS } from '../constants';
import { addStudent, generateNextRollNo, recordPayment, getTransactions } from '../utils/storage';
import { UserPlus, CheckCircle, Calculator, Phone, User, BookOpen, Calendar, MapPin, Receipt, ArrowRight, Camera } from 'lucide-react';
import { formatPKR, amountInWords } from '../utils/numberToWords';

interface StudentAddProps {
  onStudentAdded: (student: Student, firstReceiptId?: string) => void;
  onNavigateToCollection: (studentId: string) => void;
}

export const StudentAdd: React.FC<StudentAddProps> = ({
  onStudentAdded,
  onNavigateToCollection
}) => {
  const [program, setProgram] = useState(COURSES_LIST[0]);
  const [customProgram, setCustomProgram] = useState('');
  const [session, setSession] = useState(SESSIONS_LIST[0]);
  const [customSession, setCustomSession] = useState('');
  const [rollNo, setRollNo] = useState(() => generateNextRollNo(COURSES_LIST[0]));
  const [regNo, setRegNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [admissionDate, setAdmissionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Fee Details
  const [totalAgreedFee, setTotalAgreedFee] = useState<number | ''>(150000);
  const [discount, setDiscount] = useState<number | ''>(0);

  // Optional initial fee deposit right at admission
  const [hasInitialDeposit, setHasInitialDeposit] = useState(false);
  const [initialAmount, setInitialAmount] = useState<number | ''>(40000);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [initialReference, setInitialReference] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const numericTotal = Number(totalAgreedFee) || 0;
  const numericDiscount = Number(discount) || 0;
  const netPayable = Math.max(0, numericTotal - numericDiscount);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Student image must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !fatherName.trim() || !phone.trim() || !rollNo.trim()) {
      setFormError('Please fill all required student details (Name, Father Name, Phone, Roll No).');
      return;
    }

    if (numericTotal <= 0) {
      setFormError('Total course fee must be greater than zero.');
      return;
    }

    if (session === 'Other' && !customSession.trim()) {
      setFormError('Please specify the manual/custom Session & Academic Batch name.');
      return;
    }

    if (program === 'Other' && !customProgram.trim()) {
      setFormError('Please specify the manual/custom Allied Health Course / Program name.');
      return;
    }

    setIsSubmitting(true);

    const selectedProgram = program === 'Other' && customProgram.trim() ? customProgram.trim() : program;
    const selectedSession = session === 'Other' && customSession.trim() ? customSession.trim() : session;

    try {
      const newStudent = addStudent({
        rollNo: rollNo.trim(),
        regNo: regNo.trim() || undefined,
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        phone: phone.trim(),
        guardianPhone: guardianPhone.trim() || undefined,
        cnic: cnic.trim() || 'Pending',
        program: selectedProgram,
        session: selectedSession,
        admissionDate,
        totalAgreedFee: numericTotal,
        discount: numericDiscount,
        netPayableFee: netPayable,
        address: address.trim() || 'Nowshera Virkan',
        status: 'active',
        notes: notes.trim() || undefined,
        photo: photo || undefined
      });

      let firstReceiptId: string | undefined;

      // If initial deposit made
      if (hasInitialDeposit && Number(initialAmount) > 0) {
        const tx = recordPayment({
          studentId: newStudent.id,
          amount: Number(initialAmount),
          paymentMethod: initialPaymentMethod,
          referenceNo: initialReference.trim() || undefined,
          remarks: 'Admission & Initial Registration Fee',
          date: admissionDate,
          receivedBy: 'Admission Counter'
        });
        firstReceiptId = tx.id;
      }

      setSuccessMessage(`Student ${newStudent.fullName} registered successfully! Roll No: ${newStudent.rollNo}`);
      onStudentAdded(newStudent, firstReceiptId);
    } catch (err: any) {
      setFormError(err.message || 'Error adding student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setProgram(COURSES_LIST[0]);
    setCustomProgram('');
    setSession(SESSIONS_LIST[0]);
    setCustomSession('');
    setRollNo(generateNextRollNo(COURSES_LIST[0]));
    setFullName('');
    setFatherName('');
    setPhone('');
    setGuardianPhone('');
    setCnic('');
    setAddress('');
    setNotes('');
    setRegNo('');
    setTotalAgreedFee(150000);
    setDiscount(0);
    setHasInitialDeposit(false);
    setInitialAmount(40000);
    setPhoto(null);
    setSuccessMessage(null);
    setFormError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
            Student Admissions & Registration
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Add New Student
          </h2>
          <p className="text-sm text-slate-500">
            City Con & Allied Health Sciences Nowshera Virkan · Mutto Bahikay Road
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRollNo(generateNextRollNo(program));
          }}
          className="text-xs text-red-800 bg-red-50 hover:bg-red-100 border border-red-300 font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Auto-Generate Next Roll #
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">{successMessage}</span>
          </div>
          <button
            onClick={handleResetForm}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Add Another Student
          </button>
        </div>
      )}

      {formError && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-800 text-sm font-semibold">
          ⚠️ {formError}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Section 1: Academic & Roll Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-base">Academic & Program Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. CCN-2024-001"
              />
              <span className="text-[11px] text-slate-400">Used for searching & receipt vouchers</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registration / Council No. (Optional)
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. PB-PC-2401 or Board Reg #"
              />
              <span className="text-[11px] text-slate-400">Pharmacy Council / Punjab Medical Faculty</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Session / Academic Batch <span className="text-rose-500">*</span>
                </label>
                {session !== 'Other' ? (
                  <button
                    type="button"
                    onClick={() => setSession('Other')}
                    className="text-[11px] text-red-700 hover:text-red-900 font-semibold cursor-pointer"
                  >
                    + Manual Entry
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setSession(SESSIONS_LIST[0]); setCustomSession(''); }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Choose from list
                  </button>
                )}
              </div>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none bg-white"
              >
                {SESSIONS_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">✏️ Other / Manual Entry (Not in list)</option>
              </select>
              {session === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customSession}
                    onChange={(e) => setCustomSession(e.target.value)}
                    placeholder="Enter Custom Session (e.g. 2026-2029)..."
                    className="w-full px-3 py-2 border border-red-400 bg-red-50/20 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none font-medium"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Format: Year-Year (e.g., 2026-2029)</span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Course / Allied Health Program <span className="text-rose-500">*</span>
                </label>
                {program !== 'Other' ? (
                  <button
                    type="button"
                    onClick={() => setProgram('Other')}
                    className="text-[11px] text-red-700 hover:text-red-900 font-semibold cursor-pointer"
                  >
                    + Manual Entry
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setProgram(COURSES_LIST[0]); setCustomProgram(''); }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Choose from list
                  </button>
                )}
              </div>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none bg-white"
              >
                {COURSES_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">✏️ Other / Manual Entry (Not in list)</option>
              </select>
              {program === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customProgram}
                    onChange={(e) => setCustomProgram(e.target.value)}
                    placeholder="Enter Custom Program Name (e.g. Doctor of Physical Therapy)..."
                    className="w-full px-3 py-2 border border-red-400 bg-red-50/20 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none font-medium"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Custom program title will appear on vouchers & ledgers</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Student Particulars */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <User className="w-5 h-5 text-red-700" />
            <h3 className="font-bold text-slate-800 text-base">Student Personal Particulars</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Optional Student Picture Upload */}
            <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {photo ? (
                  <img src={photo} alt="Student preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <User className="w-8 h-8" />
                    <span className="text-[9px] font-semibold mt-0.5">Photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <label className="text-xs font-bold text-slate-800">
                    Student Photograph
                  </label>
                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload student passport-size photo for official vouchers and ID ledger (JPG, PNG, max 2MB).
                </p>
                <div className="mt-2.5 flex items-center justify-center sm:justify-start space-x-2">
                  <label className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors inline-flex items-center space-x-1">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>{photo ? 'Change Picture' : 'Upload Picture'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                placeholder="e.g. Muhammad Usman Ali"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Father's Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. Tariq Mehmood"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC / B-Form Number
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. 34101-1234567-1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. 0300-1234567"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Father / Guardian Mobile Number
              </label>
              <input
                type="text"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. 0321-8420446"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address / Area
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. Mutto Bahikay Road, Nowshera Virkan"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Total Agreed Course Fee Package & Concession */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-base">Course Fee Structure & Agreed Package</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Agreed Course Fee (PKR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="numeric"
                  required
                  value={totalAgreedFee}
                  onChange={(e) => setTotalAgreedFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-base font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="150000"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Total tuition + admission package agreed
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount / Concession / Scholarship (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="numeric"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-base font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Leave 0 if no scholarship or discount
              </span>
            </div>

            {/* Calculated Net Payable */}
            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4">
              <span className="text-xs uppercase tracking-wider text-red-900 font-bold">
                Net Final Payable Fee
              </span>
              <div className="text-2xl font-extrabold text-red-950 font-mono mt-1">
                {formatPKR(netPayable)}
              </div>
              <p className="text-[11px] text-red-800 mt-1 italic">
                {amountInWords(netPayable)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admission Notes / Scholarship Reason (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Granted Rs. 10,000 concession by Chairman on high matric marks"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 4: Initial Fee Deposit at Admission (Optional) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-red-700" />
              <h3 className="font-bold text-slate-800 text-base">
                Initial Fee Deposit at Admission Time
              </h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasInitialDeposit}
                onChange={(e) => setHasInitialDeposit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-700"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                Deposit fee now (Auto-generates double receipt)
              </span>
            </label>
          </div>

          {hasInitialDeposit ? (
            <div className="bg-red-50/40 border border-red-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Deposited Amount Now (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="numeric"
                    required={hasInitialDeposit}
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 border border-red-300 rounded-lg text-base font-mono font-bold text-red-950 focus:ring-2 focus:ring-red-600 focus:outline-none bg-white"
                    placeholder="40000"
                  />
                </div>
                <span className="text-[11px] text-red-900 mt-1 block">
                  Remaining will be:{' '}
                  <span className="font-bold">
                    {formatPKR(Math.max(0, netPayable - (Number(initialAmount) || 0)))}
                  </span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Payment Mode
                </label>
                <select
                  value={initialPaymentMethod}
                  onChange={(e) => setInitialPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Reference / Transaction No. (Optional)
                </label>
                <input
                  type="text"
                  value={initialReference}
                  onChange={(e) => setInitialReference(e.target.value)}
                  placeholder="e.g. JazzCash ID or Cheque #"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Toggle this on if the student is making an initial installment or admission deposit right now. Otherwise, you can record fees anytime on the Fee Collection page.
            </p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Clear / Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Registering Student...' : 'Register Student & Save Record'}
          </button>
        </div>
      </form>
    </div>
  );
};
