import { DuesPayment } from '../types';

export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);
  
  let currentYear = startYear;
  let currentMonth = startMonthNum;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonthNum)) {
    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return months;
}

export function getMemberPaidMonths(payments: DuesPayment[]): Set<string> {
  const paidMonths = new Set<string>();
  
  payments
    .filter(p => p.status === 'completed')
    .forEach(p => {
      if (p.payment_for_month && p.payment_end_month) {
        const months = generateMonthRange(p.payment_for_month, p.payment_end_month);
        months.forEach(m => paidMonths.add(m));
      } else if (p.payment_month) {
        // Fallback for old format - try to parse YYYY-MM from payment_month string
        const match = p.payment_month.match(/\d{4}-\d{2}/);
        if (match) {
          paidMonths.add(match[0]);
        }
      }
    });
  
  return paidMonths;
}

export function getOutstandingMonths(
  membershipDate: Date | undefined,
  payments: DuesPayment[],
  asOfMonth?: string
): string[] {
  if (!membershipDate || isNaN(membershipDate.getTime())) {
    return [];
  }
  
  const startYear = membershipDate.getFullYear();
  const startMonth = membershipDate.getMonth() + 1;
  const startMonthStr = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  
  const now = new Date();
  const endMonthStr = asOfMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const allMonths = generateMonthRange(startMonthStr, endMonthStr);
  const paidMonths = getMemberPaidMonths(payments);
  
  return allMonths.filter(month => !paidMonths.has(month));
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return monthStr;
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
