export interface Agent {
  id: string;
  name: string;
  pin: string;
  password: string;
  role: 'Field Agent' | 'Senior Manager';
  photoUrl?: string;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  agentName: string;
  timestamp: number;
  notes?: string;
  isNotPaid?: boolean;
}

export interface LoanTier {
  principal: number;
  label: string;
  options: {
    dailyAmount: number;
    weeks: number;
    days: number;
    interest: number;
    totalPayable: number;
  }[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  businessType: string;
  principal: number;
  dailyAmount: number;
  totalDays: number; // e.g. 40, 30, 25, 20
  interest: number;
  totalPayable: number;
  startDate: string; // YYYY-MM-DD
  status: 'Active' | 'Completed' | 'Defaulted';
  createdByAgent: string;
  createdAt: number;
  updatedByAgent?: string;
  updatedAt?: number;
  payments: PaymentRecord[];
  
  // New properties for "Already in Business" / Existing loans & arrears
  isExistingLoan?: boolean;
  remainingBalance?: number;
  finishDate?: string;
  missedDaysCount?: number;
}

