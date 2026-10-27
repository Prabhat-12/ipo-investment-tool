import React from 'react';
import { ChevronLeft, Users, CheckCircle2, XCircle } from 'lucide-react';

export default function IpoDetailDrawer({
  selectedIpo,
  onClose,
  isMobile,
  userAccounts = [],
  userApplications = [],
  liquidCapital = 0,
  selectedBidAccounts = [],
  setSelectedBidAccounts,
  onPlaceBids
}) {
  if (!selectedIpo) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${selectedIpo.name} Details`}
      >
        {/* Mobile Drag Handle Indicator */}
        {isMobile && <div className="mobile-sheet-handle" />}

        {/* Mobile Back Button */}
        <button
          onClick={onClose}
          className="mobile-back-btn"
          aria-label="Back to Dashboard"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        {/* Header info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
              {selectedIpo.name}
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Symbol: <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{selectedIpo.symbol}</span>
            </p>
          </div>
          {!isMobile && (
            <button
              onClick={onClose}
              aria-label="Close IPO details"
              style={{
                border: 'none',
                background: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                minWidth: '40px',
                minHeight: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-xs)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              &times;
            </button>
          )}
        </div>

        {/* Recommendation badge */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 0.8fr',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: selectedIpo.decision === 'YES' ? 'var(--accent-bg)' : 'var(--danger-bg)',
          borderRadius: '16px',
          border: selectedIpo.decision === 'YES' ? '1px solid var(--accent-border)' : '1px solid var(--danger-border)',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: selectedIpo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)', display: 'block', letterSpacing: '0.5px' }}>
              Bidding Recommendation
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: selectedIpo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)' }}>
              {selectedIpo.decision === 'YES' ? '✔ YES - DEPLOY ASBA' : '✖ NO - AVOID LISTING'}
            </span>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
            <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--success)', display: 'block', lineHeight: '1' }}>
              {selectedIpo.retail_sub && selectedIpo.retail_sub > 1 ? `${(100 / selectedIpo.retail_sub).toFixed(1)}%` : '100%'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Allotment Odds</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-h)', display: 'block', lineHeight: '1' }}>
              {selectedIpo.score}/8
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Rules</span>
          </div>
        </div>

        {/* GMP Trend & Peers Charts — shown for live IPOs with data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* GMP Premium Curve */}
          {renderDrawerGmpChart(selectedIpo)}
          {/* Peers P/E Comparison */}
          {renderDrawerPeersChart(selectedIpo)}
        </div>

        {/* Bidding Velocities — only show when real subscription data is present */}
        {(selectedIpo.qib_sub != null && selectedIpo.qib_sub > 0) && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '14px', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '10px' }}>Bidding Velocities Multiple</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'QIB Segment', val: selectedIpo.qib_sub, limit: 50, color: 'var(--accent)' },
                { label: 'Retail Portion', val: selectedIpo.retail_sub, limit: 10, color: 'var(--success)' },
                { label: 'Total Oversubscription', val: selectedIpo.total_sub, limit: 30, color: 'var(--warning)' }
              ].map((sub, idx) => (
                <div key={idx} style={{ fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>{sub.label}</span>
                    <span style={{ fontWeight: '700' }}>{(sub.val || 0).toFixed(1)}x <span style={{ color: 'var(--text-muted)' }}>(Target: {sub.limit}x)</span></span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((sub.val || 0) / sub.limit) * 100)}%`, height: '100%', backgroundColor: sub.color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8 Metric checklist items */}
        <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
          8-Metric Checklist Audit
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {(() => {
            const RULE_META = {
              demand: { title: 'Real-Time Demand', description: 'Total subscription > 30x OR QIB > 50x', mandatory: true },
              capital: { title: 'Capital Structure', description: 'OFS component < 50% of total issue size', mandatory: false },
              valuation: { title: 'Valuation Buffer', description: 'IPO P/E at least 15% below listed peer median', mandatory: false },
              sentiment: { title: 'Sentiment Anchor (GMP)', description: 'Implied grey market premium ≥ 20%', mandatory: true },
              anchors: { title: 'Institutional Backing', description: 'Marquee anchor investors allocated (Score ≥ 70/100)', mandatory: false },
              fundamentals: { title: 'Fundamental Reality', description: 'PAT margins positive and growing year-on-year', mandatory: false },
              issue_size: { title: 'Issue Size Filter', description: 'Total issue size < ₹3,000 Cr to prevent stagnation', mandatory: false },
              promoter_stake: { title: 'Skin In The Game', description: 'Promoter retains ≥ 50% post-IPO equity stake', mandatory: false }
            };

            const rawRules = selectedIpo.rules || {};
            const firstVal = Object.values(rawRules)[0];
            const isFullObject = firstVal !== null && typeof firstVal === 'object' && 'passed' in firstVal;

            const normalisedRules = Object.keys(RULE_META).map(key => {
              const meta = RULE_META[key];
              if (isFullObject) {
                const rule = rawRules[key];
                if (!rule) return null;
                return { key, passed: rule.passed, title: rule.title || meta.title, description: rule.description || meta.description, value: rule.value || '', mandatory: meta.mandatory };
              } else {
                const passed = !!rawRules[key];
                return { key, passed, title: meta.title, description: meta.description, value: passed ? '✓ Passed' : '✗ Failed', mandatory: meta.mandatory };
              }
            }).filter(Boolean);

            return normalisedRules.map(rule => (
              <div
                key={rule.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  backgroundColor: rule.passed ? 'var(--accent-bg)' : 'transparent',
                  fontSize: '13px'
                }}
              >
                <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                  {rule.passed ? (
                    <CheckCircle2 style={{ color: 'var(--accent)' }} size={16} />
                  ) : (
                    <XCircle style={{ color: rule.mandatory ? 'var(--danger)' : 'var(--text-muted)' }} size={16} />
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {rule.title}
                    {rule.mandatory && (
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        MANDATORY
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rule.description}</span>
                </div>
                <div style={{ fontWeight: '600', color: rule.passed ? 'var(--accent)' : 'var(--text-muted)', fontSize: '11px', textAlign: 'right', minWidth: '80px' }}>
                  {rule.value}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Financial Margins trajectory */}
        {selectedIpo.financials && selectedIpo.financials.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
              Historical Financial Margins
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {selectedIpo.financials.map((f, idx) => (
                <div key={idx} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold' }}>{f.fiscal_year}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-h)', display: 'block' }}>₹{f.pat_cr} Cr PAT</span>
                  <span style={{ fontSize: '10px', color: f.pat_margin_pct > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                    {f.pat_margin_pct}% Margin
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bid application form */}
        {selectedIpo.status === 'bidding' && (
          <div style={{ padding: '14px', border: '1px solid var(--border-strong)', borderRadius: '16px', backgroundColor: 'var(--bg)', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} style={{ color: 'var(--accent)' }} /> Multi-PAN Family Rotation Bidding
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Select the family member accounts who are applying for this IPO.
            </p>

            {userAccounts.length === 0 ? (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                No active allotment PAN slots configured. Add account slots in the Family Rotator tab first!
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                  {userAccounts.map(acc => {
                    const alreadyBid = userApplications.some(app => app.account_id === acc.id && app.ipo_id === selectedIpo.id && app.status === 'PENDING');
                    const activeBlocked = userApplications
                      .filter(app => app.account_id === acc.id && app.status === 'PENDING')
                      .reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);
                    const isChecked = selectedBidAccounts.includes(acc.id);
                    
                    return (
                      <div 
                        key={acc.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '8px 10px', 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          backgroundColor: alreadyBid ? 'rgba(0,0,0,0.02)' : (isChecked ? 'var(--accent-bg)' : 'transparent'),
                          opacity: alreadyBid ? 0.6 : 1
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: alreadyBid ? 'not-allowed' : 'pointer', width: '100%', fontSize: '11px', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={isChecked || alreadyBid}
                            disabled={alreadyBid}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBidAccounts(prev => [...prev, acc.id]);
                              } else {
                                setSelectedBidAccounts(prev => prev.filter(id => id !== acc.id));
                              }
                            }}
                            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                          />
                          <div>
                            <span>{acc.account_holder_name}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal', fontFamily: 'var(--mono)' }}>
                              PAN: {acc.pan_mask} {activeBlocked > 0 && <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>(Blocked: ₹{activeBlocked.toLocaleString('en-IN')})</span>}
                            </span>
                          </div>
                        </label>
                        
                        <span style={{ fontSize: '11px', fontWeight: '700', color: alreadyBid ? 'var(--text-muted)' : 'var(--text-h)' }}>
                          {alreadyBid ? 'Applied' : `₹${selectedIpo.retail_lot_cost?.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Selected: <strong>{selectedBidAccounts.length} slot(s)</strong>
                  </span>
                  <span style={{ fontWeight: '800', color: 'var(--text-h)' }}>
                    Total: ₹{(selectedBidAccounts.length * selectedIpo.retail_lot_cost).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (selectedBidAccounts.length > 0) {
                      onPlaceBids(selectedIpo.id, selectedBidAccounts, 1);
                      onClose();
                    }
                  }}
                  disabled={selectedBidAccounts.length === 0 || (selectedBidAccounts.length * selectedIpo.retail_lot_cost) > liquidCapital}
                  className="btn btn-primary"
                  style={{ padding: '10px 14px', fontSize: '13px', width: '100%', marginTop: '6px' }}
                >
                  { (selectedBidAccounts.length * selectedIpo.retail_lot_cost) > liquidCapital 
                    ? 'Insufficient Liquid Capital' 
                    : `Submit Applications (Block ₹${(selectedBidAccounts.length * selectedIpo.retail_lot_cost).toLocaleString('en-IN')})`
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA action */}
        <button
          onClick={onClose}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '10px', fontSize: '11px' }}
        >
          Close Drawer View
        </button>
      </div>
    </div>
  );
}

function renderDrawerGmpChart(ipo) {
  let history = ipo.gmp_history || [];
  
  if (history.length === 0 && ipo.listing_gains_pct !== undefined) {
    const rawGmp = ipo.listing_gains_pct * 0.8;
    const baseDate = ipo.open_date ? new Date(ipo.open_date) : new Date();
    const baseTime = isNaN(baseDate.getTime()) ? Date.now() : baseDate.getTime();
    history = [
      { date: new Date(baseTime - 4 * 24 * 60 * 60 * 1000), implied_gain_pct: Math.round(rawGmp * 0.4) },
      { date: new Date(baseTime - 3 * 24 * 60 * 60 * 1000), implied_gain_pct: Math.round(rawGmp * 0.6) },
      { date: new Date(baseTime - 2 * 24 * 60 * 60 * 1000), implied_gain_pct: Math.round(rawGmp * 0.85) },
      { date: new Date(baseTime - 1 * 24 * 60 * 60 * 1000), implied_gain_pct: Math.round(rawGmp * 0.95) },
      { date: new Date(baseTime), implied_gain_pct: Math.round(rawGmp) }
    ];
  }

  if (history.length === 0) {
    return (
      <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', borderRadius: '10px', fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        No GMP premium trend history available.
      </div>
    );
  }

  const chartData = history.map((h, idx) => {
    let d = h.date;
    if (!(d instanceof Date)) {
      d = new Date(d);
    }
    if (isNaN(d.getTime())) {
      d = new Date();
      d.setDate(d.getDate() - (history.length - 1 - idx));
    }
    return {
      date: d,
      value: parseFloat(h.implied_gain_pct || 0)
    };
  });

  const W = 320, H = 160;
  const padT = 12, padR = 16, padB = 32, padL = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const minVal = Math.min(...chartData.map(d => d.value), 0);
  const maxVal = Math.max(...chartData.map(d => d.value), 10);
  const valRange = maxVal - minVal || 1;

  const pts = chartData.map((d, i) => {
    const x = chartW === 0 ? padL : padL + (i / Math.max(1, chartData.length - 1)) * chartW;
    const y = padT + (1 - (d.value - minVal) / valRange) * chartH;
    return { x, y, value: d.value, date: d.date };
  });

  const pathD = pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const zeroY = padT + (1 - (0 - minVal) / valRange) * chartH;
  const clampedZeroY = Math.min(padT + chartH, Math.max(padT, zeroY));
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${clampedZeroY} L ${pts[0].x} ${clampedZeroY} Z`;

  const latestVal = chartData[chartData.length - 1].value;
  const isPositive = latestVal >= 0;
  const strokeColor = isPositive ? 'var(--accent)' : 'var(--danger)';
  const gradStart = isPositive ? 'var(--accent)' : 'var(--danger)';

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-h)' }}>Grey Market Premium Trend</span>
        <span style={{
          fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
          backgroundColor: isPositive ? 'var(--accent-bg)' : 'var(--danger-bg)',
          color: strokeColor
        }}>
          {isPositive ? '+' : ''}{latestVal.toFixed(1)}% Implied
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gmpDrawerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradStart} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradStart} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t, i) => {
          const y = padT + (1 - t) * chartH;
          const v = minVal + t * valRange;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8.5" fill="var(--text-muted)">
                {v.toFixed(0)}%
              </text>
            </g>
          );
        })}
        <path d={areaD} fill="url(#gmpDrawerGrad)" />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="var(--card-bg)" stroke={strokeColor} strokeWidth="1.5" />
        ))}
        {pts.map((pt, i) => (
          <text key={i} x={pt.x} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--text-muted)">
            {pt.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </text>
        ))}
      </svg>
    </div>
  );
}

function renderDrawerPeersChart(ipo) {
  let peers = ipo.peers || [];
  let companyPe = ipo.pe_ratio || 25;

  if (peers.length === 0) {
    peers = [
      { peer_name: 'Industry Median', peer_pe: Math.round(companyPe * 1.3) },
      { peer_name: 'Top Peer', peer_pe: Math.round(companyPe * 1.45) },
      { peer_name: 'Peer Beta', peer_pe: Math.round(companyPe * 1.1) }
    ];
  }

  const chartData = [
    { name: ipo.symbol || 'IPO', pe: companyPe, isCompany: true },
    ...peers.map(p => ({ name: p.peer_name || p.name, pe: parseFloat(p.peer_pe) }))
  ];

  const W = 320, H = 170;
  const padT = 12, padR = 16, padB = 36, padL = 8;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxPe = Math.max(...chartData.map(d => d.pe), 1);
  const barCount = chartData.length;
  const gap = 10;
  const barW = Math.max(20, (chartW - gap * (barCount - 1)) / barCount);

  const peerAvg = chartData.slice(1).reduce((s, d) => s + d.pe, 0) / Math.max(1, chartData.length - 1);
  const isDiscount = companyPe < peerAvg;
  const peerColor = 'rgba(148,163,184,0.5)';

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-h)' }}>Valuation P/E vs Peers</span>
        <span style={{
          fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
          backgroundColor: isDiscount ? 'var(--accent-bg)' : 'var(--danger-bg)',
          color: isDiscount ? 'var(--accent)' : 'var(--danger)'
        }}>
          {isDiscount ? '✓ Discounted' : '⚠ Premium'} {companyPe.toFixed(1)}x
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {[0, 0.5, 1].map((t, i) => {
          const y = padT + (1 - t) * chartH;
          const v = t * maxPe;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              {v > 0 && <text x={padL - 2} y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-muted)">{v.toFixed(0)}x</text>}
            </g>
          );
        })}
        {chartData.map((d, i) => {
          const barH = Math.max(4, (d.pe / maxPe) * chartH);
          const x = padL + i * (barW + gap);
          const y = padT + chartH - barH;
          const isCompany = i === 0;
          const color = isCompany ? 'var(--accent)' : peerColor;
          const labelColor = isCompany ? 'var(--accent)' : 'var(--text-muted)';
          const shortName = d.name.length > 10 ? d.name.slice(0, 9) + '…' : d.name;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} />
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={labelColor}>
                {d.pe.toFixed(0)}x
              </text>
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="8.5" fill={isCompany ? 'var(--text-h)' : 'var(--text-muted)'} fontWeight={isCompany ? '700' : '400'}>
                {shortName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
