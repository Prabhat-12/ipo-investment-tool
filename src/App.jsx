import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Users,
  BookOpen,
  User,
  LogOut,
  MoreHorizontal
} from 'lucide-react';

// Import JSON data compiled by Python engine
import dbLocal from './data/db_local.json';
import { supabase } from './supabaseClient';
import { DivergenLogo } from './components/ui/DivergenLogo';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import GuidePage from './pages/GuidePage';
import BacktestPage from './pages/BacktestPage';
import SettingsPage from './pages/SettingsPage';
import CapitalRotatorPage from './pages/CapitalRotatorPage';
import DashboardPage from './pages/DashboardPage';
import IpoDetailDrawer from './components/dashboard/IpoDetailDrawer';



function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Guest name state is held in component — no MOCK_PROFILES needed

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard
  const [selectedIpo, setSelectedIpo] = useState(null);
  const [selectedBidAccounts, setSelectedBidAccounts] = useState([]); // Selected family account IDs for bidding
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('ipo_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('ipo_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    setSelectedBidAccounts([]);
  }, [selectedIpo]);

  const [userProfile, setUserProfile] = useState(null);

  // Investment Group Sharing states
  const [familyGroup, setFamilyGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);

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

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Keyboard Accessibility: Escape key closes drawers and mobile sheets
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedIpo) {
          setSelectedIpo(null);
        } else if (showMoreSheet) {
          setShowMoreSheet(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIpo, showMoreSheet]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);
    const handler = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Active IPOs State
  const [ipos, setIpos] = useState([]);
  const [lastRefreshedDate, setLastRefreshedDate] = useState(() => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' });
  });

  const handleForceRefresh = async () => {
    setDbLoading(true);
    try {
      await loadData();
      setLastRefreshedDate(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' }));
    } catch (err) {
      console.error(err);
    } finally {
      setDbLoading(false);
    }
  };

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
  const loadData = async () => {
    setDbLoading(true);

    // 1. Fetch Global Market Data (IPOs, Subs, GMP)
    let activeIposList = [];
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine !== false) {
      try {
        const { data: cloudIpos, error: ipoError } = await supabase.from('ipos').select('*');
        if (!ipoError && cloudIpos && cloudIpos.length > 0) {
          const { data: cloudSubs } = await supabase.from('subscriptions').select('*');
          const { data: cloudGmps } = await supabase.from('gmp_history').select('*');
          const { data: cloudPeers } = await supabase.from('peers').select('*');
          const { data: cloudFins } = await supabase.from('financials').select('*');
          const { data: cloudAnchors } = await supabase.from('anchor_investors').select('*');

          activeIposList = cloudIpos.map(ipo => {
            const subs = (cloudSubs?.filter(s => s.ipo_id === ipo.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date));
            const gmpRecs = (cloudGmps?.filter(g => g.ipo_id === ipo.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date));
            const peers = cloudPeers?.filter(p => p.ipo_id === ipo.id) || [];
            const financials = cloudFins?.filter(f => f.ipo_id === ipo.id) || [];
            const anchors = cloudAnchors?.filter(a => a.ipo_id === ipo.id) || [];

            const total_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].total) : 0.0;
            const qib_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].qib) : 0.0;
            const retail_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].retail) : 0.0;
            const gmp_pct = gmpRecs.length > 0 ? parseFloat(gmpRecs[gmpRecs.length - 1].implied_gain_pct) : 0.0;

            const pe_ratio = (ipo.pe_ratio && ipo.pe_ratio > 0) 
              ? parseFloat(ipo.pe_ratio) 
              : (peers.length > 0 && peers[0].ipo_pe ? parseFloat(peers[0].ipo_pe) : (ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0));
            
            let peers_median_pe = 35.0;
            if (peers.length > 0) {
              const validPeers = peers.map(p => parseFloat(p.peer_pe)).filter(p => !isNaN(p) && p > 0).sort((a,b) => a - b);
              if (validPeers.length > 0) {
                const mid = Math.floor(validPeers.length / 2);
                peers_median_pe = validPeers.length % 2 !== 0 ? validPeers[mid] : (validPeers[mid - 1] + validPeers[mid]) / 2.0;
              }
            }

            // Dynamically adjust status based on date (defense-in-depth UI logic)
            let currentStatus = ipo.status;
            const todayStr = new Date().toLocaleDateString('sv-SE');
            if (ipo.open_date && ipo.close_date) {
              if (todayStr >= ipo.open_date && todayStr <= ipo.close_date) {
                currentStatus = 'bidding';
              } else if (todayStr > ipo.close_date) {
                currentStatus = 'closed';
                if (ipo.listing_date && todayStr >= ipo.listing_date) {
                  currentStatus = 'listed';
                }
              } else if (todayStr < ipo.open_date) {
                currentStatus = 'upcoming';
              }
            }

            const details = {
              ...ipo,
              status: currentStatus,
              total_sub,
              qib_sub,
              retail_sub,
              gmp_pct,
              pe_ratio,
              peers_median_pe,
              financials: financials.sort((a,b) => a.fiscal_year.localeCompare(b.fiscal_year)),
              peers,
              anchors,
              gmp_history: gmpRecs.sort((a,b) => new Date(a.date) - new Date(b.date)),
              subscription_history: subs.sort((a,b) => new Date(a.date) - new Date(b.date))
            };

            const evalRes = evaluateIpoClient(details);
            return {
              ...details,
              score: evalRes.score,
              decision: evalRes.decision,
              reason: evalRes.reason,
              mandatoryFailed: evalRes.mandatoryFailed,
              mandatoryPending: evalRes.mandatoryPending,
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
        const subs = (dbLocal.subscriptions.filter(s => s.ipo_id === ipo.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date));
        const gmpRecs = (dbLocal.gmp_history.filter(g => g.ipo_id === ipo.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date));
        const peers = dbLocal.peers.filter(p => p.ipo_id === ipo.id) || [];
        const financials = dbLocal.financials.filter(f => f.ipo_id === ipo.id) || [];
        const anchors = dbLocal.anchor_investors.filter(a => a.ipo_id === ipo.id) || [];

        const total_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].total) : 0.0;
        const qib_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].qib) : 0.0;
        const retail_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].retail) : 0.0;
        const gmp_pct = gmpRecs.length > 0 ? parseFloat(gmpRecs[gmpRecs.length - 1].implied_gain_pct) : 0.0;

        const pe_ratio = (ipo.pe_ratio && ipo.pe_ratio > 0) 
          ? parseFloat(ipo.pe_ratio) 
          : (peers.length > 0 && peers[0].ipo_pe ? parseFloat(peers[0].ipo_pe) : (ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0));
        
        let peers_median_pe = 35.0;
        if (peers.length > 0) {
          const validPeers = peers.map(p => parseFloat(p.peer_pe)).filter(p => !isNaN(p) && p > 0).sort((a,b) => a - b);
          if (validPeers.length > 0) {
            const mid = Math.floor(validPeers.length / 2);
            peers_median_pe = validPeers.length % 2 !== 0 ? validPeers[mid] : (validPeers[mid - 1] + validPeers[mid]) / 2.0;
          }
        }

        // Dynamically adjust status based on date (defense-in-depth UI logic)
        let currentStatus = ipo.status;
        const todayStr = new Date().toLocaleDateString('sv-SE');
        if (ipo.open_date && ipo.close_date) {
          if (todayStr >= ipo.open_date && todayStr <= ipo.close_date) {
            currentStatus = 'bidding';
          } else if (todayStr > ipo.close_date) {
            currentStatus = 'closed';
            if (ipo.listing_date && todayStr >= ipo.listing_date) {
              currentStatus = 'listed';
            }
          } else if (todayStr < ipo.open_date) {
            currentStatus = 'upcoming';
          }
        }

        const details = {
          ...ipo,
          status: currentStatus,
          total_sub,
          qib_sub,
          retail_sub,
          gmp_pct,
          pe_ratio,
          peers_median_pe,
          financials: financials.sort((a,b) => a.fiscal_year.localeCompare(b.fiscal_year)),
          peers,
          anchors,
          gmp_history: gmpRecs.sort((a,b) => new Date(a.date) - new Date(b.date)),
          subscription_history: subs.sort((a,b) => new Date(a.date) - new Date(b.date))
        };

        const evalRes = evaluateIpoClient(details);
        return {
          ...details,
          score: evalRes.score,
          decision: evalRes.decision,
          reason: evalRes.reason,
          mandatoryFailed: evalRes.mandatoryFailed,
          mandatoryPending: evalRes.mandatoryPending,
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
          // Load user profile name
          const { data: profile, error: profError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (!profError && profile) {
            setUserProfile(profile);
          }

          // Load PAN Account slots (shared view via RLS)
          const { data: accounts, error: accError } = await supabase
            .from('user_accounts')
            .select('*');
          if (!accError) setUserAccounts(accounts || []);

          // Load active ASBA bids (shared view via RLS)
          const { data: apps, error: appError } = await supabase
            .from('user_applications')
            .select('*');
          if (!appError) setUserApplications(apps || []);

          // Load Family Group memberships for user
          const { data: memberRecs, error: memError } = await supabase
            .from('family_members')
            .select('*, family_groups(*)')
            .eq('user_id', userId);

          if (!memError && memberRecs && memberRecs.length > 0) {
            const currentGroup = memberRecs[0].family_groups;
            setFamilyGroup(currentGroup);

            // Load all members in this group
            const { data: allMembers, error: allMemError } = await supabase
              .from('family_members')
              .select('*, user_profiles(*)')
              .eq('group_id', currentGroup.id);
            if (!allMemError) setGroupMembers(allMembers || []);
          } else {
            setFamilyGroup(null);
            setGroupMembers([]);
          }
        } catch (e) {
          console.error("Cloud DB fetch error for accounts/apps/groups:", e);
        }
      } else {
        // Offline/Guest Mode: Load from localStorage
        const localAccounts = localStorage.getItem(`ipo_accounts_${userId}`);
        const localApps = localStorage.getItem(`ipo_applications_${userId}`);
        const localCapital = localStorage.getItem(`ipo_capital_${userId}`);

        setUserProfile({
          display_name: session.display_name || 'Guest User',
          email: session.user?.email || 'guest@example.com'
        });

        // Mock group
        setFamilyGroup({
          id: 'mock-group-1',
          group_name: 'Prabhat Family Pool',
          creator_id: 'mock-prabhat'
        });
        setGroupMembers([
          { id: 1, group_id: 'mock-group-1', user_id: 'mock-prabhat', role: 'admin', user_profiles: { display_name: 'Prabhat (Self)', email: 'prabhat@example.com' } },
          { id: 2, group_id: 'mock-group-1', user_id: 'mock-sahil', role: 'member', user_profiles: { display_name: 'Sahil (Brother)', email: 'sahil@example.com' } },
          { id: 3, group_id: 'mock-group-1', user_id: 'mock-father', role: 'member', user_profiles: { display_name: 'Anil (Father)', email: 'anil@example.com' } }
        ]);

        if (localAccounts) {
          setUserAccounts(JSON.parse(localAccounts));
        } else {
          // Seed default PAN accounts for the guest profile
          const defaults = [
            { id: `acc-self-${userId}`, user_id: userId, group_id: 'mock-group-1', account_holder_name: `${session.display_name || 'Self'} (Primary)`, pan_mask: 'ABCDE***1F', status: 'active' },
            { id: `acc-spouse-${userId}`, user_id: userId, group_id: 'mock-group-1', account_holder_name: 'Sahil (Brother)', pan_mask: 'WXYZT***9K', status: 'active' },
            { id: `acc-father-${userId}`, user_id: userId, group_id: 'mock-group-1', account_holder_name: 'Anil (Father)', pan_mask: 'MNOPI***5H', status: 'active' }
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
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isGuestMode]);

  // Client-side rule evaluator
  function evaluateIpoClient(ipo) {
    const rules = {};
    let score = 0;

    // 1. Demand (Gate 1 - MANDATORY)
    const isDemandPending = ipo.status === 'upcoming' && (!ipo.qib_sub || ipo.qib_sub === 0) && (!ipo.total_sub || ipo.total_sub === 0);
    const demandPassed = !isDemandPending && (ipo.total_sub >= subThreshold || ipo.qib_sub >= 50);
    rules.demand = {
      title: 'Real-Time Demand',
      description: 'Total subscription > 30x OR QIB > 50x',
      value: isDemandPending ? 'Not available' : `Total: ${ipo.total_sub || 0}x, QIB: ${ipo.qib_sub || 0}x`,
      passed: demandPassed,
      isMandatory: true,
      isPending: isDemandPending
    };
    if (demandPassed) score += 1;

    // 2. Capital structure
    const ofs_pct = ipo.issue_size_cr > 0 ? (ipo.ofs_cr / ipo.issue_size_cr) * 100 : 0;
    rules.capital = {
      title: 'Capital Structure',
      description: 'OFS component constitutes < 50% of issue size',
      value: `OFS: ${ofs_pct.toFixed(1)}%`,
      passed: ofs_pct < 50.0,
      isMandatory: false
    };
    if (rules.capital.passed) score += 1;

    // 3. Valuation
    const discount_pct = ipo.peers_median_pe > 0 ? ((ipo.peers_median_pe - ipo.pe_ratio) / ipo.peers_median_pe) * 100 : 0;
    rules.valuation = {
      title: 'Valuation Buffer',
      description: 'IPO P/E has a 15%+ discount to listed peers',
      value: ipo.pe_ratio > 0 ? `P/E: ${ipo.pe_ratio.toFixed(1)}x vs Peers Median: ${ipo.peers_median_pe.toFixed(1)}x (${discount_pct.toFixed(1)}% discount)` : 'N/A',
      passed: discount_pct >= 15.0 && ipo.pe_ratio > 0,
      isMandatory: false
    };
    if (rules.valuation.passed) score += 1;

    // 4. Sentiment (Gate 2 - MANDATORY)
    const isGmpPending = ipo.status === 'upcoming' && (ipo.gmp_pct == null || ipo.gmp_pct === 0);
    const sentimentPassed = !isGmpPending && ipo.gmp_pct >= gmpThreshold;
    rules.sentiment = {
      title: 'Sentiment Anchor (GMP)',
      description: 'Implied premium >= 20%',
      value: `GMP Implied Premium: ${ipo.gmp_pct || 0}%`,
      passed: sentimentPassed,
      isMandatory: true,
      isPending: isGmpPending
    };
    if (sentimentPassed) score += 1;

    // 5. Anchors
    const anchorScore = ipo.anchors && ipo.anchors.length > 0 ? 85 : 50;
    rules.anchors = {
      title: 'Institutional Backing',
      description: 'Marquee anchor allocation present (Score >= 70/100)',
      value: `Score: ${anchorScore}/100`,
      passed: anchorScore >= 70,
      isMandatory: false
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
      passed: patPassed,
      isMandatory: false
    };
    if (rules.fundamentals.passed) score += 1;

    // 7. Issue Size
    rules.issue_size = {
      title: 'Issue Size Filter',
      description: 'Total issue size < ₹3,000 Crore to prevent listing stagnation',
      value: `Size: ₹${ipo.issue_size_cr} Cr`,
      passed: ipo.issue_size_cr < 3000.0,
      isMandatory: false
    };
    if (rules.issue_size.passed) score += 1;

    // 8. Promoter Stake
    rules.promoter_stake = {
      title: 'Skin In The Game',
      description: 'Promoter post-IPO stake >= 50%',
      value: `Promoter Stake: ${ipo.post_ipo_promoter_holding_pct}%`,
      passed: ipo.post_ipo_promoter_holding_pct >= 50.0,
      isMandatory: false
    };
    if (rules.promoter_stake.passed) score += 1;

    // Track Mandatory Failures & Pending Counts
    let mandatoryFailed = 0;
    let mandatoryPending = 0;
    if (rules.demand.isPending) mandatoryPending++;
    else if (!rules.demand.passed) mandatoryFailed++;

    if (rules.sentiment.isPending) mandatoryPending++;
    else if (!rules.sentiment.passed) mandatoryFailed++;

    // Primary Recommendation & Reasoning Engine
    let decision = 'NO';
    let reason = '';

    if (mandatoryPending > 0 && ipo.status === 'upcoming') {
      decision = 'WATCH';
      reason = 'Awaiting real-time subscription data';
    } else if (mandatoryFailed === 0 && score >= 5) {
      decision = 'YES';
      reason = 'All mandatory checks passed';
    } else {
      decision = 'NO';
      if (!rules.demand.passed) {
        reason = 'Real-time demand below threshold';
      } else if (!rules.sentiment.passed) {
        reason = 'GMP premium below threshold';
      } else if (!rules.valuation.passed) {
        reason = 'Valuation above peer median';
      } else if (!rules.anchors.passed) {
        reason = 'Weak institutional backing';
      } else {
        reason = `${score}/8 checks passed · criteria not met`;
      }
    }

    const notes = decision === 'YES' 
      ? "Strong Listing Setup. High GMP premium backed by strong subscription velocities."
      : reason;

    return { 
      score, 
      decision, 
      reason, 
      rules, 
      mandatoryFailed, 
      mandatoryPending, 
      notes 
    };
  }

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
      user_id: userId,
      group_id: familyGroup?.id || null
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

  // Group sharing actions
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !supabase || isGuestMode) return;

    const userId = session.user?.id || session.id;
    try {
      const inviteCode = generateInviteCode();
      const { data: groupData, error: groupErr } = await supabase
        .from('family_groups')
        .insert({
          group_name: newGroupName.trim(),
          creator_id: userId,
          invite_code: inviteCode
        })
        .select();

      if (groupErr) throw groupErr;
      const newGroup = groupData[0];

      const { data: memberData, error: memberErr } = await supabase
        .from('family_members')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          role: 'admin'
        })
        .select('*, user_profiles(*)');

      if (memberErr) throw memberErr;

      setFamilyGroup(newGroup);
      setGroupMembers(memberData || []);
      setNewGroupName('');
    } catch (err) {
      alert("Failed to create Investment Group: " + err.message);
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim() || !supabase || isGuestMode) return;

    setJoinLoading(true);
    setJoinError(null);
    try {
      const code = inviteCodeInput.trim().toUpperCase();
      const { data: groups, error: groupErr } = await supabase
        .from('family_groups')
        .select('*')
        .eq('invite_code', code);

      if (groupErr) throw groupErr;
      if (!groups || groups.length === 0) {
        throw new Error("Invalid invitation code. Please check and try again.");
      }

      const group = groups[0];
      const userId = session.user?.id || session.id;

      // Check if already in this group
      const { data: existing, error: existErr } = await supabase
        .from('family_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', userId);

      if (!existErr && existing && existing.length > 0) {
        throw new Error("You are already a member of this investment group.");
      }

      const { data: memberData, error: joinErr } = await supabase
        .from('family_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member'
        })
        .select('*, user_profiles(*)');

      if (joinErr) throw joinErr;

      alert(`Successfully joined Investment Group: ${group.group_name}!`);
      setFamilyGroup(group);
      setGroupMembers(memberData || []);
      setInviteCodeInput('');
      loadData();
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !familyGroup || !supabase || isGuestMode) return;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const { data: profiles, error: profErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', inviteEmail.trim().toLowerCase());

      if (profErr) throw profErr;
      if (!profiles || profiles.length === 0) {
        throw new Error("No registered user found with this email. Make sure they have signed up first.");
      }

      const invitedUser = profiles[0];
      const alreadyMember = groupMembers.some(m => m.user_id === invitedUser.id);
      if (alreadyMember) {
        throw new Error("This user is already a member of your family group.");
      }

      const { data: memberData, error: memberErr } = await supabase
        .from('family_members')
        .insert({
          group_id: familyGroup.id,
          user_id: invitedUser.id,
          role: 'member'
        })
        .select('*, user_profiles(*)');

      if (memberErr) throw memberErr;

      setGroupMembers(prev => [...prev, memberData[0]]);
      setInviteEmail('');
      setInviteSuccess(true);
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!familyGroup || !supabase || isGuestMode) return;
    if (!window.confirm("Are you sure you want to remove this member from the family group?")) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('group_id', familyGroup.id)
        .eq('user_id', memberUserId);

      if (error) throw error;

      setGroupMembers(prev => prev.filter(m => m.user_id !== memberUserId));
    } catch (err) {
      alert("Failed to remove member: " + err.message);
    }
  };

  const handleLeaveGroup = async () => {
    if (!familyGroup || !supabase || isGuestMode) return;
    if (!window.confirm("Are you sure you want to leave this family group? You will lose access to shared accounts and bids.")) return;

    const userId = session.user?.id || session.id;
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('group_id', familyGroup.id)
        .eq('user_id', userId);

      if (error) throw error;

      setFamilyGroup(null);
      setGroupMembers([]);
    } catch (err) {
      alert("Failed to leave group: " + err.message);
    }
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

  const handlePlaceBids = async (ipoId, accountIds, lots) => {
    const ipo = ipos.find(i => i.id === ipoId);
    if (!ipo || accountIds.length === 0) return;

    const totalCost = ipo.retail_lot_cost * lots * accountIds.length;
    if (totalCost > liquidCapital) {
      alert("Insufficient liquid cash in family pool to place these applications!");
      return;
    }

    const userId = session.user?.id || session.id;
    const newApps = accountIds.map(accountId => ({
      user_id: userId,
      account_id: accountId,
      ipo_id: ipoId,
      lots_applied: lots,
      bid_amount: ipo.retail_lot_cost * lots,
      status: 'PENDING',
      listing_profit_rs: 0.00
    }));

    if (supabase && !isGuestMode) {
      const { data, error } = await supabase
        .from('user_applications')
        .insert(newApps)
        .select();
      if (error) {
        alert("Failed to place applications: " + error.message);
      } else {
        setUserApplications(prev => [...prev, ...data]);
      }
    } else {
      const localApps = newApps.map((app, idx) => ({ ...app, id: `app-${Date.now()}-${idx}` }));
      const updated = [...userApplications, ...localApps];
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

  // ==========================================
  // RENDER AUTH SCREEN (IF NOT LOGGED IN)
  // ==========================================
  if (!session) {
    return (
      <LoginPage
        onLoginSuccess={({ session: newSession, isGuestMode: guestMode }) => {
          setIsGuestMode(guestMode);
          setSession(newSession);
        }}
      />
    );
  }

  // ==========================================
  // RENDER LOGGED IN PORTAL VIEW
  // ==========================================
  return (
    <div className="dashboard-container animate-fade-in">

      {/* MOBILE HEADER BAR */}
      <div className="mobile-header">
        <DivergenLogo variant="mobile" />
        <span className="mobile-header-status">
          <Sparkles size={10} />
          {isGuestMode ? 'Offline' : 'Live Sync'}
        </span>
      </div>

      {/* SIDEBAR NAVIGATION PANEL (hidden on mobile via CSS) */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Brand header */}
          <div className="sidebar-brand" style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
            <DivergenLogo 
              variant={isSidebarCollapsed ? 'collapsed' : 'expanded'} 
              subtitle={isGuestMode ? 'Offline Sandbox' : 'Cloud Connected'} 
            />
          </div>

          {/* Navigation vertical list */}
          <nav role="tablist" className="sidebar-menu">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'capital', label: 'Family Rotator', icon: Users },
              { id: 'backtest', label: 'Backtest Engine', icon: TrendingUp },
              { id: 'guide', label: 'Documentation', icon: BookOpen }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={activeTab === item.id}
                  data-tooltip={item.label}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedIpo(null);
                  }}
                  className={`sidebar-link ${activeTab === item.id ? 'sidebar-link-active' : ''}`}
                  style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}
                >
                  <Icon size={18} strokeWidth={1.5} className="icon-optical" />
                  {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile row and Sidebar Expand/Collapse Toggle */}
        <div className="sidebar-footer">
          <button 
            onClick={() => {
              setActiveTab('profile');
              setSelectedIpo(null);
            }}
            data-tooltip={userProfile?.display_name || 'My Profile & Settings'}
            className={`sidebar-profile ${activeTab === 'profile' ? 'sidebar-link-active' : ''}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '8px 0' : '8px 12px' }}
          >
            <div className="img-outline" style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', fontWeight: 'bold', fontSize: '11px', flexShrink: 0 }}>
              {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1, gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1' }}>
                  {userProfile?.display_name || 'My Profile'}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1' }}>
                  {userProfile?.email || 'Settings & sharing'}
                </span>
              </div>
            )}
          </button>

          {/* Expand / Collapse Toggle Button at bottom */}
          <button
            onClick={toggleSidebar}
            data-tooltip={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              width: '100%',
              fontSize: '12px',
              padding: '8px 12px',
              color: '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: '500',
              marginTop: '4px',
              borderTop: '1px solid var(--border)',
              paddingTop: '10px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={16} strokeWidth={1.5} className="icon-optical" />
            ) : (
              <>
                <ChevronLeft size={16} strokeWidth={1.5} className="icon-optical" />
                <span style={{ whiteSpace: 'nowrap' }}>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN VIEW PORTAL CONTENT SECTION */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <ErrorBoundary inline sectionName="Dashboard">
            <DashboardPage
              ipos={ipos}
              userApplications={userApplications}
              userAccounts={userAccounts}
              userProfile={userProfile}
              isMobile={isMobile}
              capital={capital}
              liquidCapital={liquidCapital}
              lastRefreshedDate={lastRefreshedDate}
              dbLoading={dbLoading}
              onForceRefresh={handleForceRefresh}
              onSelectIpo={setSelectedIpo}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'capital' && (
          <ErrorBoundary inline sectionName="Capital Rotator">
            <CapitalRotatorPage
              isMobile={isMobile}
              familyGroup={familyGroup}
              groupMembers={groupMembers}
              userAccounts={userAccounts}
              userApplications={userApplications}
              capital={capital}
              liquidCapital={liquidCapital}
              ipos={ipos}
              showAddAccountModal={showAddAccountModal}
              setShowAddAccountModal={setShowAddAccountModal}
              newAccountName={newAccountName}
              setNewAccountName={setNewAccountName}
              newAccountPan={newAccountPan}
              setNewAccountPan={setNewAccountPan}
              onAddAccountSlot={handleAddAccountSlot}
              onResolveApplication={handleResolveApplication}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'backtest' && (
          <ErrorBoundary inline sectionName="Backtest Engine">
            <BacktestPage onSelectIpo={setSelectedIpo} isMobile={isMobile} />
          </ErrorBoundary>
        )}
        {activeTab === 'guide' && (
          <ErrorBoundary inline sectionName="Documentation">
            <GuidePage />
          </ErrorBoundary>
        )}
        {activeTab === 'profile' && (
          <ErrorBoundary inline sectionName="Settings & Profile">
            <SettingsPage
              userProfile={userProfile}
              session={session}
              isGuestMode={isGuestMode}
              familyGroup={familyGroup}
              userAccounts={userAccounts}
              groupMembers={groupMembers}
              onLogout={handleLogout}
              onNavigateTab={setActiveTab}
              onProfileUpdated={(updated) => setUserProfile(prev => ({ ...prev, ...updated }))}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="mobile-tab-bar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Layers },
          { id: 'capital', label: 'Rotator', icon: Users },
          { id: 'backtest', label: 'Backtest', icon: TrendingUp },
          { id: 'more', label: 'More', icon: MoreHorizontal }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = tab.id === 'more'
            ? (activeTab === 'guide' || activeTab === 'profile' || showMoreSheet)
            : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (tab.id === 'more') {
                  setShowMoreSheet(true);
                } else {
                  setActiveTab(tab.id);
                  setSelectedIpo(null);
                  setShowMoreSheet(false);
                }
              }}
            >
              <TabIcon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MOBILE MORE SHEET */}
      {showMoreSheet && (
        <div className="mobile-more-sheet-backdrop" onClick={() => setShowMoreSheet(false)}>
          <div className="mobile-more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-handle" />
            <button
              className="mobile-more-item"
              onClick={() => { setActiveTab('guide'); setShowMoreSheet(false); setSelectedIpo(null); }}
            >
              <BookOpen size={20} />
              Documentation
            </button>
            <button
              className="mobile-more-item"
              onClick={() => { setActiveTab('profile'); setShowMoreSheet(false); setSelectedIpo(null); }}
            >
              <User size={20} />
              {userProfile?.display_name || 'My Profile'}
            </button>
            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            <button className="mobile-more-item danger" onClick={handleLogout}>
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* DETAIL SIDE PANEL DRAWER */}
      <IpoDetailDrawer
        selectedIpo={selectedIpo}
        onClose={() => setSelectedIpo(null)}
        isMobile={isMobile}
        userAccounts={userAccounts}
        userApplications={userApplications}
        liquidCapital={liquidCapital}
        selectedBidAccounts={selectedBidAccounts}
        setSelectedBidAccounts={setSelectedBidAccounts}
        onPlaceBids={handlePlaceBids}
      />
    </div>
  );
}
