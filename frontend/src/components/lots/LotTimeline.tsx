import React from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
  Truck,
  ShieldCheck,
  Factory,
  User,
  XCircle,
  FileText,
} from 'lucide-react';
import { LotTimelineItem } from '../../services/lotsService';

interface LotTimelineProps {
  currentStatus: string;
  timelineEvents?: LotTimelineItem[];
}

export const LotTimeline: React.FC<LotTimelineProps> = ({ currentStatus, timelineEvents = [] }) => {
  // 7-Stage Circular Economy Lifecycle defined in Section 14
  const steps = [
    { key: 'CREATED', label: 'Created', sublabel: 'Lot Registered', icon: <Clock className="w-4 h-4" /> },
    { key: 'AI_INSPECTED', label: 'AI Inspected', sublabel: 'Vision & Price', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'QUOTE_REQUESTED', label: 'Quote Requested', sublabel: 'B2B Valuation', icon: <Building className="w-4 h-4" /> },
    { key: 'COLLECTOR_ASSIGNED', label: 'Collector Assigned', sublabel: 'Dispatch Queue', icon: <Truck className="w-4 h-4" /> },
    { key: 'PICKUP_VERIFIED', label: 'Pickup Verified', sublabel: 'Scale & OTP', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'HANDOVER_COMPLETED', label: 'Handover Completed', sublabel: 'Transit Manifest', icon: <FileText className="w-4 h-4" /> },
    { key: 'RECYCLER_RECEIVED', label: 'Recycler Received', sublabel: 'EPR & Recycling', icon: <Factory className="w-4 h-4" /> },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'LOT_CREATED':
      case 'DRAFT':
        return 0;
      case 'AI_ANALYZED':
        return 1;
      case 'WAITING_FOR_QUOTE':
      case 'AGGREGATOR_REVIEW':
        return 2;
      case 'COLLECTOR_ASSIGNED':
      case 'ON_THE_WAY':
      case 'ARRIVED':
        return 3;
      case 'PICKED_UP':
      case 'MATERIAL_VERIFIED':
      case 'COLLECTED':
        return 4;
      case 'AT_AGGREGATOR':
      case 'IN_TRANSIT_TO_RECYCLER':
        return 5;
      case 'AT_RECYCLER':
      case 'RECYCLED':
      case 'SETTLED':
        return 6;
      case 'CANCELLED':
        return -1;
      default:
        return 2;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="ld-card ld-timeline-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(15,23,42,0.03)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669', display: 'block', marginBottom: '4px' }}>
            Chain of Custody
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Traceability & Status Timeline
          </h3>
        </div>

        {isCancelled ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            <XCircle className="w-4 h-4" />
            Lot Cancelled
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Active Transaction
          </span>
        )}
      </div>

      {/* Cancellation Banner */}
      {isCancelled && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', marginBottom: '24px', fontSize: '0.88rem' }}>
          <strong>Notice:</strong> This e-waste lot has been cancelled. No further collection or settlement actions are scheduled.
        </div>
      )}

      {/* Horizontal Lifecycle Stepper */}
      {!isCancelled && (
        <div style={{ marginBottom: '36px', overflowX: 'auto', paddingBottom: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(130px, 1fr))`, gap: '8px', minWidth: '760px', position: 'relative' }}>
            {steps.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isPending = idx > currentIndex;

              let nodeBg = '#f1f5f9';
              let nodeBorder = '#cbd5e1';
              let nodeColor = '#64748b';
              let badgeBg = '#f8fafc';
              let badgeText = '#64748b';
              let badgeLabel = '○ Pending';

              if (isCompleted) {
                nodeBg = '#059669';
                nodeBorder = '#059669';
                nodeColor = '#ffffff';
                badgeBg = '#ecfdf5';
                badgeText = '#047857';
                badgeLabel = '✓ Completed';
              } else if (isCurrent) {
                nodeBg = '#ffffff';
                nodeBorder = '#10b981';
                nodeColor = '#059669';
                badgeBg = '#f0fdf4';
                badgeText = '#047857';
                badgeLabel = '● Active';
              }

              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  {/* Connecting Line between steps */}
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '18px',
                        left: '50%',
                        width: '100%',
                        height: '3px',
                        background: idx < currentIndex ? '#10b981' : '#e2e8f0',
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* Icon Bubble */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: nodeBg,
                      border: `2px solid ${nodeBorder}`,
                      color: nodeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.2), 0 4px 10px rgba(16, 185, 129, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                  </div>

                  {/* Step Title */}
                  <span style={{ fontSize: '0.84rem', fontWeight: isCurrent ? 800 : 700, color: isCurrent ? '#047857' : isCompleted ? '#0f172a' : '#64748b', marginTop: '10px' }}>
                    {step.label}
                  </span>

                  {/* Step Sublabel */}
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    {step.sublabel}
                  </span>

                  {/* Step Status Pill */}
                  <span
                    style={{
                      marginTop: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: badgeBg,
                      color: badgeText,
                      border: `1px solid ${isCurrent ? '#86efac' : isCompleted ? '#a7f3d0' : '#e2e8f0'}`,
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit Activity Log */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Audit Activity
          </h4>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            Immutable Transaction Trail
          </span>
        </div>

        {timelineEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {timelineEvents.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: idx === 0 ? '#f8fafc' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                      {evt.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                      {formatTimestamp(evt.timestamp)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#334155', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {evt.note || 'Audit status change recorded in circular ledger.'}
                  </p>

                  {evt.actor && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '0.74rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{evt.actor}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.88rem' }}>
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

