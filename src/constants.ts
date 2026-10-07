import { InstituteInfo } from './types';

export const INSTITUTE_INFO: InstituteInfo = {
  name: "City Con & Allied Health Sciences",
  subtitle: "Nowshera Virkan",
  address: "Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan",
  phones: ["0302-6605216", "0321-8420446"],
  email: "cityconn.health@gmail.com",
  regNote: "Affiliated / Approved Allied Health Sciences Institute"
};

export const COURSES_LIST = [
  "Pharmacy Technician (Category-B)",
  "Dispenser Course",
  "Medical Laboratory Technology (MLT)",
  "Operation Theater Technology (OTT)",
  "Radiography & Imaging Technology (RIT)",
  "Nursing Assistant",
  "Lady Health Visitor (LHV)",
  "Dental Hygienist & Technology",
  "Physiotherapy Technician"
];

export const SESSIONS_LIST = [
  "2024-2026",
  "2025-2027",
  "2023-2025",
  "2024-2025",
  "2025-2026",
  "2026-2028"
];

export const PAYMENT_METHODS = [
  "Cash",
  "EasyPaisa",
  "JazzCash",
  "Bank Transfer",
  "Cheque"
] as const;
