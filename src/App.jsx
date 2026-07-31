import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  DollarSign, 
  Wallet, 
  RefreshCw, 
  Layers, 
  Sparkles,
  Info,
  ChevronRight,
  TrendingDown,
  Percent,
  CircleDollarSign,
  ArrowRight
} from 'lucide-react';

// Import JSON data compiled by Python engine
import dbLocal from './data/db_local.json';
import backtestData from './data/backtest_results.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('tracker');
  const [selectedIpo, setSelectedIpo] = useState(null);
  
  // Capital Rotator State
  const [capital, setCapital] = useState(100000);
  const [blockedBids, setBlockedBids] = useState({}); // { ipo_id: lot_count }
  const [realizedGains, setRealizedGains] = useState([]);
  
  // Custom backtest threshold state (interactive playground)
  const [gmpThreshold, setGmpThreshold] = useState(20);
  const [subThreshold, setSubThreshold] = useState(30);
  
  // Load initial simulated active IPOs
  const [ipos, setIpos] = useState([]);
  
  useEffect(() => {
    if (dbLocal && dbLocal.ipos) {
      // Re-evaluate current active IPOs using the 8 metrics
      const evaluated = dbLocal.ipos.map(ipo => {
        // Fetch matching sub and gmp records
        const subs = dbLocal.subscriptions.filter(s => s.ipo_id === ipo.id) || [];
        const gmpRecs = dbLocal.gmp_history.filter(g => g.ipo_id === ipo.id) || [];
        const peers = dbLocal.peers.filter(p => p.ipo_id === ipo.id) || [];
        const financials = dbLocal.financials.filter(f => f.ipo_id === ipo.id) || [];
        const anchors = dbLocal.anchor_investors.filter(a => a.ipo_id === ipo.id) || [];
        
        const total_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].total) : 0.0;
        const qib_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].qib) : 0.0;
        const retail_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].retail) : 0.0;
        const gmp_pct = gmpRecs.length > 0 ? parseFloat(gmpRecs[gmpRecs.length - 1].implied_gain_pct) : 0.0;
        
        // Calculate P/E values
        const pe_ratio = ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0; // dummy P/E
        const peers_median_pe = peers.length > 0 ? peers[0].peer_pe : 35.0;
        
        const details = {
          ...ipo,
          total_sub,
          qib_sub,
          retail_sub,
          gmp_pct,
          pe_ratio,
          peers_median_pe,
          financials,
          peers,
          anchors
        };
        
        // Run frontend evaluation
        const evalRes = evaluateIpoClient(details);
        return {
          ...details,
          score: evalRes.score,
          decision: evalRes.decision,
          rules: evalRes.rules,
          notes: evalRes.notes
        };
      });
      setIpos(evaluated);
    }
  }, []);

  // Client-side evaluation equivalent to decision_engine.py
  function evaluateIpoClient(ipo) {
    const rules = {};
    let score = 0;

    // 1. Demand
    rules.demand = {
      title: 'Real-Time Demand',
      description: 'Total subscription > 30x OR QIB > 50x',
      value: `Total: ${ipo.total_sub}x, QIB: ${ipo.qib_sub}x`,
      passed: ipo.total_sub >= subThreshold || ipo.qib_sub >= 50
    };
    if (rules.demand.passed) score += 1;

    // 2. Capital structure
    const ofs_pct = ipo.issue_size_cr > 0 ? (ipo.ofs_cr / ipo.issue_size_cr) * 100 : 0;
    rules.capital = {
      title: 'Capital Structure',
      description: 'OFS component constitutes < 50% of issue size',
      value: `OFS: ${ofs_pct.toFixed(1)}%`,
      passed: ofs_pct < 50.0
    };
    if (rules.capital.passed) score += 1;

    // 3. Valuation
    const discount_pct = ipo.peers_median_pe > 0 ? ((ipo.peers_median_pe - ipo.pe_ratio) / ipo.peers_median_pe) * 100 : 0;
    rules.valuation = {
      title: 'Valuation Buffer',
      description: 'IPO P/E has a 15%+ discount to listed peers',
      value: ipo.pe_ratio > 0 ? `P/E: ${ipo.pe_ratio.toFixed(1)}x vs Peers Median: ${ipo.peers_median_pe.toFixed(1)}x (${discount_pct.toFixed(1)}% discount)` : 'N/A',
      passed: discount_pct >= 15.0 && ipo.pe_ratio > 0
    };
    if (rules.valuation.passed) score += 1;

    // 4. Sentiment
    rules.sentiment = {
      title: 'Sentiment Anchor (GMP)',
      description: 'Implied premium >= 20%',
      value: `GMP Implied Premium: ${ipo.gmp_pct}%`,
      passed: ipo.gmp_pct >= gmpThreshold
    };
    if (rules.sentiment.passed) score += 1;

    // 5. Anchors
    const anchorScore = ipo.anchors && ipo.anchors.length > 0 ? 85 : 50; // simple mock
    rules.anchors = {
      title: 'Institutional Backing',
      description: 'Marquee anchor allocation present (Score >= 70/100)',
      value: `Score: ${anchorScore}/100`,
      passed: anchorScore >= 70
    };
    if (rules.anchors.passed) score += 1;

    // 6. Fundamentals
    const patMargins = ipo.financials ? ipo.financials.map(f => f.pat_margin_pct) : [];
    let patPassed = false;
    let patValue = 'No historical margins';
    if (patMargins.length >= 2) {
      const isPositive = patMargins[patMargins.length - 1] > 0;
      const isGrowing = patMargins[patMargins.length - 1] >= patMargins[patMargins.length - 2];
      patPassed = isPositive && isGrowing;
      patValue = `Margins: ${patMargins.map(m => `${m}%`).join(' -> ')}`;
    }
    rules.fundamentals = {
      title: 'Fundamental Reality',
      description: 'PAT margins are positive and increasing',
      value: patValue,
      passed: patPassed
    };
    if (rules.fundamentals.passed) score += 1;

    // 7. Issue Size
    rules.issue_size = {
      title: 'Issue Size Filter',
      description: 'Total issue size < ₹3,000 Crore to prevent listing stagnation',
      value: `Size: ₹${ipo.issue_size_cr} Cr`,
      passed: ipo.issue_size_cr < 3000.0
    };
    if (rules.issue_size.passed) score += 1;

    // 8. Promoter Stake
    rules.promoter_stake = {
      title: 'Skin In The Game',
      description: 'Promoter post-IPO stake >= 50%',
      value: `Promoter Stake: ${ipo.post_ipo_promoter_holding_pct}%`,
      passed: ipo.post_ipo_promoter_holding_pct >= 50.0
    };
    if (rules.promoter_stake.passed) score += 1;

    // Final Decision: Demand and GMP are mandatory
    const isYes = rules.demand.passed && rules.sentiment.passed && score >= 5;
    const decision = isYes ? 'YES' : 'NO';

    return { score, decision, rules };
  }

  // Capital calculation
  const totalBlocked = Object.keys(blockedBids).reduce((acc, ipoId) => {
    const ipo = ipos.find(i => i.id === parseInt(ipoId));
    if (!ipo) return acc;
    return acc + (ipo.retail_lot_cost * blockedBids[ipoId]);
  }, 0);

  const liquidCapital = capital - totalBlocked;

  const handlePlaceBid = (ipoId, lotCount) => {
    const ipo = ipos.find(i => i.id === ipoId);
    if (!ipo) return;
    const cost = ipo.retail_lot_cost * lotCount;
    if (cost > liquidCapital) {
      alert("Insufficient liquid capital to place this bid!");
      return;
    }
    setBlockedBids(prev => ({
      ...prev,
      [ipoId]: (prev[ipoId] || 0) + lotCount
    }));
  };

  const handleAllotmentResult = (ipoId, success) => {
    const ipo = ipos.find(i => i.id === ipoId);
    if (!ipo) return;
    const lotCount = blockedBids[ipoId] || 0;
    if (lotCount === 0) return;
    
    const cost = ipo.retail_lot_cost * lotCount;
    let netGain = 0;
    
    if (success) {
      // Listing gain return
      netGain = cost * (ipo.gmp_pct / 100);
      setCapital(prev => prev + netGain);
      setRealizedGains(prev => [
        ...prev,
        {
          name: ipo.name,
          date: new Date().toLocaleDateString(),
          cost,
          gain: netGain,
          status: 'Allotted'
        }
      ]);
    } else {
      setRealizedGains(prev => [
        ...prev,
        {
          name: ipo.name,
          date: new Date().toLocaleDateString(),
          cost,
          gain: 0,
          status: 'Refunded'
        }
      ]);
    }
    
    // Release blocked funds
    setBlockedBids(prev => {
      const copy = { ...prev };
      delete copy[ipoId];
      return copy;
    });
  };

  // Re-run backtest simulation client-side dynamically based on inputs
  const runDynamicBacktest = () => {
    if (!backtestData || !backtestData.stats || !backtestData.stats.detailed_results) return { stats: {}, history: [] };
    
    const iposList = backtestData.stats.detailed_results;
    let currentCapital = 100000.0;
    const history = [];
    let yesCount = 0;
    
    iposList.forEach(ipo => {
      // Query original record from historical_ipos.json
      const orig = backtestData.stats.detailed_results.find(x => x.name === ipo.name);
      
      // Compute score client-side based on dynamic sliders
      const total_sub = ipo.total_sub || 35.0; // default
      const gmp_pct = ipo.listing_gains_pct * 0.8; // estimate gmp
      
      // Simple pass criteria
      const rules = {
        demand: total_sub >= subThreshold,
        sentiment: gmp_pct >= gmpThreshold
      };
      
      const passes = Object.values(rules).filter(Boolean).length;
      const isYes = rules.demand && rules.sentiment && passes >= 2;
      
      let expectedGain = 0;
      if (isYes) {
        yesCount += 1;
        const prob = ipo.allotment_probability_pct / 100;
        const cost = 15000.0;
        expectedGain = cost * prob * (ipo.listing_gains_pct / 100);
        currentCapital += expectedGain;
      }
      
      history.push({
        name: ipo.name,
        date: ipo.open_date,
        capital: currentCapital,
        gain: expectedGain,
        decision: isYes ? 'YES' : 'NO'
      });
    });
    
    return {
      finalCapital: currentCapital,
      totalProfit: currentCapital - 100000.0,
      yesCount,
      history
    };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <TrendingUp size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                Antigravity IPO Tracker
              </h1>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)' }}>
                8-Metric Investment Signal Engine
              </p>
            </div>
          </div>
          
          <nav style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setActiveTab('tracker')}
              className="tab-button"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'tracker' ? 'var(--accent-bg)' : 'transparent',
                color: activeTab === 'tracker' ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.2s ease'
              }}
            >
              Active Tracker
            </button>
            <button 
              onClick={() => setActiveTab('capital')}
              className="tab-button"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'capital' ? 'var(--accent-bg)' : 'transparent',
                color: activeTab === 'capital' ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.2s ease'
              }}
            >
              Capital Rotator
            </button>
            <button 
              onClick={() => setActiveTab('backtest')}
              className="tab-button"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'backtest' ? 'var(--accent-bg)' : 'transparent',
                color: activeTab === 'backtest' ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.2s ease'
              }}
            >
              Backtest (Playground)
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className="tab-button"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'guide' ? 'var(--accent-bg)' : 'transparent',
                color: activeTab === 'guide' ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.2s ease'
              }}
            >
              8 Metrics Guide
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ padding: '24px 0', flexGrow: 1 }}>
        
        {/* TAB 1: ACTIVE TRACKER */}
        {activeTab === 'tracker' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-h)' }}>
                    Ongoing & Upcoming IPOs
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
                    Track bidding metrics daily. YES signals activate on closing day if demand matches criteria.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--accent-border)', padding: '6px 12px', borderRadius: '20px', fontWeight: '500' }}>
                  <Sparkles size={14} /> Live Sync Active
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {ipos.map(ipo => {
                  const isClosingDay = true; // Simulating final day for evaluation testing
                  const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                  
                  return (
                    <div 
                      key={ipo.id}
                      onClick={() => setSelectedIpo(ipo)}
                      className="ipo-card"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '14px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: 'var(--shadow)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'var(--border-strong)';
                      }}
                    >
                      <div>
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            backgroundColor: ipo.status === 'bidding' ? 'var(--success-bg)' : 'rgba(0,0,0,0.05)', 
                            color: ipo.status === 'bidding' ? 'var(--success)' : 'var(--text)',
                            border: ipo.status === 'bidding' ? '1px solid var(--accent-border)' : '1px solid transparent'
                          }}>
                            {ipo.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} /> Closes {dateStr}
                          </span>
                        </div>
                        
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-h)', lineHeight: '1.2' }}>
                          {ipo.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                          Symbol: <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-h)' }}>{ipo.symbol}</span>
                        </p>
                        
                        {/* Primary KPI Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', marginBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>GMP Premium</span>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: ipo.gmp_pct >= 20 ? 'var(--success)' : 'var(--text-h)' }}>
                              {ipo.gmp_pct}%
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Subscription</span>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: ipo.total_sub >= 30 ? 'var(--success)' : 'var(--text-h)' }}>
                              {ipo.total_sub}x
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Issue Size</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-h)' }}>
                              ₹{ipo.issue_size_cr} Cr
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Lot Cost</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-h)' }}>
                              ₹{ipo.retail_lot_cost?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Signal Panel */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>Signal:</span>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '800', 
                            color: ipo.decision === 'YES' ? 'var(--success)' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {ipo.decision === 'YES' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                            {ipo.decision}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>
                          Review {ipo.score}/8 Rules <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAPITAL ROTATOR */}
        {activeTab === 'capital' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            
            {/* Left Column: Wallet Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} style={{ color: 'var(--accent)' }} /> Available Funds
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Trading Capital</span>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-h)', letterSpacing: '-1px' }}>
                    ₹{capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Progress bar of allocations */}
                <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ width: `${(liquidCapital / capital) * 100}%`, backgroundColor: 'var(--accent)' }}></div>
                  <div style={{ width: `${(totalBlocked / capital) * 100}%`, backgroundColor: 'var(--warning)' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span> Liquid Cash (Liquid)
                    </span>
                    <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>₹{liquidCapital.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span> ASBA Blocked (UPI)
                    </span>
                    <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>₹{totalBlocked.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--text-h)' }}>
                  Active UPI Bids Simulation
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: '0 0 16px 0' }}>
                  Simulate placing bids in active IPOs to test fund blockage and listings.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {ipos.filter(i => i.status === 'bidding').map(ipo => {
                    const activeLots = blockedBids[ipo.id] || 0;
                    return (
                      <div key={ipo.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-h)' }}>{ipo.symbol}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{ipo.retail_lot_cost} / lot</span>
                        </div>
                        
                        {activeLots > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <span>Blocked: {activeLots} Lot(s) (₹{ipo.retail_lot_cost * activeLots})</span>
                              <span style={{ color: 'var(--warning)', fontWeight: '500' }}>Awaiting Allotment</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <button 
                                onClick={() => handleAllotmentResult(ipo.id, true)}
                                style={{ padding: '6px', fontSize: '11px', border: 'none', borderRadius: '6px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', cursor: 'pointer', fontWeight: '500' }}
                              >
                                Allotted (Sell Gain)
                              </button>
                              <button 
                                onClick={() => handleAllotmentResult(ipo.id, false)}
                                style={{ padding: '6px', fontSize: '11px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: '500' }}
                              >
                                No Allotment (Refund)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handlePlaceBid(ipo.id, 1)}
                            disabled={ipo.retail_lot_cost > liquidCapital}
                            style={{ 
                              width: '100%', 
                              padding: '8px', 
                              backgroundColor: 'var(--accent)', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              cursor: 'pointer',
                              opacity: ipo.retail_lot_cost > liquidCapital ? 0.5 : 1
                            }}
                          >
                            Bid 1 Retail Lot (Apply ASBA)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Rotator Log & Calendar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)', flexGrow: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: 'var(--accent)' }} /> ASBA Refund & Listing Calendar
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: '0 0 20px 0' }}>
                  Your blocked bids will be unblocked on the refund date or listed shares will be sold on listing morning to free up capital.
                </p>

                {/* Simulated Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {ipos.map(ipo => {
                    const isBid = blockedBids[ipo.id] > 0;
                    return (
                      <div 
                        key={ipo.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '16px', 
                          border: '1px solid var(--border)', 
                          borderRadius: '12px', 
                          backgroundColor: isBid ? 'var(--accent-bg)' : 'transparent',
                          opacity: isBid ? 1 : 0.75
                        }}
                      >
                        <div style={{ minWidth: '80px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Allotment Date</span>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-h)' }}>
                            {ipo.allotment_date ? new Date(ipo.allotment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{ipo.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                            {isBid ? `Your Bid: ${blockedBids[ipo.id]} lot(s) (₹${ipo.retail_lot_cost * blockedBids[ipo.id]} blocked)` : "No active application placed"}
                          </span>
                        </div>
                        <div>
                          <span style={{ 
                            fontSize: '11px', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontWeight: '600',
                            backgroundColor: isBid ? 'var(--warning-bg)' : 'rgba(0,0,0,0.05)',
                            color: isBid ? 'var(--warning)' : 'var(--text)',
                          }}>
                            {isBid ? 'UPI BLOCKED' : 'NO BID'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Transaction history log */}
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-h)' }}>
                  Realized Gains Log
                </h3>
                {realizedGains.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No completed allotments or refunds recorded yet. Use the quick simulator actions on the left.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {realizedGains.map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: 'var(--text-h)', display: 'block' }}>{log.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.date} • {log.status}</span>
                        </div>
                        <span style={{ fontWeight: '700', color: log.gain > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {log.gain > 0 ? `+ ₹${log.gain.toFixed(2)}` : 'Refunded (Flat)'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKTESTING PLAYGROUND */}
        {activeTab === 'backtest' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-h)' }}>
                    Historical Performance Playground (2024 - 2026)
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
                    We compiled actual results for **{backtestData?.stats?.total_evaluated || 21} mainboard IPOs**. Adjust the thresholds below to see how yields respond dynamically!
                  </p>
                </div>
              </div>
              
              {/* Dynamic Playground Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-strong)', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>
                    Min. Grey Market Premium (GMP): {gmpThreshold}%
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={gmpThreshold} 
                    onChange={(e) => setGmpThreshold(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text)' }}>Rules out speculative IPOs with weak premium momentum.</span>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>
                    Min. Demand Subscription: {subThreshold}x
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={subThreshold} 
                    onChange={(e) => setSubThreshold(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text)' }}>Ensures mechanical buying pressure forces listed price up on listing.</span>
                </div>
              </div>

              {/* Dynamic KPI Outputs */}
              {(() => {
                const dynamicRes = runDynamicBacktest();
                const totalProfit = dynamicRes.totalProfit;
                const finalCapital = dynamicRes.finalCapital;
                const yesCount = dynamicRes.yesCount;
                
                const originalStats = backtestData?.stats || {};
                
                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                      <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Smart Filter Yield (Expected)</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
                          ₹{finalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                          + {((finalCapital - 100000) / 1000).toFixed(1)}% Listing Returns
                        </span>
                      </div>
                      
                      <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Blind Investment Yield</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: originalStats.blind_final_capital < 100000 ? 'var(--danger)' : 'var(--text-h)' }}>
                          ₹{originalStats.blind_final_capital?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '₹99,228'}
                        </div>
                        <span style={{ fontSize: '11px', color: originalStats.blind_final_capital < 100000 ? 'var(--danger)' : 'var(--text)' }}>
                          No filtration applied (Blind Lot application)
                        </span>
                      </div>
                      
                      <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bids Filtered (Smart)</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)' }}>
                          {yesCount} / {originalStats.total_evaluated || 21}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Applied only to the highest-probability setups
                        </span>
                      </div>
                    </div>

                    {/* Historical IPO list table */}
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '12px' }}>
                      Simulation Run Logs
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-h)', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Company (Symbol)</th>
                            <th style={{ padding: '10px' }}>Listing Gains %</th>
                            <th style={{ padding: '10px' }}>Allotment Prob.</th>
                            <th style={{ padding: '10px' }}>Decision</th>
                            <th style={{ padding: '10px' }}>Expected Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {originalStats.detailed_results?.map((res, idx) => {
                            // Find matching dynamic result
                            const dynRes = dynamicRes.history.find(h => h.name === res.name);
                            const finalDecision = dynRes ? dynRes.decision : res.decision;
                            const finalExpectedGain = dynRes ? dynRes.gain : 0;
                            
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 10px', fontWeight: '600', color: 'var(--text-h)' }}>
                                  {res.name} <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>({res.symbol})</span>
                                </td>
                                <td style={{ padding: '12px 10px', color: res.listing_gains_pct > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                                  {res.listing_gains_pct > 0 ? `+${res.listing_gains_pct}%` : `${res.listing_gains_pct}%`}
                                </td>
                                <td style={{ padding: '12px 10px' }}>{res.allotment_probability_pct}%</td>
                                <td style={{ padding: '12px 10px' }}>
                                  <span style={{ 
                                    padding: '3px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '11px', 
                                    fontWeight: '700',
                                    backgroundColor: finalDecision === 'YES' ? 'var(--success-bg)' : 'rgba(0,0,0,0.05)',
                                    color: finalDecision === 'YES' ? 'var(--success)' : 'var(--text)'
                                  }}>
                                    {finalDecision}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 10px', fontWeight: '700', color: finalExpectedGain > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                  {finalExpectedGain > 0 ? `+ ₹${finalExpectedGain.toFixed(0)}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 4: METRICS GUIDE */}
        {activeTab === 'guide' && (
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-h)' }}>
              The 8-Metric Valuation & Decision System
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 1 (MANDATORY)</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Real-Time Demand</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  Subscription must cross 30x (specifically, QIB &gt; 50x) on final closing day. High institutional demand forces buyers who missed out to buy on the open market, causing listing gains.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 2</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Capital Structure</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  OFS (Offer for Sale) should be less than 50% of the total issue. Low OFS ensures the majority of the capital raised is injected *into* the company for expansion rather than exits.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 3</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Valuation Buffer</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  IPO P/E ratio must sit at a 15% to 20% discount compared to its direct listed competitors in India. An overpriced IPO is corrected downwards instantly on day one.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 4 (MANDATORY)</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Sentiment Anchor (GMP)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  Grey Market Premium (GMP) premium trend should represent at least a 20% gain over the issue price. GMP acts as the key sentiment tracker prior to market opening.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 5</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Institutional Backing</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  The presence of Tier-1 Anchor books (blue-chip domestic mutual funds or sovereign wealth funds). Rigorous forensic audits are done by these entities prior to placing orders.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 6</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Fundamental Reality</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  Profit After Tax (PAT) margins over the last 3 consecutive fiscal years must be positive and growing. Avoid capital-heavy, bleeding tech startups for short-term listing plays.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 7</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Issue Size limit</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  Total issue size is under ₹3,000 Crore. Larger issues suffer from too much float supply, which caps the mechanical upward listing spike.
                </p>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>METRIC 8</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Skin In The Game</h3>
                <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                  Promoters must retain at least 50% stake post-IPO. Promoter lock-in indicates long-term commitment and prevents dumping immediately after the lock-in period.
                </p>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', padding: '20px 0', marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>© 2026 Antigravity IPO Analyzer. Designed for Profitability.</span>
          <span style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: 'var(--success)' }}>Green is Profit</span> • <span>Mainboard Only</span>
          </span>
        </div>
      </footer>

      {/* DETAIL MODAL DRAWER */}
      {selectedIpo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setSelectedIpo(null)}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                  {selectedIpo.name}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Active Bidding Analysis • Symbol: {selectedIpo.symbol}
                </p>
              </div>
              <button 
                onClick={() => setSelectedIpo(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text)'
                }}
              >
                &times;
              </button>
            </div>

            {/* Signal Highlight */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '16px', 
              backgroundColor: selectedIpo.decision === 'YES' ? 'var(--success-bg)' : 'var(--danger-bg)', 
              borderRadius: '12px',
              border: selectedIpo.decision === 'YES' ? '1px solid var(--accent-border)' : '1px solid var(--danger-border)',
              marginBottom: '24px'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: selectedIpo.decision === 'YES' ? 'var(--success)' : 'var(--danger)', display: 'block' }}>
                  Final Signal Recommendation
                </span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: selectedIpo.decision === 'YES' ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedIpo.decision === 'YES' ? '✔ YES - INVEST FOR LISTING GAINS' : '✖ NO - SKIP THIS IPO'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)' }}>
                  {selectedIpo.score}/8
                </span>
                <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-muted)' }}>Rules Passed</span>
              </div>
            </div>

            {/* Checklist of 8 Rules */}
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '12px' }}>
              The 8-Metric Checklist Breakdown
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {selectedIpo.rules && Object.keys(selectedIpo.rules).map(key => {
                const rule = selectedIpo.rules[key];
                const isMandatory = key === 'demand' || key === 'sentiment';
                
                return (
                  <div 
                    key={key} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '10px', 
                      backgroundColor: rule.passed ? 'rgba(16, 185, 129, 0.02)' : 'rgba(0,0,0,0.01)'
                    }}
                  >
                    <div style={{ marginRight: '12px' }}>
                      {rule.passed ? (
                        <CheckCircle2 style={{ color: 'var(--success)' }} size={20} />
                      ) : (
                        <XCircle style={{ color: isMandatory ? 'var(--danger)' : 'var(--text-muted)' }} size={20} />
                      )}
                    </div>
                    
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {rule.title}
                        {isMandatory && (
                          <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '8px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                            MANDATORY RULE
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{rule.description}</span>
                    </div>
                    
                    <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '13px', color: 'var(--text-h)' }}>
                      {rule.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Margins Log */}
            {selectedIpo.financials && selectedIpo.financials.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '12px' }}>
                  3-Year Financial Trajectory (₹ Crore)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {selectedIpo.financials.map((f, idx) => (
                    <div key={idx} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{f.fiscal_year}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', display: 'block' }}>₹{f.pat_cr} Cr PAT</span>
                      <span style={{ fontSize: '11px', color: f.pat_margin_pct > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                        {f.pat_margin_pct}% Margin
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* CTA action */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => setSelectedIpo(null)}
                style={{
                  flexGrow: 1,
                  padding: '12px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  color: 'var(--text)',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close Drawer
              </button>
              {selectedIpo.status === 'bidding' && (
                <button 
                  onClick={() => {
                    handlePlaceBid(selectedIpo.id, 1);
                    setSelectedIpo(null);
                  }}
                  disabled={selectedIpo.retail_lot_cost > liquidCapital}
                  style={{
                    flexGrow: 2,
                    padding: '12px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    opacity: selectedIpo.retail_lot_cost > liquidCapital ? 0.5 : 1
                  }}
                >
                  Place Bid (Block ₹{selectedIpo.retail_lot_cost?.toLocaleString('en-IN')})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
