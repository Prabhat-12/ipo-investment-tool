import React, { useState, useRef } from 'react';
import { 
  RefreshCw, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info 
} from 'lucide-react';

export default function DashboardPage({
  ipos = [],
  userApplications = [],
  userAccounts = [],
  userProfile = {},
  isMobile = false,
  capital = 100000,
  liquidCapital = 100000,
  lastRefreshedDate = '',
  dbLoading = false,
  onForceRefresh,
  onSelectIpo
}) {
  const [dashboardPipelineTab, setDashboardPipelineTab] = useState('recommended');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ipo_view_mode') || 'grid');
  const [pipelineScrollPage, setPipelineScrollPage] = useState(0);
  const pipelineScrollRef = useRef(null);

  // Limit to max 6 IPOs per tab with proper date sorting
  const biddingIpos = ipos
    .filter(i => i.status === 'bidding')
    .slice(0, 6);

  const upcomingIpos = ipos
    .filter(i => i.status === 'upcoming')
    .sort((a, b) => {
      const dateA = new Date(a.open_date || a.close_date || 0).getTime();
      const dateB = new Date(b.open_date || b.close_date || 0).getTime();
      return dateA - dateB;
    })
    .slice(0, 6);

  const closedIpos = ipos
    .filter(i => i.status !== 'bidding' && i.status !== 'upcoming')
    .sort((a, b) => {
      const dateB = new Date(b.close_date || b.listing_date || b.open_date || 0).getTime();
      const dateA = new Date(a.close_date || a.listing_date || a.open_date || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  const recommendedIpos = ipos
    .filter(i => i.decision === 'YES' && i.status === 'bidding')
    .slice(0, 6);

  const totalBids = userApplications.length;
  const allottedBids = userApplications.filter(a => a.status === 'ALLOTTED').length;
  const refundedBids = userApplications.filter(a => a.status === 'REFUNDED').length;
  const winRate = (allottedBids + refundedBids) > 0 ? Math.round((allottedBids / (allottedBids + refundedBids)) * 100) : (allottedBids > 0 ? 100 : 0);
  const totalRealizedProfit = userApplications
    .filter(a => a.status === 'ALLOTTED')
    .reduce((sum, a) => sum + parseFloat(a.listing_profit_rs || 0), 0);

  const totalBlocked = userApplications
    .filter(app => app.status === 'PENDING')
    .reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);

  let currentPipelineList = [];
  let emptyTabMsg = '';
  if (dashboardPipelineTab === 'recommended') {
    currentPipelineList = recommendedIpos;
    emptyTabMsg = 'No open IPOs currently have a YES investment recommendation.';
  } else if (dashboardPipelineTab === 'open_now') {
    currentPipelineList = biddingIpos;
    emptyTabMsg = 'No IPOs are currently active for bidding today.';
  } else if (dashboardPipelineTab === 'upcoming') {
    currentPipelineList = upcomingIpos;
    emptyTabMsg = 'No upcoming IPO listings scheduled in the next 7 days.';
  } else if (dashboardPipelineTab === 'closed') {
    currentPipelineList = closedIpos;
    emptyTabMsg = 'No recently closed IPO listings found.';
  }

  const renderDashboardCharts = () => {
    const allottedBidsList = [...userApplications]
      .filter(a => a.status === 'ALLOTTED')
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    let cumulative = 0;
    const profitPoints = allottedBidsList.map((bid, idx) => {
      cumulative += parseFloat(bid.listing_profit_rs || 0);
      const ipo = ipos.find(i => i.id === bid.ipo_id);
      return {
        name: ipo ? ipo.name : `Allotment ${idx + 1}`,
        value: cumulative,
        profit: parseFloat(bid.listing_profit_rs || 0)
      };
    });

    const totalGain = cumulative;

    return (
      <div className="premium-card" style={{ padding: '24px', flexGrow: 1, minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-h)', margin: 0 }}>
            Cumulative Profit Growth (₹)
          </h3>
          <span style={{
            fontSize: '12px',
            fontWeight: '800',
            color: 'var(--success)',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            padding: '4px 12px',
            borderRadius: '999px'
          }}>
            +₹{totalGain.toLocaleString('en-IN')} Total Gain
          </span>
        </div>

        {profitPoints.length === 0 ? (
          <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', borderRadius: '16px', border: '1px dashed var(--border-strong)', color: 'var(--text-muted)', fontSize: '12px', gap: '6px' }}>
            <span>Cumulative listing profits will graph here as allotments are harvested.</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Place bids and mark allotment status in the Family Rotator!</span>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>₹{(totalGain).toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)' }}>
                  ₹{(totalGain).toLocaleString('en-IN')} ({profitPoints[profitPoints.length - 1]?.name || 'Latest Allotment'})
                </span>
              </div>
              {profitPoints.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>₹{(profitPoints[0].value).toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    ₹{(profitPoints[0].value).toLocaleString('en-IN')} ({profitPoints[0]?.name || 'Initial Allotment'})
                  </span>
                </div>
              )}
            </div>

            <div style={{ width: '100%', height: '70px', marginTop: '10px' }}>
              {(() => {
                const svgW = 400;
                const svgH = 70;
                const padY = 8;
                const maxVal = Math.max(...profitPoints.map(p => p.value), 1);
                const minVal = 0;
                const range = maxVal - minVal || 1;

                const pts = [
                  { x: 0, y: svgH - padY },
                  ...profitPoints.map((p, idx) => ({
                    x: ((idx + 1) / profitPoints.length) * svgW,
                    y: (svgH - padY) - ((p.value - minVal) / range) * (svgH - 2 * padY)
                  }))
                ];

                const lineD = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
                const areaD = `${lineD} L ${svgW} ${svgH} L 0 ${svgH} Z`;
                const lastPt = pts[pts.length - 1];

                return (
                  <svg width="100%" height="70" viewBox="0 0 400 70" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#profitGrad)" />
                    <path d={lineD} fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={lastPt.x} cy={lastPt.y} r="4.5" fill="var(--success)" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.025em' }}>
            Welcome back, {userProfile?.display_name || 'Investor'}
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            Here is the executive summary of your family IPO investment portal today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', backgroundColor: '#f8fafc', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '999px', fontWeight: '500', alignSelf: isMobile ? 'flex-start' : 'center' }}>
          <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
            <span className="animate-ping" style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#34d399', opacity: 0.75 }}></span>
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: '6px', height: '6px', backgroundColor: 'var(--success)' }}></span>
          </span>
          Live Workspace Sync
        </div>
      </div>

      {/* Top 4 Statistics Grid */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)' }}>
        <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Active / Ongoing IPOs</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>{biddingIpos.length}</div>
        </div>

        <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Upcoming IPOs</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>{upcomingIpos.length}</div>
        </div>

        <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Total Invested Bids</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>{totalBids}</div>
        </div>

        <div style={{ flex: 1, padding: '24px 20px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '6px' }}>Realized Profit</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>
            ₹{totalRealizedProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Centerpiece: IPO Pipeline Section */}
      <div className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.3px' }}>
            IPO Pipeline
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {lastRefreshedDate && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Last checked: <strong style={{ color: 'var(--text-h)' }}>{lastRefreshedDate}</strong>
              </span>
            )}

            {onForceRefresh && (
              <button 
                onClick={onForceRefresh}
                disabled={dbLoading}
                className="btn"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '999px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-h)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
              >
                <RefreshCw size={12} className={dbLoading ? 'spin' : ''} />
                {dbLoading ? 'Syncing...' : 'Sync Market'}
              </button>
            )}

            <div style={{ display: isMobile ? 'none' : 'flex', backgroundColor: 'rgba(0,0,0,0.03)', padding: '3px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => { setViewMode('grid'); localStorage.setItem('ipo_view_mode', 'grid'); }}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Grid View
              </button>
              <button
                onClick={() => { setViewMode('list'); localStorage.setItem('ipo_view_mode', 'list'); }}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* 4 Pipeline Tabs (Horizontally scrollable on mobile) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '8px',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '14px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            onClick={() => {
              setDashboardPipelineTab('recommended');
              if (pipelineScrollRef.current) pipelineScrollRef.current.scrollTo({ left: 0 });
              setPipelineScrollPage(0);
            }}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              border: dashboardPipelineTab === 'recommended' ? '1px solid var(--accent-border)' : '1px solid transparent',
              borderRadius: '999px',
              cursor: 'pointer',
              backgroundColor: dashboardPipelineTab === 'recommended' ? 'var(--accent-bg)' : 'transparent',
              color: dashboardPipelineTab === 'recommended' ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            Recommended
            {recommendedIpos.length > 0 && (
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: dashboardPipelineTab === 'recommended' ? 'var(--accent)' : 'var(--border-strong)',
                color: '#ffffff'
              }}>
                {recommendedIpos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setDashboardPipelineTab('open_now');
              if (pipelineScrollRef.current) pipelineScrollRef.current.scrollTo({ left: 0 });
              setPipelineScrollPage(0);
            }}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              border: dashboardPipelineTab === 'open_now' ? '1px solid var(--accent-border)' : '1px solid transparent',
              borderRadius: '999px',
              cursor: 'pointer',
              backgroundColor: dashboardPipelineTab === 'open_now' ? 'var(--accent-bg)' : 'transparent',
              color: dashboardPipelineTab === 'open_now' ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            Open Now
            {biddingIpos.length > 0 && (
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: dashboardPipelineTab === 'open_now' ? 'var(--accent)' : 'var(--border-strong)',
                color: '#ffffff'
              }}>
                {biddingIpos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setDashboardPipelineTab('upcoming');
              if (pipelineScrollRef.current) pipelineScrollRef.current.scrollTo({ left: 0 });
              setPipelineScrollPage(0);
            }}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              border: dashboardPipelineTab === 'upcoming' ? '1px solid var(--accent-border)' : '1px solid transparent',
              borderRadius: '999px',
              cursor: 'pointer',
              backgroundColor: dashboardPipelineTab === 'upcoming' ? 'var(--accent-bg)' : 'transparent',
              color: dashboardPipelineTab === 'upcoming' ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            Upcoming
            {upcomingIpos.length > 0 && (
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: dashboardPipelineTab === 'upcoming' ? 'var(--accent)' : 'var(--border-strong)',
                color: '#ffffff'
              }}>
                {upcomingIpos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setDashboardPipelineTab('closed');
              if (pipelineScrollRef.current) pipelineScrollRef.current.scrollTo({ left: 0 });
              setPipelineScrollPage(0);
            }}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              border: dashboardPipelineTab === 'closed' ? '1px solid var(--accent-border)' : '1px solid transparent',
              borderRadius: '999px',
              cursor: 'pointer',
              backgroundColor: dashboardPipelineTab === 'closed' ? 'var(--accent-bg)' : 'transparent',
              color: dashboardPipelineTab === 'closed' ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            Closed
            {closedIpos.length > 0 && (
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: dashboardPipelineTab === 'closed' ? 'var(--accent)' : 'var(--border-strong)',
                color: '#ffffff'
              }}>
                {closedIpos.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content (Mobile Stack, Desktop Table, or Desktop Cards) */}
        {currentPipelineList.length === 0 ? (
          <div style={{ padding: '36px 20px', border: '1px dashed var(--border-strong)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            {emptyTabMsg}
          </div>
        ) : isMobile ? (
          /* Mobile View: Clean Card Stack */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentPipelineList.slice(0, 6).map((ipo) => {
              const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
              const lotCost = ipo.retail_lot_cost 
                ? ipo.retail_lot_cost.toLocaleString('en-IN') 
                : (ipo.price_band_high && ipo.lot_size ? (ipo.price_band_high * ipo.lot_size).toLocaleString('en-IN') : '14,938');

              const isYes = ipo.decision === 'YES';
              const isWatch = ipo.decision === 'WATCH';
              const letter = isYes ? 'Y' : isWatch ? 'M' : 'N';
              const circleBg = isYes ? '#ecfdf5' : isWatch ? '#fffbeb' : '#fff1f2';
              const circleBorder = isYes ? '#10b981' : isWatch ? '#b45309' : '#be123c';
              const circleColor = isYes ? '#047857' : isWatch ? '#b45309' : '#be123c';

              return (
                <div
                  key={ipo.id}
                  onClick={() => onSelectIpo(ipo)}
                  className="mobile-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: circleBg,
                        border: `1.5px solid ${circleBorder}`,
                        color: circleColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '13px',
                        flexShrink: 0
                      }}>
                        {letter}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-h)', letterSpacing: '-0.3px' }}>
                        {ipo.name}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#475569',
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      GMP: {ipo.gmp_pct ? `+${ipo.gmp_pct}%` : '0%'}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border)', margin: '2px 0' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      1 Lot: <strong style={{ color: 'var(--text-h)' }}>₹{lotCost}</strong> • {ipo.status === 'upcoming' ? `Opens ${dateStr}` : `Closes ${dateStr}`}
                    </span>
                    <span style={{ fontWeight: '800', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      View Details <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'list' ? (
          /* Table List View */
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.015)', borderBottom: '1px solid var(--border)' }}>
                  <th scope="col" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Company</th>
                  <th scope="col" className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>GMP Premium</th>
                  <th scope="col" className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>QIB Demand</th>
                  <th scope="col" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Allotment Odds</th>
                  <th scope="col" className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Issue Size</th>
                  <th scope="col" className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Lot Cost</th>
                  <th scope="col" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Timeline</th>
                  <th scope="col" style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {currentPipelineList.map((ipo) => {
                  const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                  return (
                    <tr
                      key={ipo.id}
                      onClick={() => onSelectIpo(ipo)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-h)' }}>{ipo.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Symbol: {ipo.symbol}</div>
                      </td>
                      <td className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '700', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                        {ipo.gmp_pct ? `+${ipo.gmp_pct}%` : '0%'}
                      </td>
                      <td className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '700', color: ipo.qib_sub >= 50 ? 'var(--success)' : ipo.qib_sub > 0 ? 'var(--accent)' : 'var(--text-h)' }}>
                        {ipo.qib_sub && ipo.qib_sub > 0 ? `${ipo.qib_sub}x` : (ipo.total_sub ? `${ipo.total_sub}x` : 'Not available')}
                      </td>
                      <td className="tabular-nums" style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--success)' }}>
                        {ipo.retail_sub && ipo.retail_sub > 1 ? `${(100 / ipo.retail_sub).toFixed(1)}%` : '100%'}
                      </td>
                      <td className="tabular-nums" style={{ padding: '14px 18px', color: 'var(--text-h)' }}>
                        ₹{ipo.issue_size_cr} Cr
                      </td>
                      <td className="tabular-nums" style={{ padding: '14px 18px', color: 'var(--text-h)' }}>
                        ₹{ipo.retail_lot_cost?.toLocaleString('en-IN') || (ipo.price_band_high && ipo.lot_size ? (ipo.price_band_high * ipo.lot_size).toLocaleString('en-IN') : '14,938')}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {ipo.status === 'upcoming' ? `Opens ${dateStr}` : `Closes ${dateStr}`}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: ipo.decision === 'YES' ? 'var(--success)' : ipo.decision === 'WATCH' ? 'var(--warning)' : 'var(--danger)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          backgroundColor: ipo.decision === 'YES' ? 'var(--success-bg)' : ipo.decision === 'WATCH' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          borderRadius: 'var(--radius-xs)',
                          border: ipo.decision === 'YES' ? '1px solid var(--success-border)' : ipo.decision === 'WATCH' ? '1px solid var(--warning-border)' : '1px solid var(--danger-border)'
                        }}>
                          {ipo.decision === 'YES' && <CheckCircle2 size={11} className="icon-optical" />}
                          {ipo.decision === 'WATCH' && <AlertTriangle size={11} className="icon-optical" />}
                          {ipo.decision === 'NO' && <XCircle size={11} className="icon-optical" />}
                          {ipo.decision === 'YES' ? 'YES — APPLY' : ipo.decision === 'WATCH' ? 'MAYBE — WATCH' : 'NO — AVOID'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Horizontal Scroll View (Desktop Only) */
          <div>
            <div
              ref={pipelineScrollRef}
              onScroll={() => {
                setPipelineScrollPage(0);
              }}
              className="ipo-pipeline-grid"
            >
              {currentPipelineList.map((ipo) => {
                const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                const lotCost = ipo.retail_lot_cost 
                  ? ipo.retail_lot_cost.toLocaleString('en-IN') 
                  : (ipo.price_band_high && ipo.lot_size ? (ipo.price_band_high * ipo.lot_size).toLocaleString('en-IN') : '14,938');

                return (
                  <div
                    key={ipo.id}
                    onClick={() => onSelectIpo(ipo)}
                    className="premium-card ipo-card"
                    style={{
                      scrollSnapAlign: 'start',
                      backgroundColor: 'var(--card-bg)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border)',
                      boxShadow: 'none',
                      transition: 'border-color var(--duration-enter) var(--ease-out-quint)',
                      minHeight: '310px',
                      minWidth: '0px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          backgroundColor: ipo.status === 'bidding' ? 'rgba(16, 185, 129, 0.12)' : ipo.status === 'upcoming' ? 'var(--warning-bg)' : 'rgba(0,0,0,0.05)',
                          color: ipo.status === 'bidding' ? 'var(--success)' : ipo.status === 'upcoming' ? 'var(--warning)' : 'var(--text-muted)'
                        }}>
                          {ipo.status === 'bidding' ? 'BIDDING' : ipo.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          <Calendar size={12} /> {ipo.status === 'upcoming' ? `Opens ${dateStr}` : `Closes ${dateStr}`}
                        </span>
                      </div>

                      {/* Title & Symbol */}
                      <h4 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 2px 0', color: 'var(--text-h)', lineHeight: '1.2' }}>
                        {ipo.name}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
                        Symbol: <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-h)', fontWeight: '600' }}>{ipo.symbol}</span>
                      </p>

                      {/* Recommendation Box */}
                      <div style={{
                        borderRadius: '12px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        backgroundColor: ipo.decision === 'YES' 
                          ? 'var(--success-bg)'
                          : ipo.decision === 'WATCH' 
                            ? 'var(--warning-bg)'
                            : 'var(--danger-bg)',
                        border: ipo.decision === 'YES' 
                          ? '1px solid var(--success-border)'
                          : ipo.decision === 'WATCH' 
                            ? '1px solid var(--warning-border)'
                            : '1px solid var(--danger-border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {ipo.decision === 'YES' && <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                          {ipo.decision === 'WATCH' && <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />}
                          {ipo.decision === 'NO' && <XCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '800',
                            letterSpacing: '0.2px',
                            color: ipo.decision === 'YES' ? 'var(--success)' : ipo.decision === 'WATCH' ? 'var(--warning)' : 'var(--danger)'
                          }}>
                            {ipo.decision === 'YES' ? 'YES — APPLY' : ipo.decision === 'WATCH' ? 'MAYBE — WATCH' : 'NO — AVOID'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-h)', marginTop: '4px', fontWeight: '700', paddingLeft: '26px' }}>
                          Reason: <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{ipo.reason || (ipo.decision === 'YES' ? 'All mandatory checks passed' : 'Criteria not met')}</span>
                        </div>
                      </div>

                      {/* Decision-Driving Metrics */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        marginBottom: '14px'
                      }}>
                        <div>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '2px' }}>
                            GMP PREMIUM
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                            {ipo.gmp_pct ? `+${ipo.gmp_pct}%` : '0%'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '2px' }}>
                            QIB DEMAND
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: ipo.qib_sub >= 50 ? 'var(--success)' : ipo.qib_sub > 0 ? 'var(--accent)' : 'var(--text-h)' }}>
                            {ipo.qib_sub && ipo.qib_sub > 0 ? `${ipo.qib_sub}x` : (ipo.total_sub ? `${ipo.total_sub}x` : 'Not available')}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.3px', marginBottom: '2px' }}>
                            ALLOTMENT ODDS
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--success)' }}>
                            {ipo.retail_sub && ipo.retail_sub > 1 ? `${(100 / ipo.retail_sub).toFixed(1)}%` : '100%'}
                          </span>
                        </div>
                      </div>

                      {/* Checklist Summary */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: '14px',
                        color: 'var(--text-muted)'
                      }}>
                        {ipo.decision === 'YES' ? (
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> All mandatory passed • {ipo.score}/8 checks passed
                          </span>
                        ) : ipo.decision === 'WATCH' ? (
                          <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> {ipo.score}/8 checks passed • {ipo.mandatoryPending || 2} mandatory pending
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> {ipo.mandatoryFailed > 0 ? `${ipo.mandatoryFailed} mandatory failed` : 'Threshold not met'} • {ipo.score}/8 checks passed
                          </span>
                        )}
                        <Info size={12} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
                      </div>
                    </div>

                    {/* Bottom Execution Information */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '12px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-h)' }}>
                        1 Lot: ₹{lotCost}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        View Details <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination for Desktop */}
            {!isMobile && currentPipelineList.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    if (pipelineScrollRef.current) {
                      pipelineScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                      setPipelineScrollPage(0);
                    }
                  }}
                  style={{
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    width: pipelineScrollPage === 0 ? '22px' : '6px',
                    height: '6px',
                    borderRadius: pipelineScrollPage === 0 ? '4px' : '50%',
                    backgroundColor: pipelineScrollPage === 0 ? 'var(--accent)' : 'var(--border-strong)',
                    transition: 'all 0.25s ease'
                  }}
                  title="Page 1"
                />
                <button
                  onClick={() => {
                    if (pipelineScrollRef.current) {
                      pipelineScrollRef.current.scrollTo({ left: pipelineScrollRef.current.scrollWidth, behavior: 'smooth' });
                      setPipelineScrollPage(1);
                    }
                  }}
                  style={{
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    width: pipelineScrollPage === 1 ? '22px' : '6px',
                    height: '6px',
                    borderRadius: pipelineScrollPage === 1 ? '4px' : '50%',
                    backgroundColor: pipelineScrollPage === 1 ? 'var(--accent)' : 'var(--border-strong)',
                    transition: 'all 0.25s ease'
                  }}
                  title="Page 2"
                />
              </div>
            )}

            {/* Bottom Decision Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                  <strong style={{ color: 'var(--text-h)' }}>YES — APPLY</strong>
                  <span style={{ color: 'var(--text-muted)' }}>Strong probability of listing gain</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
                  <strong style={{ color: 'var(--text-h)' }}>MAYBE — WATCH</strong>
                  <span style={{ color: 'var(--text-muted)' }}>Mixed signals, monitor closely</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={13} style={{ color: 'var(--danger)' }} />
                  <strong style={{ color: 'var(--text-h)' }}>NO — AVOID</strong>
                  <span style={{ color: 'var(--text-muted)' }}>Low probability of listing gain</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '11px' }}>
                <Info size={12} />
                <span>2 mandatory checks must pass. Minimum 6 total checks must pass for YES.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Middle Section: Cumulative Profit Growth & Allotment Win Rate */}
      <div className="dashboard-metrics-grid-21">
        {renderDashboardCharts()}

        {/* Allotment Win Rate Circular Gauge */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-h)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ALLOTMENT WIN RATE
          </h3>
          
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="65" cy="65" r="52" fill="none" stroke="var(--success)" strokeWidth="10" 
                strokeDasharray="326.72" 
                strokeDashoffset={326.72 - (326.72 * winRate) / 100} 
                strokeLinecap="round" 
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-h)', lineHeight: '1' }}>{winRate}%</span>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', marginTop: '4px', letterSpacing: '0.5px' }}>ALLOTTED</span>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '12px', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--success)', fontWeight: '800' }}>{allottedBids}</span> Allotted
            </div>
            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-strong)' }}></div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{refundedBids}</span> Refunded
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Capital Pool & Active Bids Checklist */}
      <div className="dashboard-metrics-grid-11">
        {/* Family Capital Pool */}
        <div className="premium-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Family Capital Pool</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Capital Pool</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-h)' }}>₹{capital.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ASBA Blocked Funds</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning)' }}>₹{totalBlocked.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Available Liquid Cash</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>₹{liquidCapital.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ width: `${(liquidCapital / capital) * 100}%`, backgroundColor: 'var(--success)', transition: 'width 0.3s ease' }}></div>
            <div style={{ width: `${(totalBlocked / capital) * 100}%`, backgroundColor: 'var(--warning)', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>

        {/* Active Bids Checklist */}
        <div className="premium-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Active Bid Checklist</h3>
          {userApplications.filter(a => a.status === 'PENDING').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No active ASBA blocks found. Start bidding in the IPO Pipeline above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto' }}>
              {userApplications.filter(a => a.status === 'PENDING').map(app => {
                const ipo = ipos.find(i => i.id === app.ipo_id);
                const account = userAccounts.find(acc => acc.id === app.account_id);
                if (!ipo || !account) return null;
                
                return (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{ipo.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Slot: {account.account_holder_name}</span>
                    </div>
                    <span className="badge badge-warning">Blocked ₹{app.bid_amount.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
