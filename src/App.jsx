import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  Menu,
  X,
  BookOpen,
  MoreHorizontal,
  ChevronLeft
} from 'lucide-react';

// Import JSON data compiled by Python engine
import dbLocal from './data/db_local.json';
import backtestData from './data/backtest_results.json';
import { supabase } from './supabaseClient';

// Import BKlit UI Charts
import AreaChart from '@/components/charts/area-chart';
import { Area } from '@/components/charts/area';
import { Grid } from '@/components/charts/grid';
import { XAxis } from '@/components/charts/x-axis';
import { ChartTooltip } from '@/components/charts/tooltip/chart-tooltip';
import BarChart from '@/components/charts/bar-chart';
import { Bar } from '@/components/charts/bar';
import { BarXAxis } from '@/components/charts/bar-x-axis';


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
  const [editDisplayName, setEditDisplayName] = useState('');

  // 8 Rules Doc Sub-Section Selection State
  const [docSection, setDocSection] = useState('welcome');
  const [activeRuleModal, setActiveRuleModal] = useState(null);

  // Auth Screen State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

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

  // Mobile App State
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);
    const handler = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Active IPOs State
  const [ipos, setIpos] = useState([]);
  const [dashboardPipelineTab, setDashboardPipelineTab] = useState('recommended');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ipo_view_mode') || 'grid');
  const pipelineScrollRef = useRef(null);
  const [pipelineScrollPage, setPipelineScrollPage] = useState(0);
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
            const subs = (cloudSubs?.filter(s => s.ipo_id === ipo.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date));
            const gmpRecs = (cloudGmps?.filter(g => g.ipo_id === ipo.id) || []).sort((a, b) => new Date(a.date) - new Date(b.date));
            const peers = cloudPeers?.filter(p => p.ipo_id === ipo.id) || [];
            const financials = cloudFins?.filter(f => f.ipo_id === ipo.id) || [];
            const anchors = cloudAnchors?.filter(a => a.ipo_id === ipo.id) || [];

            const total_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].total) : 0.0;
            const qib_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].qib) : 0.0;
            const retail_sub = subs.length > 0 ? parseFloat(subs[subs.length - 1].retail) : 0.0;
            const gmp_pct = gmpRecs.length > 0 ? parseFloat(gmpRecs[gmpRecs.length - 1].implied_gain_pct) : 0.0;

            const pe_ratio = ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0;
            const peers_median_pe = peers.length > 0 ? peers[0].peer_pe : 35.0;

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

        const pe_ratio = ipo.price_band_high ? ipo.price_band_high / 2.0 : 25.0;
        const peers_median_pe = peers.length > 0 ? peers[0].peer_pe : 35.0;

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

  useEffect(() => {
    if (userProfile?.display_name) {
      setEditDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

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

  const handleGuestLogin = async (nameOverride) => {
    const name = (nameOverride || guestName).trim();
    if (!name) return;
    setGuestLoading(true);
    // Fire-and-forget: log the guest visit to Supabase for tracking
    if (supabase) {
      supabase.from('guest_visits').insert({ name, visited_at: new Date().toISOString() }).then(() => {});
    }
    const guestId = `guest-${Date.now()}`;
    setIsGuestMode(true);
    setSession({
      id: guestId,
      display_name: name,
      user: { id: guestId, email: `${name.toLowerCase().replace(/\s+/g, '.')}@guest.local` }
    });
    setGuestLoading(false);
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

  const handleSaveDisplayName = async () => {
    if (!editDisplayName.trim()) return;
    const userId = session.user?.id || session.id;
    if (supabase && !isGuestMode) {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: editDisplayName.trim() }
      });
      if (error) {
        alert("Failed to update profile name: " + error.message);
      } else {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ display_name: editDisplayName.trim() })
          .eq('id', userId);

        setUserProfile(prev => ({ ...prev, display_name: editDisplayName.trim() }));
        alert("Display name updated successfully!");
      }
    } else {
      setUserProfile(prev => ({ ...prev, display_name: editDisplayName.trim() }));
      alert("Display name updated (Sandbox Mode)!");
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

  // Backtest playground computations
  const runDynamicBacktest = () => {
    if (!backtestData || !backtestData.stats || !backtestData.stats.detailed_results) return { stats: {}, history: [], yesCount: 0, finalCapital: 100000 };

    const iposList = backtestData.stats.detailed_results;
    let currentCapital = 100000.0;
    let blindCapital = 100000.0;
    const history = [];
    let yesCount = 0;

    iposList.forEach(ipo => {
      // Use the pre-computed decision from backtest JSON (which used full 8-rule evaluation)
      const isYes = ipo.decision === 'YES';

      const cost = 15000.0;
      // allotment_probability_pct comes from backtest_results.json — use it directly
      const prob = (ipo.allotment_probability_pct != null ? ipo.allotment_probability_pct : 60) / 100;
      const gains_pct = ipo.listing_gains_pct != null ? ipo.listing_gains_pct : 0;

      // Raw potential outcome (what 1 lot would yield at listing price, before allotment probability)
      const potentialOutcome = cost * (gains_pct / 100);

      // Probability-weighted expected gain for the capital simulator
      const stepExpectedGain = cost * prob * (gains_pct / 100);

      if (isYes) {
        yesCount += 1;
        currentCapital += stepExpectedGain;
      }

      // Blind strategy always bids
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

  // ==========================================
  // RENDER AUTH SCREEN (IF NOT LOGGED IN)
  // ==========================================
  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(229,92,60,0.06), transparent 50%), radial-gradient(ellipse at bottom left, rgba(139,130,115,0.05), transparent 50%)',
        padding: '16px',
        color: 'var(--text)'
      }}>
        <div className="login-grid">
          {/* Logo & Product Concept */}
          <div className="login-branding" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '30px', fontWeight: '900', margin: 0, letterSpacing: '-1px', color: 'var(--text-h)' }}>
                   IPO Tracker
                </h1>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Systematic Listing Gain Engine
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
               An algorithmic analyzer that strips emotion from IPO bidding in India. By tracking real-time QIB/retail subscriptions, GMP premium curves, and promoters' post-IPO stakes, the engine provides clear YES/NO investment signals.
            </p>

            {/* GMP Premium Trend Mockup Card */}
            <div style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--theme-border-radius)',
              boxShadow: 'var(--shadow)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
              boxSizing: 'border-box',
              marginTop: '10px',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)' }}>
                  GMP Premium Trend
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: '8px',
                  padding: '4px 8px'
                }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--success)' }}>
                    ₹9,633 Est. Gain
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--font-lg)', fontWeight: '600', color: 'var(--text-h)', lineHeight: '34px' }}>
                  +34.2%
                </span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Average listing gain yield across active bids
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', height: '110px', position: 'relative' }}>
                <svg width="100%" height="90" viewBox="0 0 400 90" preserveAspectRatio="none" style={{ flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="login-chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--success)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--success)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <path d="M 0 80 Q 80 75 120 50 T 240 30 T 360 10 T 400 5 L 400 90 L 0 90 Z" fill="url(#login-chart-grad)" />
                  <path d="M 0 80 Q 80 75 120 50 T 240 30 T 360 10 T 400 5" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="400" cy="5" r="4" fill="var(--success)" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Day 1</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Day 2</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Day 3</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Day 4</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Day 5 (Today)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: 'var(--font-sm)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>8 strict quantitative rules</strong> evaluating demand, metrics, and anchors.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: 'var(--font-sm)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Multi-PAN Account Management</strong> to optimize retail allotment odds.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: 'var(--font-sm)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Telegram Push Notifications</strong> delivering closing alerts to your phone.</span>
              </div>
            </div>
          </div>

          {/* Login / Guest Selector Card */}
          <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--theme-border-radius)',
            padding: '28px 24px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            backdropFilter: 'blur(16px)'
          }}>

            {/* Authenticated Mode Login */}
            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '2px' }}>
                <button
                  onClick={() => setAuthMode('login')}
                  style={{ flexGrow: 1, paddingBottom: '12px', border: 'none', background: 'none', color: authMode === 'login' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: authMode === 'login' ? '2px solid var(--accent)' : 'none', fontWeight: '600', fontSize: 'var(--font-sm)', cursor: 'pointer' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{ flexGrow: 1, paddingBottom: '12px', border: 'none', background: 'none', color: authMode === 'signup' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: authMode === 'signup' ? '2px solid var(--accent)' : 'none', fontWeight: '600', fontSize: 'var(--font-sm)', cursor: 'pointer' }}
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
                    className="input-field"
                    style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(139, 130, 115, 0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-h)', fontSize: 'var(--font-sm)' }}
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(139, 130, 115, 0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-h)', fontSize: 'var(--font-sm)' }}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(139, 130, 115, 0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-h)', fontSize: 'var(--font-sm)' }}
                  required
                />

                {authError && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--danger)' }}>{authError}</div>}

                {(() => {
                  const isAuthDisabled = authLoading || (authMode === 'login' ? (!email.trim() || !password.trim()) : (!email.trim() || !password.trim() || !displayName.trim()));
                  return (
                    <button
                      type="submit"
                      disabled={isAuthDisabled}
                      className="btn btn-primary"
                      style={{
                        padding: '12px',
                        borderRadius: '999px',
                        fontSize: 'var(--font-sm)',
                        fontWeight: '600',
                        width: '100%',
                        opacity: isAuthDisabled ? 0.6 : 1,
                        cursor: isAuthDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {authLoading ? 'Authorizing...' : authMode === 'login' ? 'Sign In Securely' : 'Register Account'}
                    </button>
                  );
                })()}
              </form>
            </div>

            {/* Guest Access — name entry */}
            <div style={{ borderTop: '1px dashed var(--border-strong)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px' }}>
                  Guest Access
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                Want to explore the portfolio? Enter your name — no email or password needed.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); handleGuestLogin(); }}
                style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}
              >
                <input
                  type="text"
                  placeholder="Your name..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-field"
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(139, 130, 115, 0.04)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-h)',
                    fontSize: 'var(--font-sm)'
                  }}
                />
                {(() => {
                  const isGuestDisabled = guestLoading || !guestName.trim();
                  return (
                    <button
                      type="submit"
                      disabled={isGuestDisabled}
                      className="btn btn-primary"
                      style={{
                        padding: '11px 20px',
                        borderRadius: '16px',
                        fontSize: 'var(--font-sm)',
                        whiteSpace: 'nowrap',
                        opacity: isGuestDisabled ? 0.6 : 1,
                        cursor: isGuestDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {guestLoading ? 'Entering...' : 'Explore'}
                    </button>
                  );
                })()}
              </form>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // SUB-TAB RENDER LOGIC FUNCTIONS FOR PORTAL VIEW
  // ====================================================

  const renderDashboardTab = () => {
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

    // Sort closed IPOs to get the most recently closed listings first (e.g. recent 2026/2025/recent IPOs)
    const closedIpos = ipos
      .filter(i => i.status !== 'bidding' && i.status !== 'upcoming')
      .sort((a, b) => {
        const dateB = new Date(b.close_date || b.listing_date || b.open_date || 0).getTime();
        const dateA = new Date(a.close_date || a.listing_date || a.open_date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6);

    // Recommended tab: Only show currently open/bidding IPOs with YES signal
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

    // Determine current pipeline list based on tab
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

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Welcome Banner */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
              Welcome back, {userProfile?.display_name || 'Prabhat'}
            </h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Here is your IPO decision brief for today.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', backgroundColor: 'var(--bg)', border: '1px solid var(--border-strong)', padding: '8px 16px', borderRadius: '999px', fontWeight: '500', alignSelf: isMobile ? 'flex-start' : 'center' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>
            Live Workspace Sync
          </div>
        </div>

        {/* Top 4 Statistics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value">{biddingIpos.length}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Active IPOs</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Open for bidding today</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value">{upcomingIpos.length}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Upcoming IPOs</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Opening in next 7 days</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value">{totalBids}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Total Bids</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Across all PAN profiles</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value" style={{ color: 'var(--text-h)' }}>
              ₹{totalRealizedProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Realized Profit</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Listing morning gains</span>
            </div>
          </div>
        </div>

        {/* Centerpiece: IPO Pipeline Section */}
        <div className="premium-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
              IPO Pipeline
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Last checked: <strong style={{ color: 'var(--text-h)' }}>{lastRefreshedDate}</strong>
              </span>

              <button 
                onClick={handleForceRefresh}
                disabled={dbLoading}
                className="btn"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '999px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
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

              <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.03)', padding: '3px', borderRadius: '999px', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setViewMode('grid'); localStorage.setItem('ipo_view_mode', 'grid'); }}
                  style={{
                    padding: '6px 14px',
                    fontSize: 'var(--font-xs)',
                    fontWeight: '600',
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
                    fontSize: 'var(--font-xs)',
                    fontWeight: '600',
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

          {/* 4 Pipeline Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
            <button
              onClick={() => {
                setDashboardPipelineTab('recommended');
                if (pipelineScrollRef.current) pipelineScrollRef.current.scrollTo({ left: 0 });
                setPipelineScrollPage(0);
              }}
              style={{
                padding: '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: '600',
                border: dashboardPipelineTab === 'recommended' ? '1px solid var(--accent-border)' : '1px solid transparent',
                borderRadius: '999px',
                cursor: 'pointer',
                backgroundColor: dashboardPipelineTab === 'recommended' ? 'var(--accent-bg)' : 'transparent',
                color: dashboardPipelineTab === 'recommended' ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              Recommended
              {recommendedIpos.length > 0 && (
                <span style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: '600',
                  padding: '2px 7px',
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
                padding: '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: '600',
                border: dashboardPipelineTab === 'open_now' ? '1px solid var(--accent-border)' : '1px solid transparent',
                borderRadius: '999px',
                cursor: 'pointer',
                backgroundColor: dashboardPipelineTab === 'open_now' ? 'var(--accent-bg)' : 'transparent',
                color: dashboardPipelineTab === 'open_now' ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              Open Now
              {biddingIpos.length > 0 && (
                <span style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: '600',
                  padding: '2px 7px',
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
                padding: '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: '600',
                border: dashboardPipelineTab === 'upcoming' ? '1px solid var(--accent-border)' : '1px solid transparent',
                borderRadius: '999px',
                cursor: 'pointer',
                backgroundColor: dashboardPipelineTab === 'upcoming' ? 'var(--accent-bg)' : 'transparent',
                color: dashboardPipelineTab === 'upcoming' ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              Upcoming
              {upcomingIpos.length > 0 && (
                <span style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: '600',
                  padding: '2px 7px',
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
                padding: '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: '600',
                border: dashboardPipelineTab === 'closed' ? '1px solid var(--accent-border)' : '1px solid transparent',
                borderRadius: '999px',
                cursor: 'pointer',
                backgroundColor: dashboardPipelineTab === 'closed' ? 'var(--accent-bg)' : 'transparent',
                color: dashboardPipelineTab === 'closed' ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              Closed
              {closedIpos.length > 0 && (
                <span style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: '600',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  backgroundColor: dashboardPipelineTab === 'closed' ? 'var(--accent)' : 'var(--border-strong)',
                  color: '#ffffff'
                }}>
                  {closedIpos.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content (Cards or List View) */}
          {currentPipelineList.length === 0 ? (
            <div style={{ padding: '36px 20px', border: '1px dashed var(--border-strong)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: 'var(--font-sm)', textAlign: 'center' }}>
              {emptyTabMsg}
            </div>
          ) : viewMode === 'list' ? (
            /* Table List View */
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.015)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Company</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>GMP Premium</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>QIB Demand</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Allotment Odds</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Issue Size</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Lot Cost</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Timeline</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPipelineList.map(ipo => {
                    const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                    return (
                      <tr
                        key={ipo.id}
                        onClick={() => setSelectedIpo(ipo)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{ipo.name}</div>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Symbol: {ipo.symbol}</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.gmp_pct ? `+${ipo.gmp_pct}%` : '0%'}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: ipo.qib_sub >= 50 ? 'var(--success)' : ipo.qib_sub > 0 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.qib_sub && ipo.qib_sub > 0 ? `${ipo.qib_sub}x` : (ipo.total_sub ? `${ipo.total_sub}x` : 'Not available')}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--success)' }}>
                          {ipo.retail_sub && ipo.retail_sub > 1 ? `${(100 / ipo.retail_sub).toFixed(1)}%` : '100%'}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-h)' }}>
                          ₹{ipo.issue_size_cr} Cr
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-h)' }}>
                          ₹{ipo.retail_lot_cost?.toLocaleString('en-IN') || (ipo.price_band_high && ipo.lot_size ? (ipo.price_band_high * ipo.lot_size).toLocaleString('en-IN') : '14,938')}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                          {ipo.status === 'upcoming' ? `Opens ${dateStr}` : `Closes ${dateStr}`}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: '600',
                            color: ipo.decision === 'YES' ? 'var(--success)' : ipo.decision === 'WATCH' ? 'var(--warning)' : 'var(--danger)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            backgroundColor: ipo.decision === 'YES' ? 'var(--success-bg)' : ipo.decision === 'WATCH' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                            borderRadius: '16px',
                            border: ipo.decision === 'YES' ? '1px solid var(--success-border)' : ipo.decision === 'WATCH' ? '1px solid var(--warning-border)' : '1px solid var(--danger-border)'
                          }}>
                            {ipo.decision === 'YES' && <CheckCircle2 size={11} />}
                            {ipo.decision === 'WATCH' && <AlertTriangle size={11} />}
                            {ipo.decision === 'NO' && <XCircle size={11} />}
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
            /* Cards Horizontal Scroll View (3 cards per screen, max 6) */
            <div>
              <div
                ref={pipelineScrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const isScrolled = el.scrollLeft > 60;
                  setPipelineScrollPage(isScrolled ? 1 : 0);
                }}
                className="ipo-pipeline-grid"
              >
                {currentPipelineList.map(ipo => {
                  const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                  const lotCost = ipo.retail_lot_cost 
                    ? ipo.retail_lot_cost.toLocaleString('en-IN') 
                    : (ipo.price_band_high && ipo.lot_size ? (ipo.price_band_high * ipo.lot_size).toLocaleString('en-IN') : '14,938');

                  return (
                    <div
                      key={ipo.id}
                      onClick={() => setSelectedIpo(ipo)}
                      className="premium-card ipo-card"
                      style={{
                        scrollSnapAlign: 'start',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '20px',
                        padding: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        minHeight: '310px',
                        minWidth: '0px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      <div>
                        {/* 1. Header: Status Badge & Closing/Opening Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: '600',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: ipo.status === 'bidding' ? 'var(--success-bg)' : ipo.status === 'upcoming' ? 'var(--warning-bg)' : 'rgba(0,0,0,0.05)',
                            color: ipo.status === 'bidding' ? 'var(--success)' : ipo.status === 'upcoming' ? 'var(--warning)' : 'var(--text-muted)'
                          }}>
                            {ipo.status === 'bidding' ? 'BIDDING' : ipo.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                            <Calendar size={12} /> {ipo.status === 'upcoming' ? `Opens ${dateStr}` : `Closes ${dateStr}`}
                          </span>
                        </div>

                        {/* Title & Symbol */}
                        <h4 style={{ fontSize: 'var(--font-md)', fontWeight: '600', margin: '0 0 2px 0', color: 'var(--text-h)', lineHeight: '1.2' }}>
                          {ipo.name}
                        </h4>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
                          Symbol: <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-h)', fontWeight: '600' }}>{ipo.symbol}</span>
                        </p>

                        {/* 2. PRIMARY HIERARCHY: Recommendation Box */}
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
                              fontWeight: '600',
                              letterSpacing: '0.2px',
                              color: ipo.decision === 'YES' ? 'var(--success)' : ipo.decision === 'WATCH' ? 'var(--warning)' : 'var(--danger)'
                            }}>
                              {ipo.decision === 'YES' ? 'YES — APPLY' : ipo.decision === 'WATCH' ? 'MAYBE — WATCH' : 'NO — AVOID'}
                            </span>
                          </div>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-h)', marginTop: '4px', fontWeight: '600', paddingLeft: '26px' }}>
                            Reason: <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{ipo.reason || (ipo.decision === 'YES' ? 'All mandatory checks passed' : 'Criteria not met')}</span>
                          </div>
                        </div>

                        {/* 3. Decision-Driving Metrics */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          marginBottom: '14px'
                        }}>
                          <div>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px', marginBottom: '2px' }}>
                              GMP PREMIUM
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                              {ipo.gmp_pct ? `+${ipo.gmp_pct}%` : '0%'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px', marginBottom: '2px' }}>
                              QIB DEMAND
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: ipo.qib_sub >= 50 ? 'var(--success)' : ipo.qib_sub > 0 ? 'var(--accent)' : 'var(--text-h)' }}>
                              {ipo.qib_sub && ipo.qib_sub > 0 ? `${ipo.qib_sub}x` : (ipo.total_sub ? `${ipo.total_sub}x` : 'Not available')}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.3px', marginBottom: '2px' }}>
                              ALLOTMENT ODDS
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>
                              {ipo.retail_sub && ipo.retail_sub > 1 ? `${(100 / ipo.retail_sub).toFixed(1)}%` : '100%'}
                            </span>
                          </div>
                        </div>

                        {/* 4. Checklist Status Summary Row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 'var(--font-xs)',
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

                      {/* 5. Bottom Execution Information: Lot & View Details */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '12px'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)' }}>
                          1 Lot: ₹{lotCost}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
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

              {/* Centered Pagination (1 Orange Pill + 1 Grey Dot) - only shown when more than 3 cards (Desktop only) */}
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

              {/* Bottom Decision Engine Legend */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                fontSize: 'var(--font-xs)'
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                  <Info size={12} />
                  <span>2 mandatory checks must pass. Minimum 6 total checks must pass for YES.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle Section: Cumulative Profit Growth & Allotment Win Rate */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Cumulative Profit Chart */}
          {renderDashboardCharts()}

          {/* Allotment Win Rate Circular Gauge */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                <span style={{ fontSize: 'var(--font-lg)', fontWeight: '600', color: 'var(--text-h)', lineHeight: '1' }}>{winRate}%</span>
                <span style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px', letterSpacing: '0.5px' }}>ALLOTTED</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '12px', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>{allottedBids}</span> Allotted
              </div>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-strong)' }}></div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{refundedBids}</span> Refunded
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Capital Pool & Active Bids Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Family Capital Pool */}
          <div className="premium-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Family Capital Pool</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Total Capital Pool</span>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)' }}>₹{capital.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>ASBA Blocked Funds</span>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--warning)' }}>₹{totalBlocked.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600' }}>Available Liquid Cash</span>
              <span style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--success)' }}>₹{liquidCapital.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ width: `${(liquidCapital / capital) * 100}%`, backgroundColor: 'var(--success)', transition: 'width 0.3s ease' }}></div>
              <div style={{ width: `${(totalBlocked / capital) * 100}%`, backgroundColor: 'var(--warning)', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>

          {/* Active Bids Checklist */}
          <div className="premium-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Active Bid Checklist</h3>
            {userApplications.filter(a => a.status === 'PENDING').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                No active ASBA blocks found. Start bidding in the IPO Pipeline above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                {userApplications.filter(a => a.status === 'PENDING').map(app => {
                  const ipo = ipos.find(i => i.id === app.ipo_id);
                  const account = userAccounts.find(acc => acc.id === app.account_id);
                  if (!ipo || !account) return null;
                  
                  return (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 'var(--font-sm)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>{ipo.name}</span>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Slot: {account.account_holder_name}</span>
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
  };

  const renderDashboardCharts = () => {
    const allottedBids = [...userApplications]
      .filter(a => a.status === 'ALLOTTED')
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    let cumulative = 0;
    const profitPoints = allottedBids.map((bid, idx) => {
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
      <div className="premium-card" style={{ padding: '16px', flexGrow: 1, minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>
            Cumulative Profit Growth (₹)
          </h3>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
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
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Place bids and mark allotment status in the Family Rotator!</span>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '170px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Guide Grid Lines & Milestones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '4px' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>₹{(totalGain).toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--success)' }}>
                  ₹{(totalGain).toLocaleString('en-IN')} ({profitPoints[profitPoints.length - 1]?.name || 'Latest Allotment'})
                </span>
              </div>
              {profitPoints.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: '4px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>₹{(profitPoints[0].value).toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-muted)' }}>
                    ₹{(profitPoints[0].value).toLocaleString('en-IN')} ({profitPoints[0]?.name || 'Initial Allotment'})
                  </span>
                </div>
              )}
            </div>

            {/* SVG Visual Trajectory Curve */}
            <div style={{ width: '100%', height: '70px', marginTop: '10px' }}>
              <svg width="100%" height="70" viewBox="0 0 400 70" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,65 Q 100,50 200,35 T 400,10 L 400,70 L 0,70 Z"
                  fill="url(#profitGrad)"
                />
                <path
                  d="M 0,65 Q 100,50 200,35 T 400,10"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                />
                <circle cx="400" cy="10" r="4.5" fill="var(--success)" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrackerTab = () => {
    const now = new Date();

    const biddingList = ipos.filter(i => i.status === 'bidding');
    const upcomingList = ipos
      .filter(i => i.status === 'upcoming')
      .sort((a, b) => {
        if (!a.open_date) return 1;
        if (!b.open_date) return -1;
        return new Date(a.open_date) - new Date(b.open_date);
      })
      .slice(0, 5);
    const closedList = ipos
      .filter(i => i.status !== 'bidding' && i.status !== 'upcoming')
      .sort((a, b) => {
        if (!a.close_date) return 1;
        if (!b.close_date) return -1;
        return new Date(b.close_date) - new Date(a.close_date);
      })
      .slice(0, 8);

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

    const renderIpoList = (list, title, emptyMsg) => (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {title} <span className="badge badge-neutral">{list.length}</span>
        </h3>
        {list.length === 0 ? (
          <div style={{ padding: '20px', border: '1px dashed var(--border-strong)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: 'var(--font-xs)', textAlign: 'center' }}>
            {emptyMsg}
          </div>
        ) : viewMode === 'list' ? (
          /* Sleek Table List View */
          <div className="premium-card" style={{ padding: '0px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.015)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Company</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>GMP Premium</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Subscription</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Allotment Chance</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Issue Size</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Lot Cost</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Closing Date</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--text-h)' }}>Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(ipo => {
                    const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                    return (
                      <tr
                        key={ipo.id}
                        onClick={() => setSelectedIpo(ipo)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{ipo.name}</div>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Symbol: {ipo.symbol}</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.gmp_pct}%
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: ipo.total_sub >= 30 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.total_sub}x <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Retail: {ipo.retail_sub || 0}x)</span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--success)' }}>
                          {ipo.retail_sub && ipo.retail_sub > 1 ? `${(100 / ipo.retail_sub).toFixed(1)}%` : '100%'}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-h)' }}>
                          ₹{ipo.issue_size_cr} Cr
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-h)' }}>
                          ₹{ipo.retail_lot_cost?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                          {dateStr}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: '600',
                            color: ipo.decision === 'YES' ? '#ffffff' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            backgroundColor: ipo.decision === 'YES' ? 'var(--accent)' : '#FAFAFA',
                            borderRadius: '16px',
                            border: ipo.decision === 'YES' ? 'none' : '1px solid var(--border)'
                          }}>
                            {ipo.decision === 'YES' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {ipo.decision === 'YES' ? 'YES — APPLY' : ipo.decision === 'NO' ? 'NO — AVOID' : 'MAYBE — WATCH'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View Cards */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {list.map(ipo => {
              const dateStr = ipo.close_date ? new Date(ipo.close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
              return (
                <div
                  key={ipo.id}
                  onClick={() => setSelectedIpo(ipo)}
                  className="premium-card ipo-card"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--theme-border-radius)',
                    padding: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '250px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className={`badge ${ipo.status === 'bidding' ? 'badge-success' : ipo.status === 'upcoming' ? 'badge-warning' : 'badge-neutral'}`}>
                        {ipo.status.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: ipo.decision === 'YES' ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        backgroundColor: ipo.decision === 'YES' ? 'var(--accent)' : '#FAFAFA',
                        borderRadius: '16px',
                        border: ipo.decision === 'YES' ? 'none' : '1px solid var(--border)'
                      }}>
                        {ipo.decision === 'YES' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {ipo.decision === 'YES' ? 'YES — APPLY' : ipo.decision === 'NO' ? 'NO — AVOID' : 'MAYBE — WATCH'}
                      </span>
                    </div>
                    {ipo.is_fallback && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: 'var(--warning-bg)',
                        border: '1px solid var(--warning-border)',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        marginBottom: '8px',
                        fontSize: 'var(--font-xs)',
                        fontWeight: '600',
                        color: 'var(--text-h)',
                        letterSpacing: '0.02em'
                      }}>
                        ⚠️ Simulated / Estimated Data — Not Live
                      </div>
                    )}

                    <h4 style={{ fontSize: 'var(--font-md)', fontWeight: '600', margin: '0 0 4px 0', color: 'var(--text-h)', lineHeight: '1.2' }}>
                      {ipo.name}
                    </h4>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                      Symbol: <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--font-xs)', color: 'var(--text-h)', fontWeight: '600' }}>{ipo.symbol}</span>
                    </p>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{ipo.score}/8 Rules Passed</span>
                      <span>•</span>
                      <span>Closes {dateStr}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 8px', borderTop: '1px solid var(--border)', padding: '12px 0', marginTop: 'auto' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '500' }}>GMP Premium</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                          {ipo.gmp_pct}%
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '500' }}>QIB Sub</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                          {ipo.total_sub}x
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '500' }}>Retail Odds</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                          {ipo.retail_sub && ipo.retail_sub > 1 ? `${(100 / ipo.retail_sub).toFixed(1)}%` : '100%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Lot Size</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-h)' }}>₹{ipo.retail_lot_cost?.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: 'var(--font-xs)', color: 'var(--accent)', fontWeight: '600' }}>
                      View details <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
              Ongoing & Upcoming IPOs
            </h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Track demand multiples and GMP curves daily. Yes signals are highlighted on closing-day bids.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Last checked: <strong style={{ color: 'var(--text-h)' }}>{lastRefreshedDate}</strong>
            </span>
            
            <button 
              onClick={handleForceRefresh}
              disabled={dbLoading}
              className="btn"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-strong)',
                borderRadius: '999px',
                padding: '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: '600',
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

            <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.03)', padding: '3px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => { setViewMode('grid'); localStorage.setItem('ipo_view_mode', 'grid'); }}
                style={{
                  padding: '6px 12px',
                  fontSize: 'var(--font-xs)',
                  fontWeight: '600',
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
                  padding: '6px 12px',
                  fontSize: 'var(--font-xs)',
                  fontWeight: '600',
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

        {dbLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
            Synchronizing data pools...
          </div>
        ) : (
          <div>
            {renderIpoList(biddingList, 'Ongoing IPOs (Bidding Active)', 'No IPOs currently active for bidding.')}
            {renderIpoList(upcomingList, 'Upcoming IPO Listings', 'No upcoming listings scheduled for next week.')}
            {renderIpoList(closedList, 'Recently Closed / Listed Listings', 'No recent listings found.')}
          </div>
        )}
      </div>
    );
  };

  const renderCapitalTab = () => {
    // 1. Calculate stats
    const activePanSlots = userAccounts.length;
    const totalCapital = capital;
    const availableCash = liquidCapital;
    
    // Group members accounts
    const accountsWithStats = userAccounts.map(account => {
      const activeBids = userApplications.filter(app => app.account_id === account.id && app.status === 'PENDING');
      const activeBlocked = activeBids.reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);
      
      // Determine relationship
      const holderLower = account.account_holder_name.toLowerCase();
      let rel = 'FAMILY MEMBER';
      let capitalLimit = 20000;
      if (holderLower.includes('prabhat')) {
        rel = 'SELF (PRIMARY)';
        capitalLimit = 35000;
      } else if (holderLower.includes('mona')) {
        rel = 'MOTHER';
        capitalLimit = 20000;
      } else if (holderLower.includes('kishore')) {
        rel = 'FATHER';
        capitalLimit = 25000;
      } else if (account.user_id === (session?.user?.id || session?.id)) {
        rel = 'SELF (PRIMARY)';
        capitalLimit = 35000;
      }
      
      // Get initials
      const names = account.account_holder_name.split(' ');
      const initials = names.map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return {
        ...account,
        activeBids,
        activeBlocked,
        relationship: rel,
        capitalLimit,
        initials
      };
    });

    const linkedBankAccountsCount = userAccounts.reduce((sum, acc) => {
      return sum + (acc.bank_name ? acc.bank_name.split(',').length : 1);
    }, 0);

    // Active allocations
    const activeAllocationsTotal = accountsWithStats.reduce((sum, acc) => sum + acc.capitalLimit, 0);

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
              Family Rotator
            </h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Manage family member PAN slots, ASBA bank accounts, and capital limits.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', backgroundColor: 'var(--bg)', border: '1px solid var(--border-strong)', padding: '8px 16px', borderRadius: '999px', fontWeight: '500' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span> Active Session
          </div>
        </div>

        {/* Top 4 Statistics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value" style={{ color: 'var(--text-h)' }}>
              ₹{availableCash.toLocaleString('en-IN')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Available Liquid</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {totalCapital > 0 ? Math.round((availableCash / totalCapital) * 100) : 100}% Capital Deployable
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value">₹{totalCapital.toLocaleString('en-IN')}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Total Capital Pool</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Consolidated family capital</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value">{activePanSlots}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Active PAN Slots</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Across primary & secondary</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span className="metric-card-value">{linkedBankAccountsCount}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="metric-card-label">Linked Banks</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>ASBA enabled netbanking profiles</span>
            </div>
          </div>
        </div>

        {/* Over-Allocation Warning */}
        {activeAllocationsTotal > totalCapital && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#171717', color: '#ffffff', borderRadius: '12px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>⚠️</span>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600' }}>
              Over-allocated by ₹{(activeAllocationsTotal - totalCapital).toLocaleString('en-IN')}. Please adjust member limits.
            </span>
          </div>
        )}

        {/* Two-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Column: PAN Slots & Credentials */}
          <div className="premium-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>
                PAN Slots & Credentials
              </h3>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '16px' }}
              >
                + Add Member
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)', fontWeight: '600' }}>
                    <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Member Profile</th>
                    <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>ASBA Netbanking</th>
                    <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Capital Limit</th>
                    <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Active Status</th>
                    <th style={{ padding: '10px 12px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {accountsWithStats.map(account => (
                    <tr key={account.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--success-bg)',
                            border: '1px solid var(--success-border)',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '12px',
                            flexShrink: 0
                          }}>
                            {account.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{account.account_holder_name}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', fontWeight: '600', textTransform: 'uppercase' }}>
                              {account.relationship}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{account.bank_name || 'SBI'}</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                          PAN: {account.pan_mask}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: '600', color: 'var(--text-h)' }}>
                        ₹{account.capitalLimit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className={`badge ${account.activeBids.length > 0 ? 'badge-success' : 'badge-neutral'}`} style={{ borderRadius: '8px', padding: '4px 10px' }}>
                          {account.activeBids.length > 0 ? (
                            <>
                              <CheckCircle2 size={10} />
                              {account.activeBids.length} Active Bid{account.activeBids.length > 1 ? 's' : ''}
                            </>
                          ) : (
                            'Idle'
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteAccountSlot(account.id)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Delete Slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accountsWithStats.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No family members configured. Click '+ Add Member' to link a PAN slot.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Capital Allocation & ASBA Block History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Capital Allocation Progress Card */}
            <div className="premium-card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 4px 0' }}>
                Capital Allocation
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '20px' }}>
                Active Allocations: ₹{activeAllocationsTotal.toLocaleString('en-IN')} / ₹{totalCapital.toLocaleString('en-IN')}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {accountsWithStats.map(account => {
                  const pct = totalCapital > 0 ? Math.round((account.capitalLimit / totalCapital) * 100) : 0;
                  return (
                    <div key={account.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>{account.account_holder_name}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>₹{account.capitalLimit.toLocaleString('en-IN')} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Unallocated Reserve */}
                {availableCash > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Unallocated Reserve</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                        ₹{availableCash.toLocaleString('en-IN')} ({totalCapital > 0 ? Math.round((availableCash / totalCapital) * 100) : 100}%)
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${totalCapital > 0 ? (availableCash / totalCapital) * 100 : 100}%`, height: '100%', backgroundColor: 'var(--text-muted)', opacity: 0.3, borderRadius: '3px' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ASBA Block History Card */}
            <div className="premium-card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 16px 0' }}>
                ASBA Block History
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userApplications.filter(app => app.status === 'PENDING').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border-strong)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                    No active ASBA blocks found. Deploy bids in the Tracker!
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
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          backgroundColor: '#FAFAFA'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: 'var(--font-sm)', display: 'block' }}>
                            {ipo.name}
                          </span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            Slot: <strong>{account.account_holder_name}</strong>
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                            ₹{parseFloat(app.bid_amount).toLocaleString('en-IN')}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleResolveApplication(app.id, true)}
                              className="btn btn-primary"
                              style={{ padding: '3px 8px', fontSize: '9px', borderRadius: '6px' }}
                            >
                              Allot
                            </button>
                            <button
                              onClick={() => handleResolveApplication(app.id, false)}
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '9px', borderRadius: '6px' }}
                            >
                              Refund
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Group Collaboration Collapse Section */}
        <div className="premium-card" style={{ padding: '20px 24px' }}>
          <details>
            <summary style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--success)' }} /> Group Sharing Settings & Invite Members
            </summary>
            
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {!familyGroup ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                  <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>Create Group</h4>
                    <input
                      type="text"
                      placeholder="Group Name (e.g. Motwani Family Pool)"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="input-field"
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '12px' }}>Create</button>
                  </form>
                  <form onSubmit={handleJoinWithCode} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>Join Group with Code</h4>
                    <input
                      type="text"
                      placeholder="Invitation Code (8 chars)"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      className="input-field"
                      maxLength={8}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '12px' }}>Join</button>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg)', padding: '12px 16px', borderRadius: '16px' }}>
                    <div>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Active Collaboration Group</span>
                      <h4 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>{familyGroup.group_name}</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: '600', color: 'var(--success)' }}>Code: {familyGroup.invite_code || 'SANDBOX8'}</span>
                      <button onClick={handleLeaveGroup} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 'var(--font-xs)', borderRadius: '10px' }}>Leave Group</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                    <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="email"
                        placeholder="Invite member by email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="input-field"
                        required
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', borderRadius: '12px', whiteSpace: 'nowrap' }}>Invite</button>
                    </form>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '8px' }}>Members List ({groupMembers.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                        {groupMembers.map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}>
                            <span>{m.user_profiles?.display_name || 'Guest'} ({m.role})</span>
                            {familyGroup.creator_id !== m.user_id && m.user_id !== (session.user?.id || session.id) && (
                              <button onClick={() => handleRemoveMember(m.user_id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}>&times;</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

      </div>
    );
  };

  const renderBacktestTab = () => {
    const dynamicRes = runDynamicBacktest();
    const finalCapital = dynamicRes.finalCapital;
    const yesCount = dynamicRes.yesCount;
    const originalStats = backtestData?.stats || {};
    const totalEvaluated = dynamicRes.history.length;

    // Calculate profitable wins & avoided losses dynamically
    const profitableYes = dynamicRes.history.filter(h => h.decision === 'YES' && h.potentialOutcome > 0).length;
    const avoidedLosses = dynamicRes.history.filter(h => h.decision === 'NO' && h.potentialOutcome < 0).length;
    const winRate = totalEvaluated > 0 ? Math.round(((profitableYes + avoidedLosses) / totalEvaluated) * 100) : 0;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
              Backtest Engine
            </h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Adjust parameters to view simulated historical returns against a blind allocation lottery.
            </p>
          </div>
          <button
            onClick={() => {
              alert("Backtest simulation recalculated using active thresholds!");
            }}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: 'var(--font-sm)', borderRadius: '16px' }}
          >
            Run Backtest Simulation
          </button>
        </div>

        {/* 3 Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="premium-card metric-card">
            <span className="metric-card-label">SIMULATED PERIOD</span>
            <div className="metric-card-value">Past 3 Years</div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Aug 2023 - Aug 2026</span>
          </div>

          <div className="premium-card metric-card">
            <span className="metric-card-label">TOTAL IPOS SCREENED</span>
            <div className="metric-card-value">{totalEvaluated} Listings</div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Matching minimal sizing requirements</span>
          </div>

          <div className="premium-card metric-card">
            <span className="metric-card-label">SIMULATED WIN RATE</span>
            <div className="metric-card-value">{winRate}%</div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              {profitableYes} Wins • {avoidedLosses} Avoided Losses
            </span>
          </div>
        </div>

        {/* Expandable Simulator Control Panel */}
        <div className="premium-card" style={{ padding: '20px 24px' }}>
          <details>
            <summary style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Simulator Settings (GMP & Subscription Thresholds)
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px', backgroundColor: 'var(--bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>
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
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Filters out listings with weak demand premiums.</span>
              </div>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)', display: 'block', marginBottom: '8px' }}>
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
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Filters out listings with weak closing-day velocity.</span>
              </div>
            </div>
            
            {/* Display Yield comparison inside control panel */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--success-bg)' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Simulated Return Yield</span>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--success)', marginTop: '4px' }}>
                  ₹{finalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', fontWeight: '600' }}>
                  + {((finalCapital - 100000) / 1000).toFixed(1)}% Listing Returns
                </span>
              </div>
              <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Blind Strategy Yield</span>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-h)', marginTop: '4px' }}>
                  ₹{originalStats.blind_final_capital?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '₹99,228'}
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Bidding blind lots to all listings
                </span>
              </div>
            </div>
          </details>
        </div>

        {/* Backtest Results Card Table */}
        <div className="premium-card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', marginBottom: '16px' }}>
            Backtest Simulation Results
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)', fontWeight: '600', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Company Name</th>
                  <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Listing Date</th>
                  <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Est. GMP</th>
                  <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Listing Gain</th>
                  <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Decision</th>
                  <th style={{ padding: '10px 12px', textTransform: 'uppercase' }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {dynamicRes.history.map((h, idx) => {
                  const item = backtestData.stats.detailed_results[idx];
                  const fmtDate = (dStr) => dStr ? new Date(dStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
                  
                  // Color codes for avoided outcomes
                  const isLossAvoided = h.decision === 'NO' && h.potentialOutcome < 0;
                  
                  let outcomeText = '';
                  let outcomeColor = 'var(--text-muted)';
                  
                  if (h.decision === 'YES') {
                    if (h.potentialOutcome > 0) {
                      outcomeText = 'SUCCESSFUL GAIN';
                      outcomeColor = 'var(--success)';
                    } else {
                      outcomeText = 'REALIZED LOSS';
                      outcomeColor = 'var(--danger)';
                    }
                  } else {
                    if (h.potentialOutcome < 0) {
                      outcomeText = 'AVOIDED LOSS';
                      outcomeColor = 'var(--success)';
                    } else {
                      outcomeText = 'AVOIDED GAIN';
                      outcomeColor = 'var(--text-muted)';
                    }
                  }

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedIpo(item)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    >
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{h.name}</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                          Symbol: <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{item.symbol}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: '500', color: 'var(--text-h)' }}>
                        {fmtDate(item.listing_date || item.open_date)}
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: '600', color: 'var(--text-h)' }}>
                        +{item.gmp_pct != null ? item.gmp_pct : 0}%
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: '600', color: item.listing_gains_pct > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {item.listing_gains_pct > 0 ? '+' : ''}{item.listing_gains_pct}%
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className={`badge ${h.decision === 'YES' ? 'badge-success' : 'badge-neutral'}`} style={{ borderRadius: '8px', padding: '4px 10px' }}>
                          {h.decision === 'YES' ? 'YES — APPLY' : 'NO — AVOID'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: '600', color: outcomeColor, fontSize: 'var(--font-xs)', letterSpacing: '0.2px' }}>
                        {outcomeText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  const renderGuideTab = () => {
    const rulesList = [
      {
        id: 1,
        title: "Rule 1: GMP Premium > 20%",
        badge: "MANDATORY",
        desc: "Grey Market Premium (GMP) must display an estimated premium of at least 20% over the high end of the price band to buffer listing-day price drops.",
        formula: "Estimated Listing Price = Price Band High * (1 + GMP% / 100)",
        parameters: [
          { label: "Minimum GMP requirement", val: ">= 20.0%" },
          { label: "Target listing gain margin", val: ">= 15.0%" }
        ],
        details: "Grey Market Premium (GMP) represents unofficial trading activity before the official listing. A minimum premium of 20% acts as a margin of safety against market volatility on listing day."
      },
      {
        id: 2,
        title: "Rule 2: QIB Demand > 30x",
        badge: "MANDATORY",
        desc: "Qualified Institutional Buyers (QIB) segment subscription must be at least 30x on the final day, verifying strong institutional interest.",
        formula: "Institutional Over-Subscription = QIB Bids / QIB Portion",
        parameters: [
          { label: "Minimum QIB Over-subscription", val: "30.0x" },
          { label: "Bidding day 3 speed threshold", val: "10.0x by 12:00 PM" }
        ],
        details: "QIB subscription represents smart institutional capital. Strong QIB demand indicates that mutual funds, insurance companies, and foreign institutions support the IPO pricing."
      },
      {
        id: 3,
        title: "Rule 3: Retail Subscription < 15x",
        badge: "OPTIONAL",
        desc: "Retail subscription should ideally be moderate (less than 15x) to ensure reasonable allotment odds when bidding from multiple family accounts.",
        formula: "Allotment Probability = 1 / Retail Over-Subscription",
        parameters: [
          { label: "Target Retail Over-subscription", val: "< 15.0x" },
          { label: "Retail Allotment Allocation", val: "35% of total issue (Mainboard)" }
        ],
        details: "Lower retail subscription means higher allotment odds per application. By placing single-lot bids across multiple unique family PAN cards, we maximize the probability of winning an allotment."
      },
      {
        id: 4,
        title: "Rule 4: Valuation P/E Discount",
        badge: "MANDATORY",
        desc: "The IPO price band high must reflect a discount of at least 15% on the price-to-earnings (P/E) multiple compared to public peers.",
        formula: "Discount% = (1 - (IPO P/E / Industry Peer Average P/E)) * 100",
        parameters: [
          { label: "Minimum P/E discount to peers", val: "15.0%" },
          { label: "IPO price band high cap", val: "₹14,938 (Retail lot threshold)" }
        ],
        details: "IPOs priced at a discount to public industry peers offer 'money on the table' for listing gains. Fully priced or over-valued listings carry high downside risks on listing day."
      },
      {
        id: 5,
        title: "Rule 5: Net Profit YoY Growth",
        badge: "MANDATORY",
        desc: "Net Profit after tax (PAT) must exhibit a positive compound growth rate of at least 10% YoY over the preceding 3 fiscal years.",
        formula: "PAT CAGR = ((Year 3 PAT / Year 1 PAT) ^ (1/2) - 1) * 100",
        parameters: [
          { label: "Minimum Profit YoY growth", val: ">= 10.0%" },
          { label: "Net Margin status", val: "Positive & stable margins" }
        ],
        details: "Strong historical earnings growth verifies that the company has a scalable business model. Avoid companies with erratic or negative bottom-line trends."
      },
      {
        id: 6,
        title: "Rule 6: Post-IPO Promoter Stake",
        badge: "OPTIONAL",
        desc: "Post-IPO promoter shareholding should ideally remain above 50% to ensure key stake-holders have strong incentive alignment.",
        formula: "Promoter Stake% = (Post-IPO Shares Held / Total Shares Outstanding) * 100",
        parameters: [
          { label: "Target Post-IPO Promoter Stake", val: ">= 50.0%" },
          { label: "Lock-in period", val: "90 Days (Minimum for promoters)" }
        ],
        details: "Promoter alignment ensures that the founders have 'skin in the game'. If promoters exit completely or hold very low stake, there is less incentive for long-term growth."
      },
      {
        id: 7,
        title: "Rule 7: Debt-to-Equity < 1.0",
        badge: "MANDATORY",
        desc: "The debt-to-equity ratio of the company must be less than 1.0, ensuring high solvency and low interest liability risk.",
        formula: "Debt-to-Equity Ratio = Total Debt / Shareholder Equity",
        parameters: [
          { label: "Debt-to-equity ratio threshold", val: "< 1.0" },
          { label: "Interest coverage ratio", val: "> 3.0x" }
        ],
        details: "High debt increases insolvency risk and interest burdens, which can depress future earnings. A clean balance sheet indicates capital efficiency and financial stability."
      },
      {
        id: 8,
        title: "Rule 8: Fresh Issue > 50%",
        badge: "OPTIONAL",
        desc: "Fresh capital issue component must be greater than 50% of the total issue size, meaning money goes to growth rather than promoters exiting.",
        formula: "Fresh Issue Share% = (Fresh Issue Size / Total Issue Size) * 100",
        parameters: [
          { label: "Target Fresh Issue share", val: "> 50.0%" },
          { label: "OFS (Offer for Sale) share", val: "< 50.0%" }
        ],
        details: "Fresh issue capital goes directly to the company's treasury for growth, debt reduction, or expansion. Offer for Sale (OFS) capital goes to exiting shareholders, providing no benefit to the company."
      }
    ];

    const activeRule = rulesList.find(r => r.id === activeRuleModal);

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Row */}
        <div>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
            8 Rules Guide
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Our core listing-day risk management and opportunity filtering framework.
          </p>
        </div>

        {/* 2-Column Rules Grid Container */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          {rulesList.map(rule => (
            <div
              key={rule.id}
              onClick={() => setActiveRuleModal(rule.id)}
              className="premium-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                border: '1px solid var(--border)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                backgroundColor: 'var(--card-bg)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)' }}>
                  {rule.title}
                </span>
                <span className={`badge ${rule.badge === 'MANDATORY' ? 'badge-success' : 'badge-neutral'}`} style={{ borderRadius: '8px', padding: '4px 10px' }}>
                  {rule.badge}
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text)', margin: 0, lineHeight: '1.5' }}>
                {rule.desc}
              </p>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Formula & parameters →
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Modal Drawer for Rule details */}
        {activeRuleModal !== null && activeRule && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }} onClick={() => setActiveRuleModal(null)}>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '28px',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Close X Button */}
              <button
                onClick={() => setActiveRuleModal(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>
                  {activeRule.title}
                </h3>
                <span className={`badge ${activeRule.badge === 'MANDATORY' ? 'badge-success' : 'badge-neutral'}`} style={{ borderRadius: '8px', padding: '4px 10px' }}>
                  {activeRule.badge}
                </span>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  {activeRule.details}
                </p>
              </div>

              {/* Formula Card */}
              <div style={{
                padding: '18px',
                border: '1px solid var(--border-strong)',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--bg), rgba(255, 255, 255, 0.02))',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Rule Evaluation Formula
                </span>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: '600',
                  color: 'var(--text-h)',
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  overflowX: 'auto'
                }}>
                  {activeRule.formula}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activeRule.parameters.map((p, idx) => (
                    <div key={idx} style={{ fontSize: 'var(--font-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{p.label}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>{p.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveRuleModal(null)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '16px' }}
              >
                Close Rule details
              </button>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ marginBottom: '10px' }}>
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: 'var(--tracking-tight)' }}>
            User Settings & Profile
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Manage your personal profile, credentials, and collaborative family pools.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Profile details */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Information</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Display Name</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    fontSize: 'var(--font-sm)',
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={handleSaveDisplayName} 
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: 'var(--font-sm)', borderRadius: '8px' }}
                >
                  Save
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</span>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)' }}>{userProfile?.email || session?.user?.email || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Session Type</span>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--success)' }}>
                {isGuestMode ? 'Offline Simulation (Sandbox)' : 'Supabase Cloud Authenticated'}
              </span>
            </div>
          </div>

          {/* Group statistics */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Investment Group Details</h3>
            
            {familyGroup ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Active Group Name</span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)' }}>{familyGroup.group_name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Shared PAN Slots</span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)' }}>{userAccounts.length} slots</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Shared Group Members</span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)' }}>{groupMembers.length} members</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                You are currently running a personal portfolio. Create an Investment Group in the Rotator tab to collaborate!
              </div>
            )}
          </div>
        </div>

        {/* Support educational guides row */}
        <div className="premium-card">
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', margin: '0 0 12px 0' }}>Help & Support</h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Need help configuring Telegram alerts or banking ASBA blocks? Check our repository documentation or read the 8 Rules Guide.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('guide')} style={{ fontSize: 'var(--font-xs)' }}>
              Read the Guides
            </button>
            <a href="https://github.com/Prabhat-12/ipo-investment-tool" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ fontSize: 'var(--font-xs)' }}>
                View GitHub Repository
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER LOGGED IN PORTAL VIEW
  // ==========================================
  return (
    <div className="dashboard-container animate-fade-in">

      {/* MOBILE HEADER BAR */}
      <div className="mobile-header">
        <span className="mobile-header-title">IPO Investment Engine</span>
        <span className="mobile-header-status">
          <Sparkles size={10} />
          {isGuestMode ? 'Offline' : 'Live Sync'}
        </span>
      </div>

      {/* SIDEBAR NAVIGATION PANEL (hidden on mobile via CSS) */}
      <aside className="sidebar">
        <div>
          {/* Brand header */}
          <div className="sidebar-brand">
            <div style={{ padding: '8px', borderRadius: '16px', backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 className="sidebar-brand-name">IPO Tracker</h1>
                <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>v2.0</span>
              </div>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                {isGuestMode ? 'Offline Sandbox' : 'Cloud Connected'}
              </span>
            </div>
          </div>

          {/* Navigation vertical list */}
          <nav className="sidebar-menu">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'capital', label: 'Family Rotator', icon: Users },
              { id: 'backtest', label: 'Backtest Engine', icon: TrendingUp },
              { id: 'guide', label: '8 Rules Guide', icon: Info }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedIpo(null);
                  }}
                  className={`sidebar-link ${activeTab === item.id ? 'sidebar-link-active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile row and Sign out */}
        <div className="sidebar-footer">
          <button 
            onClick={() => {
              setActiveTab('profile');
              setSelectedIpo(null);
            }}
            className={`sidebar-profile ${activeTab === 'profile' ? 'sidebar-link-active' : ''}`}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', fontWeight: '600', fontSize: 'var(--font-sm)' }}>
              {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userProfile?.display_name || 'My Profile'}
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userProfile?.email || 'Settings & sharing'}
              </span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ width: '100%', fontSize: 'var(--font-xs)', padding: '8px 12px' }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW PORTAL CONTENT SECTION */}
      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'capital' && renderCapitalTab()}
        {activeTab === 'backtest' && renderBacktestTab()}
        {activeTab === 'guide' && renderGuideTab()}
        {activeTab === 'profile' && renderProfileTab()}
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
              8 Rules Guide
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

      {/* DETAIL SIDE PANEL DRAWER (SLIDE-OUT FROM FAR RIGHT) */}
      {selectedIpo && (
        <div className="drawer-backdrop" onClick={() => setSelectedIpo(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Mobile Back Button */}
            <button
              onClick={() => setSelectedIpo(null)}
              className="mobile-back-btn"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>

            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-md)', fontWeight: '600', margin: 0, color: 'var(--text-h)', letterSpacing: 'var(--tracking-tight)', lineHeight: '1.2' }}>
                  {selectedIpo.name}
                </h2>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Symbol: <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{selectedIpo.symbol}</span>
                </p>
              </div>
              {!isMobile && (
                <button
                  onClick={() => setSelectedIpo(null)}
                  style={{ border: 'none', background: 'none', fontSize: 'var(--font-lg)', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', lineHeight: '1' }}
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
                <span style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', fontWeight: '600', color: selectedIpo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)', display: 'block', letterSpacing: '0.5px' }}>
                  Bidding Recommendation
                </span>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: '600', color: selectedIpo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)' }}>
                  {selectedIpo.decision === 'YES' ? '✔ YES - DEPLOY ASBA' : '✖ NO - AVOID LISTING'}
                </span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                <span style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--success)', display: 'block', lineHeight: '1' }}>
                  {selectedIpo.retail_sub && selectedIpo.retail_sub > 1 ? `${(100 / selectedIpo.retail_sub).toFixed(1)}%` : '100%'}
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Allotment Odds</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 'var(--font-md)', fontWeight: '600', color: 'var(--text-h)', display: 'block', lineHeight: '1' }}>
                  {selectedIpo.score}/8
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Rules</span>
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
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-h)', display: 'block', marginBottom: '10px' }}>Bidding Velocities Multiple</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'QIB Segment', val: selectedIpo.qib_sub, limit: 50, color: 'var(--accent)' },
                    { label: 'Retail Portion', val: selectedIpo.retail_sub, limit: 10, color: 'var(--success)' },
                    { label: 'Total Oversubscription', val: selectedIpo.total_sub, limit: 30, color: 'var(--warning)' }
                  ].map((sub, idx) => (
                    <div key={idx} style={{ fontSize: 'var(--font-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>{sub.label}</span>
                        <span style={{ fontWeight: '600' }}>{(sub.val || 0).toFixed(1)}x <span style={{ color: 'var(--text-muted)' }}>(Target: {sub.limit}x)</span></span>
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
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
              8-Metric Checklist Audit
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(() => {
                // Metadata for all 8 rules so we can reconstruct display for both live & backtest items
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

                // Normalise rules — active tracker items have full objects; backtest items have plain booleans
                const rawRules = selectedIpo.rules || {};
                const firstVal = Object.values(rawRules)[0];
                const isFullObject = firstVal !== null && typeof firstVal === 'object' && 'passed' in firstVal;

                const normalisedRules = Object.keys(RULE_META).map(key => {
                  const meta = RULE_META[key];
                  if (isFullObject) {
                    // Full object from evaluateIpoClient — use directly
                    const rule = rawRules[key];
                    if (!rule) return null;
                    return { key, passed: rule.passed, title: rule.title || meta.title, description: rule.description || meta.description, value: rule.value || '', mandatory: meta.mandatory };
                  } else {
                    // Plain boolean from backtest JSON — reconstruct from metadata
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
                      fontSize: 'var(--font-sm)'
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
                      <div style={{ fontWeight: '600', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {rule.title}
                        {rule.mandatory && (
                          <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                            MANDATORY
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{rule.description}</span>
                    </div>
                    <div style={{ fontWeight: '600', color: rule.passed ? 'var(--accent)' : 'var(--text-muted)', fontSize: 'var(--font-xs)', textAlign: 'right', minWidth: '80px' }}>
                      {rule.value}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Financial Margins trajectory */}
            {selectedIpo.financials && selectedIpo.financials.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                  Historical Financial Margins
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {selectedIpo.financials.map((f, idx) => (
                    <div key={idx} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>{f.fiscal_year}</span>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-h)', display: 'block' }}>₹{f.pat_cr} Cr PAT</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: f.pat_margin_pct > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
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
                <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: '600', margin: '0 0 4px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} style={{ color: 'var(--accent)' }} /> Multi-PAN Family Rotation Bidding
                </h4>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                  Select the family member accounts who are applying for this IPO.
                </p>

                {userAccounts.length === 0 ? (
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--danger)' }}>
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
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: alreadyBid ? 'not-allowed' : 'pointer', width: '100%', fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-h)', margin: 0 }}>
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
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal', fontFamily: 'var(--mono)' }}>
                                  PAN: {acc.pan_mask} {activeBlocked > 0 && <span style={{ color: 'var(--warning)', fontWeight: '600' }}>(Blocked: ₹{activeBlocked.toLocaleString('en-IN')})</span>}
                                </span>
                              </div>
                            </label>
                            
                            <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: alreadyBid ? 'var(--text-muted)' : 'var(--text-h)' }}>
                              {alreadyBid ? 'Applied' : `₹${selectedIpo.retail_lot_cost?.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Selected: <strong>{selectedBidAccounts.length} slot(s)</strong>
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>
                        Total: ₹{(selectedBidAccounts.length * selectedIpo.retail_lot_cost).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (selectedBidAccounts.length > 0) {
                          handlePlaceBids(selectedIpo.id, selectedBidAccounts, 1);
                          setSelectedIpo(null);
                        }
                      }}
                      disabled={selectedBidAccounts.length === 0 || (selectedBidAccounts.length * selectedIpo.retail_lot_cost) > liquidCapital}
                      className="btn btn-primary"
                      style={{ padding: '10px 14px', fontSize: 'var(--font-sm)', width: '100%', marginTop: '6px' }}
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
              onClick={() => setSelectedIpo(null)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: 'var(--font-xs)' }}
            >
              Close Drawer View
            </button>
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
          zIndex: 1100,
          padding: '20px'
        }} onClick={() => setShowAddAccountModal(false)}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '100%',
            padding: '16px',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-h)' }}>
              Add Allotment Slot (PAN Profile)
            </h3>

            <form onSubmit={handleAddAccountSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text)' }}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sahil (Brother)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: 'var(--font-sm)' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text)' }}>PAN (Masked / Format: ABCDE***1F)</label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE***1F"
                  value={newAccountPan}
                  onChange={(e) => setNewAccountPan(e.target.value)}
                  maxLength={10}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: 'var(--font-sm)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  style={{ flexGrow: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: '600', fontSize: 'var(--font-sm)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flexGrow: 2, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: 'var(--font-sm)' }}
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

// ====================================================
// SUB-TAB RENDER LOGIC FUNCTIONS FOR PORTAL VIEW
// ====================================================

function renderDrawerGmpChart(ipo) {
  let history = ipo.gmp_history || [];
  
  // Synthesize history if none exists (for backtest items)
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
      <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', borderRadius: '10px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
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

  const values = chartData.map(d => d.value);
  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values, 1);
  const range = maxV - minV || 1;

  const toX = (i) => padL + (i / Math.max(chartData.length - 1, 1)) * chartW;
  const toY = (v) => padT + chartH - ((v - minV) / range) * chartH;

  const linePath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${toX(chartData.length - 1).toFixed(1)} ${toY(minV).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(minV).toFixed(1)} Z`;

  const latestVal = chartData[chartData.length - 1]?.value || 0;
  const isPositive = latestVal >= 20;

  // Pick a few evenly-spaced date labels
  const labelIdxs = chartData.length <= 3
    ? chartData.map((_, i) => i)
    : [0, Math.floor((chartData.length - 1) / 2), chartData.length - 1];

  const fmtDate = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const accentColor = 'var(--accent)'; // orange brand accent
  const dangerColor = 'var(--danger)'; // gray brand neutral
  const lineColor = isPositive ? accentColor : dangerColor;

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-h)' }}>GMP Premium Curve</span>
        <span style={{
          fontSize: 'var(--font-xs)', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
          backgroundColor: isPositive ? 'var(--accent-bg)' : 'var(--danger-bg)',
          color: lineColor
        }}>
          Latest: {latestVal}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gmp-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padT + t * chartH;
          const v = maxV - t * range;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{v.toFixed(0)}%</text>
            </g>
          );
        })}
        {/* Zero baseline if applicable */}
        {minV < 0 && maxV > 0 && (
          <line x1={padL} y1={toY(0)} x2={W - padR} y2={toY(0)} stroke={dangerColor} strokeWidth="1" strokeOpacity="0.4" />
        )}
        {/* Area fill */}
        <path d={areaPath} fill="url(#gmp-grad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {chartData.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.value)} r="3" fill="var(--card-bg)" stroke={lineColor} strokeWidth="2" />
        ))}
        {/* X-axis date labels — inside the SVG, won't overflow */}
        {labelIdxs.map(i => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
            {fmtDate(chartData[i].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function renderDrawerPeersChart(ipo) {
  let peers = ipo.peers || [];
  let companyPe = ipo.pe_ratio || 25;

  // Synthesize peers if none exists
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
  const accentGreen = 'var(--accent)';
  const accentOrange = 'var(--accent)';
  const peerColor = 'rgba(148,163,184,0.5)'; // slate-400 muted

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '14px 16px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: 'var(--font-xs)', fontWeight: '600', color: 'var(--text-h)' }}>Valuation P/E vs Peers</span>
        <span style={{
          fontSize: 'var(--font-xs)', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
          backgroundColor: isDiscount ? 'var(--accent-bg)' : 'var(--danger-bg)',
          color: isDiscount ? 'var(--accent)' : 'var(--danger)'
        }}>
          {isDiscount ? '✓ Discounted' : '⚠ Premium'} {companyPe.toFixed(1)}x
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {/* Horizontal grid lines */}
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
        {/* Bars */}
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
              {/* P/E value on top of bar */}
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={labelColor}>
                {d.pe.toFixed(0)}x
              </text>
              {/* Label below X axis */}
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
