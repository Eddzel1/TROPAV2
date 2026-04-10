import { useMemo, useState } from 'react';
import { DuesPayment, Household, FamilyMember, ContributionRate } from '../../types';
import { CreditCard, TrendingUp, Calendar, Activity, PieChart, Printer } from 'lucide-react';
import { PrintFilterModal } from './PrintFilterModal';

interface PaymentReportProps {
    payments: DuesPayment[];
    members: FamilyMember[];
    households: Household[];
    summaryStats: {
        totalHouseholds: number;
        totalMembers: number;
        cooperativeMembers: number;
        totalPayments: number;
        totalRevenue: number;
        averagePayment: number;
        membershipRate: number;
    };
    contributionRates: ContributionRate[];
}

export function PaymentReport({ payments, members, households, summaryStats, contributionRates }: PaymentReportProps) {
    const [showPrintModal, setShowPrintModal] = useState(false);
    const paymentsByMethod = useMemo(() => {
        return payments.reduce((acc, p) => {
            acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [payments]);

    const paymentsByMonth = useMemo(() => {
        return payments.reduce((acc, p) => {
            const month = p.payment_date ? new Date(p.payment_date).toISOString().slice(0, 7) : 'Unknown';
            acc[month] = (acc[month] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [payments]);

    const paymentStatus = useMemo(() => {
        return payments.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [payments]);

    return (
        <div className="space-y-6">
            {showPrintModal && (
                <PrintFilterModal
                    mode="ledger"
                    households={households}
                    members={members}
                    payments={payments}
                    contributionRates={contributionRates}
                    onClose={() => setShowPrintModal(false)}
                />
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Revenue Overview
                    </h3>
                    <button
                        onClick={() => setShowPrintModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Print Payment Ledger
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="w-8 h-8 text-teal-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₱{summaryStats.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{summaryStats.totalPayments}</p>
                        <p className="text-sm text-gray-600">Total Transactions</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₱{summaryStats.averagePayment.toFixed(0)}</p>
                        <p className="text-sm text-gray-600">Average Payment</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Collection by Method
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(paymentsByMethod)
                            .sort(([, a], [, b]) => b - a)
                            .map(([method, amount]) => {
                                const pct = summaryStats.totalRevenue > 0 ? (amount / summaryStats.totalRevenue) * 100 : 0;
                                return (
                                    <div key={method} className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-medium text-gray-700">{method}</div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                                            <div className="bg-teal-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <div className="w-28 text-right text-sm font-medium text-gray-900">
                                            ₱{amount.toLocaleString()} ({pct.toFixed(1)}%)
                                        </div>
                                    </div>
                                );
                            })}
                        {Object.keys(paymentsByMethod).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No payment data available</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Payment Status
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(paymentStatus)
                            .sort(([, a], [, b]) => b - a)
                            .map(([status, amount]) => {
                                const pct = summaryStats.totalRevenue > 0 ? (amount / summaryStats.totalRevenue) * 100 : 0;
                                const colors: Record<string, string> = {
                                    completed: 'bg-green-500',
                                    pending: 'bg-amber-500',
                                    cancelled: 'bg-red-500'
                                };
                                return (
                                    <div key={status} className="flex items-center gap-4">
                                        <div className="w-20 text-sm font-medium text-gray-700 capitalize">{status}</div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                                            <div className={`${colors[status] || 'bg-gray-500'} h-3 rounded-full`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <div className="w-28 text-right text-sm font-medium text-gray-900">
                                            ₱{amount.toLocaleString()} ({pct.toFixed(1)}%)
                                        </div>
                                    </div>
                                );
                            })}
                        {Object.keys(paymentStatus).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No payment data available</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Revenue by Month
                </h3>
                <div className="space-y-4">
                    {Object.entries(paymentsByMonth)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([month, amount]) => {
                            const maxAmount = Math.max(...Object.values(paymentsByMonth), 1);
                            const pct = (amount / maxAmount) * 100;
                            return (
                                <div key={month} className="flex items-center gap-4">
                                    <div className="w-20 text-sm font-medium text-gray-700">{month}</div>
                                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                                        <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <div className="w-28 text-right text-sm font-medium text-gray-900">
                                        ₱{amount.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    {Object.keys(paymentsByMonth).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No payment data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
