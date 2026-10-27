import React from 'react';
import backtestData from '../data/backtest_results.json';
import { MobileDataCard } from '../components/ui/mobile-data-card';

export default function BacktestPage({ onSelectIpo, isMobile }) {
  const runDynamicBacktest = () => {
    if (!backtestData || !backtestData.stats || !backtestData.stats.detailed_results) {
      return { stats: {}, history: [], yesCount: 0, finalCapital: 100000 };
    }

    const iposList = backtestData.stats.detailed_results;
    let currentCapital = 100000.0;
    let blindCapital = 100000.0;
    const history = [];
    let yesCount = 0;

    iposList.forEach(ipo => {
      const isYes = ipo.decision === 'YES';
      const cost = 15000.0;
      const prob = (ipo.allotment_probability_pct != null ? ipo.allotment_probability_pct : 60) / 100;
      const gains_pct = ipo.listing_gains_pct != null ? ipo.listing_gains_pct : 0;
      const potentialOutcome = cost * (gains_pct / 100);
      const stepExpectedGain = cost * prob * (gains_pct / 100);

      if (isYes) {
        yesCount += 1;
        currentCapital += stepExpectedGain;
      }

      blindCapital += stepExpectedGain;

      history.push({
        name: ipo.name,
        date: ipo.open_date,
        capital: currentCapital,
        gain: isYes ? stepExpectedGain : 0,
        potentialOutcome,
        probPct: ipo.allotment_probability_pct != null ? ipo.allotment_probability_pct : 60,
        decision: isYes ? 'YES' : 'NO'
      });
    });

    return {
      finalCapital: currentCapital,
      blindCapital,
      totalProfit: currentCapital - 100000.0,
      yesCount,
      history
    };
  };

  const dynamicRes = runDynamicBacktest();
  const yesCount = dynamicRes.yesCount;
  const originalStats = backtestData?.stats || {};
  const totalEvaluated = originalStats.total_evaluated || 21;
  const winRate = ((yesCount / totalEvaluated) * 100).toFixed(1);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: '24px',
          gap: '16px'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '600',
              color: 'var(--text-h)',
              margin: 0,
              letterSpacing: '-0.025em'
            }}>
              Backtest Simulation Engine
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Simulate historical listing-day returns and verify quantitative gate performance against real Indian market data.
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: '999px',
            fontWeight: '500',
            alignSelf: isMobile ? 'flex-start' : 'center'
          }}>
            <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
              <span className="animate-ping" style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#34d399', opacity: 0.75 }}></span>
              <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: '6px', height: '6px', backgroundColor: 'var(--success)' }}></span>
            </span>
            Active Model: 8-Metric Gate
          </div>
        </div>

        {/* Metric Strip */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'var(--shadow)',
          marginBottom: '32px'
        }}>
          <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Simulated Period</span>
            <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>Past 3 Years</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Aug 2021 – Aug 2024</span>
          </div>
          <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Total IPOs Screened</span>
            <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>{totalEvaluated} Listings</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Mainboard listings meeting criteria</span>
          </div>
          <div style={{ flex: 1, padding: '24px 20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Simulated Win Rate</span>
            <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success)', letterSpacing: '-0.025em', lineHeight: 1 }}>
              {winRate}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)', display: 'block', marginTop: '6px', fontWeight: '500' }}>
              {yesCount} Wins • {totalEvaluated - yesCount} Avoided Capital Losses
            </span>
          </div>
        </div>

        {/* Results Table / Cards */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dynamicRes.history.map((h, idx) => {
              const item = backtestData.stats.detailed_results[idx];
              const fmtDate = (dStr) => dStr ? new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
              const isLossAvoided = h.decision === 'NO' && h.potentialOutcome < 0;

              return (
                <MobileDataCard
                  key={idx}
                  onClick={() => onSelectIpo && onSelectIpo(item)}
                  title={h.name}
                  subtitle={`Listed: ${fmtDate(item.listing_date)}`}
                  topRightBadge={
                    h.decision === 'YES' ? (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success-dark)', backgroundColor: 'var(--success-bg)', padding: '3px 8px', borderRadius: '10px' }}>
                        ✓ YES
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '10px' }}>
                        ✖ NO
                      </span>
                    )
                  }
                  bottomLeft={
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Listing Gain: </span>
                      <span style={{ fontWeight: '700', color: item.listing_gains_pct > 0 ? 'var(--success)' : item.listing_gains_pct < 0 ? 'var(--danger)' : 'var(--text-muted)' }} className="tabular-nums">
                        {item.listing_gains_pct > 0 ? '+' : ''}{item.listing_gains_pct}%
                      </span>
                    </div>
                  }
                  bottomRight={
                    h.decision === 'YES' ? (
                      h.potentialOutcome > 0 ? (
                        <span style={{ color: 'var(--success)' }}>SUCCESS GAIN</span>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>LOSS</span>
                      )
                    ) : (
                      isLossAvoided ? (
                        <span style={{ color: 'var(--text)' }}>AVOIDED LOSS</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>MISSED GAIN</span>
                      )
                    )
                  }
                />
              );
            })}
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--card-bg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Listing Date</th>
                  <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. GMP</th>
                  <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Listing Gain</th>
                  <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Decision</th>
                  <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {dynamicRes.history.map((h, idx) => {
                  const item = backtestData.stats.detailed_results[idx];
                  const fmtDate = (dStr) => dStr ? new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
                  const isLossAvoided = h.decision === 'NO' && h.potentialOutcome < 0;
                  const gmpPct = item.est_gmp_pct || 0;

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => onSelectIpo && onSelectIpo(item)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{h.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Symbol: {item.symbol}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '12px' }} className="tabular-nums">
                        {fmtDate(item.listing_date)}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: gmpPct > 0 ? 'var(--success)' : gmpPct < 0 ? 'var(--danger)' : 'var(--text-muted)' }} className="tabular-nums">
                        {gmpPct > 0 ? '+' : ''}{gmpPct}%
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: item.listing_gains_pct > 0 ? 'var(--success)' : item.listing_gains_pct < 0 ? 'var(--danger)' : 'var(--text-muted)' }} className="tabular-nums">
                        {item.listing_gains_pct > 0 ? '+' : ''}{item.listing_gains_pct}%
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {h.decision === 'YES' ? (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success-dark)', backgroundColor: 'var(--success-bg)', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                            ✓ YES - APPLY
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                            ✖ NO - AVOID
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {h.decision === 'YES' ? (
                          h.potentialOutcome > 0 ? (
                            <span style={{ color: 'var(--success)' }}>SUCCESSFUL GAIN</span>
                          ) : (
                            <span style={{ color: 'var(--danger)' }}>LOSS</span>
                          )
                        ) : (
                          isLossAvoided ? (
                            <span style={{ color: 'var(--text)' }}>AVOIDED LOSS</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>MISSED GAIN</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
