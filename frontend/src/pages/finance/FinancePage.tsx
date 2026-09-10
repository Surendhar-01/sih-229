import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api';

type FinanceView = 'user' | 'collector' | 'aggregator' | 'recycler';
const endpoints: Record<FinanceView, string> = { user: '/user/payments', collector: '/collector/earnings', aggregator: '/aggregator/finance', recycler: '/recycler/payments' };
const labels: Record<FinanceView, string> = { user: 'My Payments', collector: 'My Earnings', aggregator: 'Finance & Settlements', recycler: 'Recycler Payments' };

export const FinancePage: React.FC<{ view: FinanceView }> = ({ view }) => {
  const [summary, setSummary] = useState<any>();
  const [error, setError] = useState('');
  useEffect(() => { apiClient.get(endpoints[view]).then((response: any) => setSummary(response.data ?? response)).catch((requestError) => setError(requestError.message)); }, [view]);
  const money = (value: any) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (error) return <div className="card"><h2>{labels[view]}</h2><p>{error}</p></div>;
  const records = summary?.records || [];
  return <div style={{ display: 'grid', gap: 20 }}>
    <div><h1 style={{ margin: 0 }}>{labels[view]}</h1><p style={{ color: '#64748b' }}>Transparent, verified financial records only.</p></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
      {[['Receivables', summary?.receivables], ['Payables', summary?.payables], ['Pending', summary?.pending_amount], ['Settlements', summary?.total_obligations]].map(([label, value]) => <div key={String(label)} className="card" style={{ padding: 18 }}><div style={{ color: '#64748b', fontSize: 13 }}>{label}</div><strong style={{ fontSize: 22 }}>{label === 'Settlements' ? value || 0 : money(value)}</strong></div>)}
    </div>
    <div className="card" style={{ overflowX: 'auto' }}><h3>Payment history</h3>{!summary ? <p>Loading financial records…</p> : records.length === 0 ? <p>No payment obligations yet.</p> : <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th align="left">Reference</th><th align="left">Type</th><th align="right">Amount</th><th align="left">Status</th><th align="left">Due</th></tr></thead><tbody>{records.map((record: any) => <tr key={record.id}><td style={{ padding: '12px 0' }}>{record.obligation_reference}</td><td>{record.obligation_type?.replaceAll('_', ' ')}</td><td align="right">{money(record.original_amount)}</td><td><span className="badge badge-yellow">{record.status}</span></td><td>{record.due_at ? new Date(record.due_at).toLocaleDateString() : '—'}</td></tr>)}</tbody></table>}</div>
  </div>;
};
