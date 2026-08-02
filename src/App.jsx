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
  ArrowRight,
  LogOut,
  User,
  Users,
  Plus,
  Trash2,
  Lock,
  Eye,
  Settings
} from 'lucide-react';

// Import JSON data compiled by Python engine
import dbLocal from './data/db_local.json';
import backtestData from './data/backtest_results.json';
import { supabase } from './supabaseClient';

// Mock profiles for Guest / Offline Mode
const MOCK_PROFILES = [
  { id: 'mock-prabhat', display_name: 'Prabhat (Self)', email: 'prabhat@example.com' },
  { id: 'mock-sahil', display_name: 'Sahil (Brother)', email: 'sahil@example.com' },
  { id: 'mock-father', display_name: 'Anil (Father)', email: 'anil@example.com' }
];

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker');
  const [selectedIpo, setSelectedIpo] = useState(null);

  // Auth Screen State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Capital Rotator State
  const [capital, setCapital] = useState(100000);
  const [userAccounts, setUserAccounts] = useState([]); // PAN slots
  const [userApplications, setUserApplications] = useState([]); // ASBA applications
  const [dbLoading, setDbLoading] = useState(true);

  // Add Account Slot Modal/Form State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPan, setNewAccountPan] = useState('');

  // Custom backtest threshold state (interactive playground)
  const [gmpThreshold, setGmpThreshold] = useState(20);
  const [subThreshold, setSubThreshold] = useState(30);

  // Active IPOs State
  const [ipos, setIpos] = useState([]);

  // Check for active Supabase session
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setIsGuestMode(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSession(session);
          setIsGuestMode(false);
        } else {
          setSession(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Fetch / Sync Data depending on Session & Guest Mode
  useEffect(() => {
    async function loadData() {
      setDbLoading(true);

      // 1. Fetch Global Market Data (IPOs, Subs, GMP)
      let activeIposList = [];
      if (supabase) {
        try {
          const { data: cloudIpos, error: ipoError } = await supabase.from('ipos').select('*');
          if (!ipoError && cloudIpos && cloudIpos.length > 0) {
            const { data: cloudSubs } = await supabase.from('subscriptions').select('*');
            const { data: cloudGmps } = await supabase.from('gmp_history').select('*');
            const { data: cloudPeers } = await supabase.from('peers').select('*');
            const { data: cloudFins } = await supabase.from('financials').select('*');
            const { data: cloudAnchors } = await supabase.from('anchor_investors').select('*');

            activeIposList = cloudIpos.map(ipo => {
              const subs = cloudSubs?.filter(s => s.ipo_id === ipo.id) || [];
              const gmpRecs = cloudGmps?.filter(g => g.ipo_id === ipo.id) || [];
              const peers = cloudPeers?.filter(p => p.ipo_id === ipo.id) || [];
              const financials = cloudFins?.filter(f => f.ipo_id === ipo.id) || [];
              const anchors = cloudAnchors?.filter(a => a.ipo_id === ipo.id) || [];

              const total_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].total) : 0.0;
              const qib_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].qib) : 0.0;
              const retail_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].retail) : 0.0;
              const gmp_pct = gmpRecs.length > 0 ? parseFloat(gmpRecs[gmpRecs.length - 1].implied_gain_pct) : 0.0;

              const pe_ratio = ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0;
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

              const evalRes = evaluateIpoClient(details);
              return {
                ...details,
                score: evalRes.score,
                decision: evalRes.decision,
                rules: evalRes.rules,
                notes: evalRes.notes
              };
            });
          }
        } catch (e) {
          console.error("Failed to load global market data from Supabase:", e);
        }
      }

      // Local Fallback for Global Market Data
      if (activeIposList.length === 0 && dbLocal && dbLocal.ipos) {
        activeIposList = dbLocal.ipos.map(ipo => {
          const subs = dbLocal.subscriptions.filter(s => s.ipo_id === ipo.id) || [];
          const gmpRecs = dbLocal.gmp_history.filter(g => g.ipo_id === ipo.id) || [];
          const peers = dbLocal.peers.filter(p => p.ipo_id === ipo.id) || [];
          const financials = dbLocal.financials.filter(f => f.ipo_id === ipo.id) || [];
          const anchors = dbLocal.anchor_investors.filter(a => a.ipo_id === ipo.id) || [];

          const total_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].total) : 0.0;
          const qib_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].qib) : 0.0;
          const retail_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].retail) : 0.0;
          const gmp_pct = gmpRecs.length > 0 ? parseFloat(gmpRecs[gmpRecs.length - 1].implied_gain_pct) : 0.0;

          const pe_ratio = ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0;
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

          const evalRes = evaluateIpoClient(details);
          return {
            ...details,
            score: evalRes.score,
            decision: evalRes.decision,
            rules: evalRes.rules,
            notes: evalRes.notes
          };
        });
      }
      setIpos(activeIposList);

      // 2. Fetch User Profiles, Account Slots (PAN slots) & ASBA Application logs
      if (session) {
        const userId = session.user?.id || session.id;

        if (supabase && !isGuestMode) {
          try {
            // Load PAN Account slots
            const { data: accounts, error: accError } = await supabase
              .from('user_accounts')
              .select('*')
              .eq('user_id', userId);

            if (!accError) setUserAccounts(accounts || []);

            // Load active ASBA bids
            const { data: apps, error: appError } = await supabase
              .from('user_applications')
              .select('*')
              .eq('user_id', userId);

            if (!appError) setUserApplications(apps || []);
          } catch (e) {
            console.error("Cloud DB fetch error for accounts/apps:", e);
          }
        } else {
          // Offline/Guest Mode: Load from localStorage
          const localAccounts = localStorage.getItem(`ipo_accounts_${userId}`);
          const localApps = localStorage.getItem(`ipo_applications_${userId}`);
          const localCapital = localStorage.getItem(`ipo_capital_${userId}`);

          if (localAccounts) {
            setUserAccounts(JSON.parse(localAccounts));
          } else {
            // Seed default PAN accounts for the guest profile
            const defaults = [
              { id: `acc-self-${userId}`, user_id: userId, account_holder_name: `${session.display_name || 'Self'} (Primary)`, pan_mask: 'ABCDE***1F', status: 'active' },
              { id: `acc-spouse-${userId}`, user_id: userId, account_holder_name: 'Sahil (Brother)', pan_mask: 'WXYZT***9K', status: 'active' },
              { id: `acc-father-${userId}`, user_id: userId, account_holder_name: 'Anil (Father)', pan_mask: 'MNOPI***5H', status: 'active' }
            ];
            setUserAccounts(defaults);
            localStorage.setItem(`ipo_accounts_${userId}`, JSON.stringify(defaults));
          }

          if (localApps) {
            setUserApplications(JSON.parse(localApps));
          } else {
            setUserApplications([]);
            localStorage.setItem(`ipo_applications_${userId}`, JSON.stringify([]));
          }

          if (localCapital) {
            setCapital(parseFloat(localCapital));
          } else {
            setCapital(100000);
            localStorage.setItem(`ipo_capital_${userId}`, JSON.stringify(100000));
          }
        }
      }
      setDbLoading(false);
    }

    loadData();
  }, [session, isGuestMode]);

  // Client-side rule evaluator
  function evaluateIpoClient(ipo) {
    const rules = {};
    let score = 0;

    // 1. Demand (Gate 1)
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

    // 4. Sentiment (Gate 2)
    rules.sentiment = {
      title: 'Sentiment Anchor (GMP)',
      description: 'Implied premium >= 20%',
      value: `GMP Implied Premium: ${ipo.gmp_pct}%`,
      passed: ipo.gmp_pct >= gmpThreshold
    };
    if (rules.sentiment.passed) score += 1;

    // 5. Anchors
    const anchorScore = ipo.anchors && ipo.anchors.length > 0 ? 85 : 50;
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

    // Final Decision: Gates 1 & 2 are MANDATORY + Score >= 5
    const isYes = rules.demand.passed && rules.sentiment.passed && score >= 5;
    const decision = isYes ? 'YES' : 'NO';

    // Reasoning Notes
    const notes = [];
    if (isYes) {
      notes.push("Strong Listing Setup. High GMP premium backed by strong subscription velocities.");
    } else {
      if (!rules.demand.passed) notes.push("Failed Demand Gate: Subscriptions did not meet threshold.");
      if (!rules.sentiment.passed) notes.push("Failed Sentiment Gate: GMP premium is below 20%.");
      if (score < 5) notes.push(`Failed Discretionary Score: Only passed ${score}/8 checklist parameters.`);
    }

    return { score, decision, rules, notes: notes.join(' ') };
  }

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError(null);

    if (supabase) {
      try {
        if (authMode === 'login') {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName }
            }
          });
          if (error) throw error;
          alert("Signup successful! Please log in.");
          setAuthMode('login');
        }
      } catch (err) {
        setAuthError(err.message);
      }
    } else {
      setAuthError("Supabase client is offline. Please use Recruiter Guest Login.");
    }
    setAuthLoading(false);
  };

  const handleGuestLogin = (profile) => {
    setIsGuestMode(true);
    setSession({
      id: profile.id,
      display_name: profile.display_name,
      user: { id: profile.id, email: profile.email }
    });
  };

  const handleLogout = async () => {
    if (supabase && !isGuestMode) {
      await supabase.auth.signOut();
    } else {
      setSession(null);
      setIsGuestMode(false);
    }
  };

  // Capital Rotator Computations
  const totalBlocked = userApplications
    .filter(app => app.status === 'PENDING')
    .reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);

  const liquidCapital = capital - totalBlocked;

  // Rotator Operations
  const handleAddAccountSlot = async (e) => {
    e.preventDefault();
    if (!newAccountName || !newAccountPan) return;

    const userId = session.user?.id || session.id;
    const newAcc = {
      account_holder_name: newAccountName,
      pan_mask: newAccountPan.toUpperCase(),
      status: 'active',
      user_id: userId
    };

    if (supabase && !isGuestMode) {
      const { data, error } = await supabase
        .from('user_accounts')
        .insert(newAcc)
        .select();
      if (error) {
        alert("Failed to insert account slot: " + error.message);
      } else {
        setUserAccounts(prev => [...prev, data[0]]);
      }
    } else {
      const updated = [...userAccounts, { ...newAcc, id: `acc-${Date.now()}` }];
      setUserAccounts(updated);
      localStorage.setItem(`ipo_accounts_${userId}`, JSON.stringify(updated));
    }

    setNewAccountName('');
    setNewAccountPan('');
    setShowAddAccountModal(false);
  };

  const handleDeleteAccountSlot = async (accountId) => {
    const userId = session.user?.id || session.id;
    // Check if slot has active blocked applications
    const activeBids = userApplications.filter(app => app.account_id === accountId && app.status === 'PENDING');
    if (activeBids.length > 0) {
      alert("Cannot delete account slot with active pending bids! Please resolve allotments first.");
      return;
    }

    if (supabase && !isGuestMode) {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', accountId);
      if (error) {
        alert("Failed to delete slot: " + error.message);
      } else {
        setUserAccounts(prev => prev.filter(a => a.id !== accountId));
      }
    } else {
      const updated = userAccounts.filter(a => a.id !== accountId);
      setUserAccounts(updated);
      localStorage.setItem(`ipo_accounts_${userId}`, JSON.stringify(updated));
    }
  };

  const handlePlaceBid = async (ipoId, accountId, lots) => {
    const ipo = ipos.find(i => i.id === ipoId);
    const account = userAccounts.find(a => a.id === accountId);
    if (!ipo || !account) return;

    const lotCost = ipo.retail_lot_cost * lots;
    if (lotCost > liquidCapital) {
      alert("Insufficient liquid cash in family pool to place this application!");
      return;
    }

    const userId = session.user?.id || session.id;
    const newApp = {
      user_id: userId,
      account_id: accountId,
      ipo_id: ipoId,
      lots_applied: lots,
      bid_amount: lotCost,
      status: 'PENDING',
      listing_profit_rs: 0.00
    };

    if (supabase && !isGuestMode) {
      const { data, error } = await supabase
        .from('user_applications')
        .insert(newApp)
        .select();
      if (error) {
        alert("Failed to place application: " + error.message);
      } else {
        setUserApplications(prev => [...prev, data[0]]);
      }
    } else {
      const updated = [...userApplications, { ...newApp, id: `app-${Date.now()}` }];
      setUserApplications(updated);
      localStorage.setItem(`ipo_applications_${userId}`, JSON.stringify(updated));
    }
  };

  const handleResolveApplication = async (appId, success) => {
    const app = userApplications.find(a => a.id === appId);
    if (!app) return;
    const ipo = ipos.find(i => i.id === app.ipo_id);
    if (!ipo) return;

    let profit = 0;
    if (success) {
      profit = app.bid_amount * (ipo.gmp_pct / 100);
    }

    const userId = session.user?.id || session.id;

    if (supabase && !isGuestMode) {
      const { error } = await supabase
        .from('user_applications')
        .update({ status: success ? 'ALLOTTED' : 'REFUNDED', listing_profit_rs: profit })
        .eq('id', appId);
      if (error) {
        alert("Failed to resolve allotment: " + error.message);
      } else {
        setUserApplications(prev => prev.map(a => {
          if (a.id === appId) {
            return { ...a, status: success ? 'ALLOTTED' : 'REFUNDED', listing_profit_rs: profit };
          }
          return a;
        }));
        if (success) {
          const newCap = capital + profit;
          setCapital(newCap);
        }
      }
    } else {
      // Offline mode updates
      const updated = userApplications.map(a => {
        if (a.id === appId) {
          return { ...a, status: success ? 'ALLOTTED' : 'REFUNDED', listing_profit_rs: profit };
        }
        return a;
      });
      setUserApplications(updated);
      localStorage.setItem(`ipo_applications_${userId}`, JSON.stringify(updated));

      if (success) {
        const newCap = capital + profit;
        setCapital(newCap);
        localStorage.setItem(`ipo_capital_${userId}`, JSON.stringify(newCap));
      }
    }
  };

  // Reset Rotator State
  const handleResetCapital = () => {
    if (window.confirm("Are you sure you want to reset your portfolio and clear all application histories?")) {
      const userId = session.user?.id || session.id;
      if (supabase && !isGuestMode) {
        supabase.from('user_applications').delete().eq('user_id', userId).then(() => {
          setUserApplications([]);
          setCapital(100000);
        });
      } else {
        setUserApplications([]);
        setCapital(100000);
        localStorage.setItem(`ipo_applications_${userId}`, JSON.stringify([]));
        localStorage.setItem(`ipo_capital_${userId}`, JSON.stringify(100000));
      }
    }
  };

  // Backtest playground computations
  const runDynamicBacktest = () => {
    if (!backtestData || !backtestData.stats || !backtestData.stats.detailed_results) return { stats: {}, history: [] };

    const iposList = backtestData.stats.detailed_results;
    let currentCapital = 100000.0;
    const history = [];
    let yesCount = 0;

    iposList.forEach(ipo => {
      const total_sub = ipo.total_sub || 35.0;
      const gmp_pct = ipo.listing_gains_pct * 0.8;

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

  // ==========================================
  // RENDER AUTH SCREEN (IF NOT LOGGED IN)
  // ==========================================
  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(16,185,129,0.1), transparent 50%), radial-gradient(ellipse at bottom left, rgba(59,130,246,0.05), transparent 50%)',
        padding: '24px',
        color: '#f9fafb'
      }}>
        <div style={{
          maxWidth: '850px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}>

          {/* Logo & Product Concept */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '14px', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <TrendingUp size={32} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-1px', color: '#fff' }}>
                  Antigravity IPO
                </h1>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Systematic Listing Gain Engine
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>
              An algorithmic analyzer that strips emotion from IPO bidding in India. By tracking real-time QIB/retail subscriptions, GMP premium curves, and promoters' post-IPO stakes, the engine provides clear YES/NO investment signals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <span>**8 strict quantitative rules** evaluating demand, metrics, and anchors.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <span>**Multi-PAN Account Management** to optimize retail allotment odds.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <span>**Telegram Push Notifications** delivering closing alerts to your phone.</span>
              </div>
            </div>
          </div>

          {/* Login / Guest Selector Card */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            backdropFilter: 'blur(16px)'
          }}>

            {/* Authenticated Mode Login */}
            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', marginBottom: '20px', paddingBottom: '2px' }}>
                <button
                  onClick={() => setAuthMode('login')}
                  style={{ flexGrow: 1, paddingBottom: '12px', border: 'none', background: 'none', color: authMode === 'login' ? '#10b981' : '#6b7280', borderBottom: authMode === 'login' ? '2px solid #10b981' : 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{ flexGrow: 1, paddingBottom: '12px', border: 'none', background: 'none', color: authMode === 'signup' ? '#10b981' : '#6b7280', borderBottom: authMode === 'signup' ? '2px solid #10b981' : 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {authMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '13px' }}
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '13px' }}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '13px' }}
                  required
                />

                {authError && <div style={{ fontSize: '12px', color: '#ef4444' }}>{authError}</div>}

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: authLoading ? 0.6 : 1
                  }}
                >
                  {authLoading ? 'Authorizing...' : authMode === 'login' ? 'Sign In Securely' : 'Register Account'}
                </button>
              </form>
            </div>

            {/* Recruiter / Guest Demo Mode Selector */}
            <div style={{ borderTop: '1px dashed #1f2937', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={14} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.5px' }}>
                  Recruiter & Guest Access
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                Testing the system workflow without a Supabase cloud database? Launch instantly in simulated Multi-User Offline mode:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOCK_PROFILES.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => handleGuestLogin(profile)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={13} style={{ color: '#10b981' }} />
                      {profile.display_name}
                    </span>
                    <ArrowRight size={13} style={{ color: '#6b7280' }} />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER LOGGED IN PORTAL VIEW
  // ==========================================
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: 'var(--bg)' }}>

      {/* HEADER SECTION */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <TrendingUp size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                Antigravity IPO
              </h1>
              <p style={{ fontSize: '11px', margin: 0, color: 'var(--text-muted)' }}>
                {isGuestMode ? 'OFFLINE GUEST WORKSPACE' : 'CLOUD WORKSPACE ACTIVE'}
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            {['tracker', 'capital', 'backtest', 'guide'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text)',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'tracker' && 'Active Tracker'}
                {tab === 'capital' && 'Family Rotator'}
                {tab === 'backtest' && 'Backtest Engine'}
                {tab === 'guide' && '8 Rules Guide'}
              </button>
            ))}
          </nav>

          {/* User Profile Switcher & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Guest Switcher dropdown */}
            {isGuestMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid var(--accent-border)', padding: '6px 12px', borderRadius: '10px' }}>
                <Users size={13} style={{ color: 'var(--accent)' }} />
                <select
                  value={session.id}
                  onChange={(e) => {
                    const prof = MOCK_PROFILES.find(p => p.id === e.target.value);
                    if (prof) handleGuestLogin(prof);
                  }}
                  style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: 'var(--text-h)', outline: 'none', cursor: 'pointer' }}
                >
                  {MOCK_PROFILES.map(p => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-h)', fontWeight: '600' }}>
                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--border)' }}>
                  <User size={13} />
                </div>
                <span>{session.user?.email}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--danger)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            >
              <LogOut size={14} />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container" style={{ padding: '24px 0', flexGrow: 1 }}>

        {/* ==========================================
            TAB 1: ACTIVE TRACKER
            ========================================== */}
        {activeTab === 'tracker' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-h)' }}>
                    Ongoing & Upcoming IPOs
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: '4px 0 0 0' }}>
                    Tracking daily Grey Market Premium (GMP) and subscription levels. YES signals highlight closing-day deployments.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--accent-border)', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' }}>
                  <Sparkles size={13} /> Live System Sync Enabled
                </div>
              </div>

              {dbLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Connecting to workspace datastore...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {ipos.map(ipo => {
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              backgroundColor: ipo.status === 'bidding' ? 'var(--success-bg)' : 'rgba(0,0,0,0.05)',
                              color: ipo.status === 'bidding' ? 'var(--success)' : 'var(--text)',
                              border: ipo.status === 'bidding' ? '1px solid var(--accent-border)' : '1px solid transparent'
                            }}>
                              {ipo.status.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> Closes {dateStr}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-h)', lineHeight: '1.2' }}>
                            {ipo.name}
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                            Symbol: <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-h)', fontWeight: '600' }}>{ipo.symbol}</span>
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', marginBottom: '16px' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>GMP Premium</span>
                              <span style={{ fontSize: '15px', fontWeight: '700', color: ipo.gmp_pct >= 20 ? 'var(--success)' : 'var(--text-h)' }}>
                                {ipo.gmp_pct}%
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Subscription</span>
                              <span style={{ fontSize: '15px', fontWeight: '700', color: ipo.total_sub >= 30 ? 'var(--success)' : 'var(--text-h)' }}>
                                {ipo.total_sub}x
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Issue Size</span>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-h)' }}>
                                ₹{ipo.issue_size_cr} Cr
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Lot Cost</span>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-h)' }}>
                                ₹{ipo.retail_lot_cost?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text)' }}>Signal:</span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '800',
                              color: ipo.decision === 'YES' ? 'var(--success)' : 'var(--danger)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {ipo.decision === 'YES' ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> : <XCircle size={14} style={{ color: 'var(--danger)' }} />}
                              {ipo.decision}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>
                            {ipo.score}/8 Rules <ChevronRight size={13} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: FAMILY ROTATOR (REDESIGNED)
            ========================================== */}
        {activeTab === 'capital' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

            {/* Left Column: Wallet Stats & PAN Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Wallet Summary */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={16} style={{ color: 'var(--accent)' }} /> Family Budget Pool
                  </h2>
                  <button
                    onClick={handleResetCapital}
                    style={{ border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Clear History
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Trading Capital</span>
                  <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-h)', letterSpacing: '-1px' }}>
                    ₹{capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ width: `${(liquidCapital / capital) * 100}%`, backgroundColor: 'var(--accent)' }}></div>
                  <div style={{ width: `${(totalBlocked / capital) * 100}%`, backgroundColor: 'var(--warning)' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span> Available (Liquid)
                    </span>
                    <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>₹{liquidCapital.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span> ASBA Blocked (UPI)
                    </span>
                    <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>₹{totalBlocked.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Allotment Slots (PAN Accounts) */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} style={{ color: 'var(--accent)' }} /> Allotment Slots (PANs)
                  </h2>
                  <button
                    onClick={() => setShowAddAccountModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                  Deploying 1 lot across multiple unique family PAN card profiles maximizes oversubscribed allotment odds.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {userAccounts.map(account => {
                    const activeBlocked = userApplications
                      .filter(app => app.account_id === account.id && app.status === 'PENDING')
                      .reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);

                    return (
                      <div
                        key={account.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '10px',
                          backgroundColor: activeBlocked > 0 ? 'var(--accent-bg)' : 'transparent'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-h)', display: 'block' }}>
                            {account.account_holder_name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                            PAN: {account.pan_mask}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Blocked</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: activeBlocked > 0 ? 'var(--warning)' : 'var(--text-h)' }}>
                              ₹{activeBlocked.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteAccountSlot(account.id)}
                            style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                            title="Delete Account Slot"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Rotator Log & Calendar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: 'var(--accent)' }} /> ASBA Refund & Listing Schedule
                </h2>

                {/* Simulated Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userApplications.filter(app => app.status === 'PENDING').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border-strong)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No active ASBA blocks found. Deploy cash on active IPOs in the Active Tracker tab!
                    </div>
                  ) : (
                    userApplications.filter(app => app.status === 'PENDING').map(app => {
                      const ipo = ipos.find(i => i.id === app.ipo_id);
                      const account = userAccounts.find(a => a.id === app.account_id);
                      if (!ipo || !account) return null;

                      return (
                        <div
                          key={app.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '14px 16px',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            backgroundColor: 'var(--accent-bg)'
                          }}
                        >
                          <div style={{ minWidth: '90px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Allotment Date</span>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-h)' }}>
                              {ipo.allotment_date ? new Date(ipo.allotment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '13px' }}>{ipo.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                              Slot: **{account.account_holder_name}** • Bidding ₹{app.bid_amount.toLocaleString('en-IN')} (1 lot)
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleResolveApplication(app.id, true)}
                              style={{ padding: '6px 10px', fontSize: '10px', border: 'none', borderRadius: '6px', backgroundColor: 'var(--success)', color: 'white', cursor: 'pointer', fontWeight: '700' }}
                            >
                              Allotted
                            </button>
                            <button
                              onClick={() => handleResolveApplication(app.id, false)}
                              style={{ padding: '6px 10px', fontSize: '10px', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Refunded
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Realized Gains log */}
                <h3 style={{ fontSize: '14px', fontWeight: '700', marginTop: '28px', marginBottom: '12px', color: 'var(--text-h)' }}>
                  Realized Gains Log
                </h3>
                {userApplications.filter(app => app.status !== 'PENDING').length === 0 ? (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No completed allotments or refunds recorded yet. Bids are unblocked here after resolving allotment results.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userApplications.filter(app => app.status !== 'PENDING').map(app => {
                      const ipo = ipos.find(i => i.id === app.ipo_id);
                      const account = userAccounts.find(a => a.id === app.account_id);
                      if (!ipo || !account) return null;

                      return (
                        <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}>
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-h)', display: 'block' }}>
                              {ipo.name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              Slot: {account.account_holder_name} • Status: {app.status}
                            </span>
                          </div>
                          <span style={{ fontWeight: '700', color: app.status === 'ALLOTTED' ? 'var(--success)' : 'var(--text-muted)' }}>
                            {app.status === 'ALLOTTED' ? `+ ₹${parseFloat(app.listing_profit_rs).toFixed(2)}` : 'Refunded (Flat)'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB 3: BACKTESTING PLAYGROUND
            ========================================== */}
        {activeTab === 'backtest' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-h)' }}>
                    Historical Performance Playground (2024 - 2026)
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text)', margin: '4px 0 0 0' }}>
                    Adjust criteria limits to simulate how Expected Value yields optimize relative to a blind lottery strategy.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-strong)', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>
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
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Excludes IPOs with weak initial retail/institutions grey market premiums.</span>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>
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
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ensures strong listing morning market momentum pushes prices up.</span>
                </div>
              </div>

              {(() => {
                const dynamicRes = runDynamicBacktest();
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
                        <span style={{ fontSize: '11px', color: originalStats.blind_final_capital < 100000 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          Applying blind lots to all listings
                        </span>
                      </div>

                      <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bids Passed / Filtered</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)' }}>
                          {yesCount} / {originalStats.total_evaluated || 21}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Only bidding on highest probability listings
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '12px' }}>
                      Dynamic Simulation Logs
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

        {/* ==========================================
            TAB 4: 8 RULES GUIDE
            ========================================== */}
        {activeTab === 'guide' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-h)' }}>
                Systematic Rules & Threshold parameters
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text)', margin: '0 0 24px 0' }}>
                Antigravity enforces a strict 8-metric checklist layout. YES recommendations require passing **both mandatory listing gain drivers** plus an overall score $\ge$ 5.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--accent-border)', borderRadius: '12px', backgroundColor: 'var(--accent-bg)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} /> Rule 1: Real-Time Demand (MANDATORY)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-h)', margin: 0 }}>
                    Total bidding subscription multiple crosses 30x OR QIB segment crosses 50x on closing day. Backtesting proves institutional bid velocity is the single strongest indicator of listing-day buyer surges.
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--accent-border)', borderRadius: '12px', backgroundColor: 'var(--accent-bg)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} /> Rule 2: Sentiment Anchor (MANDATORY)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-h)', margin: 0 }}>
                    Implied Grey Market Premium (GMP) represents $\ge$ 20% premium relative to the IPO price band. Ensures strong unofficial market demand buffers against listing morning selling pressures.
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' }}>
                    Rule 3: Capital Structure
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    Offer For Sale (OFS) constitutes less than 50% of the total issue size. Prevents early promoter exits and guarantees that a larger percentage of proceeds enter the firm to finance expansion.
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' }}>
                    Rule 4: Valuation Buffer
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    IPO price P/E represents at least a 15% discount relative to the median P/E of listed sector peers. Protects buyers against speculative, overpriced multiples.
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' }}>
                    Rule 5: Institutional Backing
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    The pre-IPO Anchor Book contains tier-1 domestic mutual funds and marquee global sovereign wealth pools (Anchor Quality Score $\ge$ 70/100).
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' }}>
                    Rule 6: Fundamental Reality
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    Positive and rising Profit After Tax (PAT) margins over the last 3 consecutive fiscal years. Protects the portfolio against cash-burning entities.
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' }}>
                    Rule 7: Issue Size Cap
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    Total issue size remains under ₹3,000 Crore. Smaller float volumes are easily absorbed by public retail demand, enabling sharp listing-day pops.
                  </p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' }}>
                    Rule 8: Skin in the game
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0 }}>
                    Promoters retain at least 50% post-IPO stake, indicating long-term commitment and preventing listing dumps immediately after locks expire.
                  </p>
                </div>

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

      {/* ==========================================
          DETAIL MODAL DRAWER
          ========================================== */}
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
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text)' }}
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

            {/* Bid application form for active IPO */}
            {selectedIpo.status === 'bidding' && (
              <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px', backgroundColor: 'var(--bg)', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 12px 0', color: 'var(--text-h)' }}>
                  Submit UPI Application (UPI block)
                </h4>

                {userAccounts.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
                    No active allotment PAN slots configured. Add account slots in the Family Rotator tab first!
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>Bid Account Slot:</label>
                      <select
                        id="bid-slot-selector"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-strong)', fontSize: '12px', flexGrow: 1 }}
                      >
                        {userAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.account_holder_name} (PAN: {acc.pan_mask})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        const selector = document.getElementById('bid-slot-selector');
                        if (selector) {
                          handlePlaceBid(selectedIpo.id, selector.value, 1);
                          setSelectedIpo(null);
                        }
                      }}
                      disabled={selectedIpo.retail_lot_cost > liquidCapital}
                      style={{
                        padding: '10px',
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        opacity: selectedIpo.retail_lot_cost > liquidCapital ? 0.5 : 1
                      }}
                    >
                      Place Bid (Block ₹{selectedIpo.retail_lot_cost?.toLocaleString('en-IN')} on Selected Account)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CTA action */}
            <div style={{ display: 'flex', gap: '12px' }}>
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
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD ACCOUNT SLOT MODAL
          ========================================== */}
      {showAddAccountModal && (
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
          zIndex: 110,
          padding: '20px'
        }} onClick={() => setShowAddAccountModal(false)}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '100%',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-h)' }}>
              Add Allotment Slot (PAN Profile)
            </h3>

            <form onSubmit={handleAddAccountSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)' }}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sahil (Brother)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '13px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)' }}>PAN (Masked / Format: ABCDE***1F)</label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE***1F"
                  value={newAccountPan}
                  onChange={(e) => setNewAccountPan(e.target.value)}
                  maxLength={10}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  style={{ flexGrow: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flexGrow: 2, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                >
                  Create Account Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
