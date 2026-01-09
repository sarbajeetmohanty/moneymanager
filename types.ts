
export type PaymentMode = 'Cash' | 'Online';
export type TransactionType = 'Income' | 'Expense' | 'Money Given' | 'Money Taken' | 'He Paid Back' | 'I Paid Back' | 'Split';
export type TransactionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Paid';
export type SplitType = 'Equal' | 'Custom';
export type AppMode = 'light' | 'dark';

export interface Category {
  name: string;
  subcategories: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  upiId?: string;
  isVerified: boolean;
  budget: number;
  theme: string;
  mode: AppMode;
  stylePreset: string;
  categories: Category[];
}

export interface Friend {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  isManual: boolean;
  status: 'Settled' | 'Pending';
  balance: number;
}

export interface Transaction {
  id: string;
  creatorId: string;
  type: TransactionType;
  amount: number;
  paidAmount: number;
  mode: PaymentMode;
  category: string;
  subcategory?: string;
  notes: string;
  receiptURL?: string;
  timestamp: string;
  status: TransactionStatus;
  participants: Participant[];
  payerId: string;
  friendId?: string;
}

export interface Participant {
  userId: string;
  name: string;
  share: number;
  paidAmount: number;
  hasPaid: boolean;
  isConfirmed: boolean;
}

export interface Notification {
  id: string;
  targetUserId: string;
  senderId: string;
  senderName: string;
  type: 'FriendRequest' | 'FriendRequestRejected' | 'TransactionApproval' | 'PaymentConfirmation' | 'Reminder' | 'System';
  message: string;
  transactionId?: string;
  amount?: number;
  remainingAmount?: number;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
}
