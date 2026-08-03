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

  // Active IPOs State
  const [ipos, setIpos] = useState([]);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ipo_view_mode') || 'grid');
  const [lastRefreshedDate, setLastRefreshedDate] = useState(() => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' });
  });

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
        padding: '24px',
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
                  IPO Investment Tool
                </h1>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Systematic Listing Gain Engine
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              An algorithmic analyzer that strips emotion from IPO bidding in India. By tracking real-time QIB/retail subscriptions, GMP premium curves, and promoters' post-IPO stakes, the engine provides clear YES/NO investment signals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>8 strict quantitative rules</strong> evaluating demand, metrics, and anchors.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Multi-PAN Account Management</strong> to optimize retail allotment odds.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
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
            padding: '40px 32px',
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
                  style={{ flexGrow: 1, paddingBottom: '12px', border: 'none', background: 'none', color: authMode === 'login' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: authMode === 'login' ? '2px solid var(--accent)' : 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{ flexGrow: 1, paddingBottom: '12px', border: 'none', background: 'none', color: authMode === 'signup' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: authMode === 'signup' ? '2px solid var(--accent)' : 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
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
                    style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(139, 130, 115, 0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-h)', fontSize: '13px' }}
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(139, 130, 115, 0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-h)', fontSize: '13px' }}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(139, 130, 115, 0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-h)', fontSize: '13px' }}
                  required
                />

                {authError && <div style={{ fontSize: '12px', color: 'var(--error)' }}>{authError}</div>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary"
                  style={{
                    padding: '12px',
                    borderRadius: '999px',
                    fontSize: '14px',
                    fontWeight: '700',
                    width: '100%',
                    opacity: authLoading ? 0.6 : 1
                  }}
                >
                  {authLoading ? 'Authorizing...' : authMode === 'login' ? 'Sign In Securely' : 'Register Account'}
                </button>
              </form>
            </div>

            {/* Guest Access — name entry */}
            <div style={{ borderTop: '1px dashed var(--border-strong)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px' }}>
                  Guest Access
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
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
                    borderRadius: '14px',
                    backgroundColor: 'rgba(139, 130, 115, 0.04)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-h)',
                    fontSize: '13px'
                  }}
                />
                <button
                  type="submit"
                  disabled={guestLoading || !guestName.trim()}
                  className="btn btn-primary"
                  style={{ padding: '11px 20px', borderRadius: '14px', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  {guestLoading ? 'Entering...' : 'Enter →'}
                </button>
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
    const biddingIpos = ipos.filter(i => i.status === 'bidding');
    const upcomingIpos = ipos.filter(i => i.status === 'upcoming');
    const totalBids = userApplications.length;
    const allottedBids = userApplications.filter(a => a.status === 'ALLOTTED').length;
    const refundedBids = userApplications.filter(a => a.status === 'REFUNDED').length;
    const winRate = (allottedBids + refundedBids) > 0 ? Math.round((allottedBids / (allottedBids + refundedBids)) * 100) : 0;
    const totalRealizedProfit = userApplications
      .filter(a => a.status === 'ALLOTTED')
      .reduce((sum, a) => sum + parseFloat(a.listing_profit_rs || 0), 0);

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Welcome Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>
              Welcome back, {userProfile?.display_name || 'Investor'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Here is the executive summary of your family IPO investment portal today.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--success)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '8px 16px', borderRadius: '20px', fontWeight: '600' }}>
            <Sparkles size={14} /> Live Workspace Sync
          </div>
        </div>

        {/* Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="premium-card metric-card">
            <span className="metric-card-label">Active / Ongoing IPOs</span>
            <div className="metric-card-value">{biddingIpos.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IPOs open for bidding today</span>
          </div>

          <div className="premium-card metric-card">
            <span className="metric-card-label">Upcoming IPOs</span>
            <div className="metric-card-value">{upcomingIpos.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opening in next 7 days</span>
          </div>

          <div className="premium-card metric-card">
            <span className="metric-card-label">Total Invested Bids</span>
            <div className="metric-card-value">{totalBids}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bids placed across all PAN profiles</span>
          </div>

          <div className="premium-card metric-card">
            <span className="metric-card-label">Realized Profit</span>
            <div className="metric-card-value" style={{ color: 'var(--success)' }}>
              ₹{totalRealizedProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>Listing morning gains harvested</span>
          </div>
        </div>

        {/* Charts and Details Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Cumulative Profit Chart */}
          {renderDashboardCharts()}

          {/* Win Rate circular gauge */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allotment Win Rate</h3>
            
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--success)" strokeWidth="10" 
                  strokeDasharray="314.16" 
                  strokeDashoffset={314.16 - (314.16 * winRate) / 100} 
                  strokeLinecap="round" 
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)' }}>{winRate}%</span>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Allotted</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--success)', fontWeight: '700' }}>{allottedBids}</span> Allotted
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--border)' }}></div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{refundedBids}</span> Refunded
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Budget & Allocation Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
          {/* Capital allocation summary */}
          <div className="premium-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Family Capital Pool</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px' }}>Total Capital Pool</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-h)' }}>₹{capital.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px' }}>ASBA Blocked Funds</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--warning)' }}>₹{totalBlocked.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Available Liquid Cash</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--success)' }}>₹{liquidCapital.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ width: `${(liquidCapital / capital) * 100}%`, backgroundColor: 'var(--success)' }}></div>
              <div style={{ width: `${(totalBlocked / capital) * 100}%`, backgroundColor: 'var(--warning)' }}></div>
            </div>
          </div>

          {/* Active bids checklist logs */}
          <div className="premium-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Active Bids Checklist</h3>
            {userApplications.filter(a => a.status === 'PENDING').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active ASBA blocks found. Start bidding in the Active Tracker!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                {userApplications.filter(a => a.status === 'PENDING').map(app => {
                  const ipo = ipos.find(i => i.id === app.ipo_id);
                  const account = userAccounts.find(acc => acc.id === app.account_id);
                  if (!ipo || !account) return null;
                  
                  return (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}>
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
  };

  const renderDashboardCharts = () => {
    const resolvedBids = [...userApplications]
      .filter(a => a.status !== 'PENDING')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let cumulative = 0;
    const points = resolvedBids.map((bid, idx) => {
      if (bid.status === 'ALLOTTED') {
        cumulative += parseFloat(bid.listing_profit_rs || 0);
      }
      let d = bid.created_at ? new Date(bid.created_at) : new Date();
      if (isNaN(d.getTime())) {
        d = new Date();
      }
      // Add slight offset for sequential ordering in case dates are identical
      d = new Date(d.getTime() + idx * 10 * 60 * 1000);
      return { 
        date: d,
        value: cumulative
      };
    });

    if (points.length === 0) {
      return (
        <div className="premium-card" style={{ padding: '24px', flexGrow: 1 }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Cumulative Gains Trajectory</h3>
          <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px dashed var(--border-strong)', color: 'var(--text-muted)', fontSize: '12px' }}>
            Cumulative listing profits will display here. Place bids and declare allotment results in the Rotator!
          </div>
        </div>
      );
    }

    return (
      <div className="premium-card" style={{ padding: '24px', flexGrow: 1, minHeight: '260px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 16px 0' }}>Cumulative Gains Trajectory</h3>
        <div style={{ height: '180px' }}>
          <AreaChart data={points}>
            <Grid horizontal />
            <Area dataKey="value" fill="var(--accent)" fillOpacity={0.15} stroke="var(--accent)" strokeWidth={2.5} />
            <XAxis />
            <ChartTooltip />
          </AreaChart>
        </div>
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
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {title} <span className="badge badge-neutral">{list.length}</span>
        </h3>
        {list.length === 0 ? (
          <div style={{ padding: '20px', border: '1px dashed var(--border-strong)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
            {emptyMsg}
          </div>
        ) : viewMode === 'list' ? (
          /* Sleek Table List View */
          <div className="premium-card" style={{ padding: '0px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.015)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Company</th>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>GMP Premium</th>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Subscription</th>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Issue Size</th>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Lot Cost</th>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Closing Date</th>
                    <th style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--text-h)' }}>Signal</th>
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
                          <div style={{ fontWeight: '800', color: 'var(--text-h)' }}>{ipo.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Symbol: {ipo.symbol}</div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.gmp_pct}%
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: ipo.total_sub >= 30 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.total_sub}x
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
                            fontSize: '11px',
                            fontWeight: '800',
                            color: ipo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            backgroundColor: ipo.decision === 'YES' ? 'var(--accent-bg)' : 'var(--danger-bg)',
                            borderRadius: '12px',
                            border: ipo.decision === 'YES' ? '1px solid var(--accent-border)' : '1px solid var(--danger-border)'
                          }}>
                            {ipo.decision === 'YES' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {ipo.decision}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
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
                    padding: '24px',
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
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> Closes {dateStr}
                      </span>
                    </div>
                    {ipo.is_fallback && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: 'rgba(251, 146, 60, 0.12)',
                        border: '1px solid rgba(251, 146, 60, 0.4)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        marginBottom: '8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#fb923c',
                        letterSpacing: '0.02em'
                      }}>
                        ⚠️ Simulated / Estimated Data — Not Live
                      </div>
                    )}

                    <h4 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-h)', lineHeight: '1.2' }}>
                      {ipo.name}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                      Symbol: <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-h)', fontWeight: '600' }}>{ipo.symbol}</span>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '10px 0', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>GMP Premium</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: ipo.gmp_pct >= 20 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.gmp_pct}%
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Subscription</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: ipo.total_sub >= 30 ? 'var(--accent)' : 'var(--text-h)' }}>
                          {ipo.total_sub}x
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Issue Size</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)' }}>
                          ₹{ipo.issue_size_cr} Cr
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Lot Cost</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)' }}>
                          ₹{ipo.retail_lot_cost?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Signal:</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        color: ipo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {ipo.decision === 'YES' ? <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} /> : <XCircle size={12} style={{ color: 'var(--danger)' }} />}
                        {ipo.decision}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>
                      {ipo.score}/8 passed <ChevronRight size={12} />
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
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>
              Ongoing & Upcoming IPOs
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Track demand multiples and GMP curves daily. Yes signals are highlighted on closing-day bids.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

            <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.03)', padding: '3px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => { setViewMode('grid'); localStorage.setItem('ipo_view_mode', 'grid'); }}
                style={{
                  padding: '6px 12px',
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
                  padding: '6px 12px',
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

        {dbLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
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
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Family sharing section */}
        <div className="premium-card" style={{ padding: '24px' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--accent)' }} /> Investment Group Sharing & Collaboration
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Share PAN cards, trading capitals, and ASBA bid logs in real-time. Invite group members to manage bids together.
            </p>
          </div>

          {!familyGroup ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Create Group Form */}
              <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid var(--border)', paddingRight: '32px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)', margin: 0 }}>Create Investment Group</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Prabhat Group Pool"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Group</button>
              </form>

              {/* Join Group with Code Form */}
              <form onSubmit={handleJoinWithCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)', margin: 0 }}>Join with Invitation Code</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>8-Character Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AB12CD34"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    className="input-field"
                    maxLength={8}
                    required
                  />
                </div>
                <button type="submit" disabled={joinLoading} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {joinLoading ? 'Joining...' : 'Join Group'}
                </button>
                {joinError && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{joinError}</div>}
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'var(--bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Group</span>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-h)', margin: 0 }}>{familyGroup.group_name}</h4>
                </div>
                
                {/* Invite Code Display Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--card-bg)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-strong)' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>Invitation Code</span>
                    <span style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--accent)' }}>
                      {familyGroup.invite_code || 'SANDBOX8'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(familyGroup.invite_code || 'SANDBOX8');
                      alert("Invitation code copied to clipboard!");
                    }}
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                  >
                    Copy
                  </button>
                </div>

                <button onClick={handleLeaveGroup} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>Leave Group</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Invite form */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '10px' }}>Invite Group Member by Email</h4>
                  <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-field"
                      style={{ fontSize: '12px' }}
                      required
                    />
                    <button type="submit" disabled={inviteLoading} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                      {inviteLoading ? 'Inviting...' : 'Invite'}
                    </button>
                  </form>
                  {inviteError && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '6px' }}>{inviteError}</div>}
                  {inviteSuccess && <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '6px' }}>Invitation sent successfully! Member added.</div>}
                </div>

                {/* Member list */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '10px' }}>Joined Group Members ({groupMembers.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                    {groupMembers.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', backgroundColor: 'var(--bg)' }}>
                        <div>
                          <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{m.user_profiles?.display_name || 'Guest User'}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>{m.user_profiles?.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${m.role === 'admin' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '9px' }}>
                            {m.role}
                          </span>
                          {familyGroup.creator_id !== m.user_id && m.user_id !== (session.user?.id || session.id) && (
                            <button onClick={() => handleRemoveMember(m.user_id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', padding: '2px' }}>&times;</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* Wallet Summary & PANs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Wallet summary */}
            <div className="premium-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={16} style={{ color: 'var(--accent)' }} /> Family Budget Pool
                </h3>
                <button
                  onClick={handleResetCapital}
                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Clear History
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Trading Capital</span>
                <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-h)', letterSpacing: '-1px' }}>
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

            {/* PAN card slots */}
            <div className="premium-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} style={{ color: 'var(--accent)' }} /> Allotment Slots (PANs)
                </h3>
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="btn btn-primary"
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                Deploying 1 lot across multiple unique family profiles maximizes allotment odds.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {familyGroup ? (
                  groupMembers.flatMap(m => {
                    const memberAccounts = userAccounts.filter(acc => acc.user_id === m.user_id);
                    if (memberAccounts.length > 0) {
                      return memberAccounts.map(account => {
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
                              padding: '10px 12px',
                              border: '1px solid var(--border)',
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
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Blocked</span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: activeBlocked > 0 ? 'var(--warning)' : 'var(--text-h)' }}>
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
                      });
                    } else {
                      // Render placeholder for group member without PAN configured
                      return (
                        <div
                          key={`placeholder-${m.user_id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            border: '1px dashed var(--border-strong)',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(0,0,0,0.01)'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                              {m.user_profiles?.display_name || 'Group Member'} (Primary)
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: '600' }}>
                              ⚠️ PAN Setup Pending
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Awaiting Setup
                          </span>
                        </div>
                      );
                    }
                  })
                ) : (
                  userAccounts
                    .filter(acc => acc.user_id === (session.user?.id || session.id))
                    .map(account => {
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
                            padding: '10px 12px',
                            border: '1px solid var(--border)',
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
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Blocked</span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: activeBlocked > 0 ? 'var(--warning)' : 'var(--text-h)' }}>
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
                    })
                )}
              </div>
            </div>

          </div>

          {/* Timelines and realized gains */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Refunds and listing timelines */}
            <div className="premium-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} /> ASBA Refund & Listing Schedule
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {userApplications.filter(app => app.status === 'PENDING').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border-strong)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No active ASBA blocks. Deploy bids in the Tracker!
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
                          padding: '12px 14px',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          backgroundColor: 'var(--accent-bg)'
                        }}
                      >
                        <div style={{ minWidth: '95px' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold' }}>Allotment Date</span>
                          <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-h)' }}>
                            {ipo.allotment_date ? new Date(ipo.allotment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, paddingLeft: '14px', borderLeft: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '12px' }}>{ipo.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            PAN: <strong>{account.account_holder_name}</strong> • Bidding ₹{app.bid_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleResolveApplication(app.id, true)}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                          >
                            Allotted
                          </button>
                          <button
                            onClick={() => handleResolveApplication(app.id, false)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                          >
                            Refund
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Realized gains logs list */}
              <h3 style={{ fontSize: '14px', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: 'var(--text-h)' }}>
                Realized Gains Log
              </h3>
              {userApplications.filter(app => app.status !== 'PENDING').length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No completed allotments or refunds recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {userApplications.filter(app => app.status !== 'PENDING').map(app => {
                    const ipo = ipos.find(i => i.id === app.ipo_id);
                    const account = userAccounts.find(a => a.id === app.account_id);
                    if (!ipo || !account) return null;

                    return (
                      <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: 'var(--text-h)', display: 'block' }}>
                            {ipo.name}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            Slot: {account.account_holder_name} • Status: {app.status}
                          </span>
                        </div>
                        <span style={{ fontWeight: '700', color: app.status === 'ALLOTTED' ? 'var(--success)' : 'var(--text-muted)' }}>
                          {app.status === 'ALLOTTED' ? `+ ₹${parseFloat(app.listing_profit_rs).toFixed(0)}` : 'Refunded'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderBacktestTab = () => {
    const dynamicRes = runDynamicBacktest();
    const finalCapital = dynamicRes.finalCapital;
    const yesCount = dynamicRes.yesCount;
    const originalStats = backtestData?.stats || {};

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="premium-card">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
              Historical Performance Simulator (2024 - 2026)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Adjust filtering thresholds to see how systematic decisions optimize returns vs. a blind allocation lottery.
            </p>
          </div>

          {/* Interactive sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
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
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filters out listings with weak demand premiums.</span>
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
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filters out listings with weak closing-day velocity.</span>
            </div>
          </div>

          {/* Simulation outputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Simulation Yield</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', margin: '4px 0' }}>
                ₹{finalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '600' }}>
                + {((finalCapital - 100000) / 1000).toFixed(1)}% Listing Returns
              </span>
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Blind Strategy Yield</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: originalStats.blind_final_capital < 100000 ? 'var(--danger)' : 'var(--text-h)', margin: '4px 0' }}>
                ₹{originalStats.blind_final_capital?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '₹99,228'}
              </div>
              <span style={{ fontSize: '11px', color: originalStats.blind_final_capital < 100000 ? 'var(--danger)' : 'var(--text-muted)' }}>
                Bidding blind lots to all listings
              </span>
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Bids Passed / Evaluated</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-h)', margin: '4px 0' }}>
                {yesCount} / {originalStats.total_evaluated || 21}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Deploying cash only on high probabilities
              </span>
            </div>
          </div>

          {/* Simulation logs table */}
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '12px' }}>
            Backtesting Execution Trajectory
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-h)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Company (Symbol)</th>
                  <th style={{ padding: '10px' }}>Listing Gains %</th>
                  <th style={{ padding: '10px' }}>Allotment Prob.</th>
                  <th style={{ padding: '10px' }}>Decision</th>
                  <th style={{ padding: '10px' }}>Simulated Outcome (per lot)</th>
                </tr>
              </thead>
              <tbody>
                {dynamicRes.history.map((h, idx) => {
                  const item = backtestData.stats.detailed_results[idx];
                  const fmtDate = (dStr) => dStr ? new Date(dStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'TBA';
                  
                  // Color codes for avoided outcomes
                  const isLossAvoided = h.decision === 'NO' && h.potentialOutcome < 0;
                  const avoidedText = h.potentialOutcome < 0 
                    ? `Avoided loss: -₹${Math.round(Math.abs(h.potentialOutcome)).toLocaleString('en-IN')}`
                    : `Avoided gain: +₹${Math.round(h.potentialOutcome).toLocaleString('en-IN')}`;

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedIpo(item)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.015)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    >
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{h.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Symbol: {item.symbol} • Bidding: {fmtDate(item.open_date)} • Listed: {fmtDate(item.listing_date)}
                        </div>
                      </td>
                      <td style={{ padding: '10px', fontWeight: '700', color: item.listing_gains_pct > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {item.listing_gains_pct > 0 ? '+' : ''}{item.listing_gains_pct}%
                      </td>
                      <td style={{ padding: '10px' }}>{h.probPct}%</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${h.decision === 'YES' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '9px' }}>
                          {h.decision}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        {h.decision === 'YES' ? (
                          <span style={{ fontWeight: '700', color: h.potentialOutcome > 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {h.potentialOutcome > 0 ? '+' : ''}₹{Math.round(h.potentialOutcome).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: isLossAvoided ? 'var(--success)' : 'var(--text-muted)', fontWeight: isLossAvoided ? '700' : 'normal' }}>
                            ₹0 <span style={{ fontSize: '9.5px', opacity: 0.8 }}>({avoidedText})</span>
                          </span>
                        )}
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
    const FormulaCard = ({ ruleNum, name, expr, parameters }) => (
      <div style={{
        padding: '18px',
        border: '1px solid var(--border-strong)',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--bg), rgba(255, 255, 255, 0.02))',
        boxShadow: 'var(--shadow-sm)',
        margin: '16px 0 20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Rule {ruleNum} Formula
          </span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-h)' }}>{name}</span>
        </div>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--text-h)',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          overflowX: 'auto'
        }}>
          {expr}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {parameters.map((p, idx) => (
            <div key={idx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{p.label}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>{p.val}</span>
            </div>
          ))}
        </div>
      </div>
    );

    const renderWelcomeDoc = () => (
      <div>
        <h1>IPO Investment Tool Quickstart</h1>
        <p>
          Welcome to the <strong>IPO Investment Tool Guide</strong>. This programmatic system is built strictly to harvest <strong>listing-day gains</strong> on Mainboard IPO allocations in the Indian stock market. It strips emotion and hype from investing by enforcing a data-driven <strong>8-metric filter</strong>.
        </p>
        <div style={{ padding: '16px', border: '1px solid var(--accent-border)', borderRadius: '12px', backgroundColor: 'var(--accent-bg)', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Sparkles size={14} /> The Capital Rotation Cycle</h4>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>PAN Slot Seeding:</strong> Go to the Family Rotator tab and configure family PAN allotment slots (spouse, parent, sibling, etc.).</li>
            <li><strong>Bidding Watch:</strong> Monitor the Active Tracker for listings. The algorithm scores listings daily out of 8 rules.</li>
            <li><strong>Bidding Day Allocation:</strong> On the closing day (typically by 2 PM), check the YES/NO signal. If YES, deploy 1 retail lot block (approx. ₹14,000 to ₹15,000) on each family PAN account slot.</li>
            <li><strong>Listing Morning Harvest:</strong> If allotted, sell 100% of shares on listing morning (9:45 AM) to lock in listing profits. If refunded, the bank unblocks the funds instantly to reuse in the next active IPO bidding cycle.</li>
          </ol>
        </div>
        <h2>How multi-PAN profiles work</h2>
        <p>
          IPO allotments in highly oversubscribed retail categories are decided via draw of lots. Applying for multiple lots on a single PAN card profile does NOT increase allotment chances. 
          To maximize allocation probabilities, you must apply for <strong>1 lot across multiple unique PAN card slots</strong> (e.g. spouse, brother, self) rather than multiple lots under a single profile.
        </p>
      </div>
    );

    const renderMandatoryGatesDoc = () => (
      <div>
        <h1>Mandatory Gates: Rules 1 & 2</h1>
        <p>
          IPOs must pass both Mandatory Gates to receive a <strong>YES</strong> recommendation. Failing either gate triggers an automatic <strong>NO</strong> recommendation, regardless of the overall score.
        </p>
        
        <h2>Rule 1: Real-Time Demand (Gate 1)</h2>
        <FormulaCard 
          ruleNum="1" 
          name="Real-Time Demand (Gate 1)" 
          expr="Total Subscription >= 30x OR QIB Subscription >= 50x" 
          parameters={[
            { label: 'Minimum Total Subscription Threshold', val: '30.0x Multiple' },
            { label: 'Minimum Qualified Institutional Buyers (QIB) Subscription', val: '50.0x Multiple' }
          ]} 
        />
        <p>
          Backtesting proves that institutional and retail bid velocity is the single strongest indicator of listing-day morning buying surges. Strong oversubscriptions create demand FOMO, pushing listing prices up on listing morning.
        </p>

        <h2>Rule 2: Sentiment Anchor (Gate 2)</h2>
        <FormulaCard 
          ruleNum="2" 
          name="Sentiment Anchor (Gate 2)" 
          expr="Implied Grey Market Premium (GMP) >= 20.0%" 
          parameters={[
            { label: 'Minimum Grey Market Premium (GMP)', val: '20.0% Premium' },
            { label: 'Informal Market Demand Index', val: 'Premium above IPO issue price' }
          ]} 
        />
        <p>
          Grey Market Premium represents informal trading rates before listing. A premium above 20% guarantees robust market sentiments and buffers against sudden listing day selloffs or secondary market volatilities.
        </p>
      </div>
    );

    const renderValuationStructureDoc = () => (
      <div>
        <h1>Valuation Buffer & Capital Structure: Rules 3 & 4</h1>
        
        <h2>Rule 3: Capital Structure (OFS Filter)</h2>
        <FormulaCard 
          ruleNum="3" 
          name="Capital Structure (OFS Filter)" 
          expr="Offer For Sale (OFS) component < 50.0%" 
          parameters={[
            { label: 'Maximum Promoters / VCs Exit Share (OFS)', val: '50.0% of total issue size' },
            { label: 'Minimum Corporate Growth Funding (Fresh Issue)', val: '50.0% of total issue size' }
          ]} 
        />
        <p>
          An Offer For Sale means existing promoters are selling their stakes, pocketing the cash. Conversely, a Fresh Issue means the cash goes into the company's bank accounts to fund capital expenditures. Keeping OFS below 50% ensures that more than half of the raised IPO cash enters the firm to finance actual expansion rather than facilitating early promoter exits.
        </p>

        <h2>Rule 4: Valuation Buffer (P/E Discount)</h2>
        <FormulaCard 
          ruleNum="4" 
          name="Valuation Buffer (P/E Discount)" 
          expr="IPO P/E Ratio <= Peer Median P/E * 0.85" 
          parameters={[
            { label: 'Required Valuation Discount', val: '>= 15.0% Discount' },
            { label: 'Benchmark Competitor PE comparison', val: 'Listed sector peers median PE' }
          ]} 
        />
        <p>
          Speculative pricing can lead to overpriced listings that crash on listing morning (e.g. Paytm). Demanding a minimum 15% valuation discount relative to listed sector competitors creates a margin of safety for retail buyers.
        </p>
      </div>
    );

    const renderBackingMarginsDoc = () => (
      <div>
        <h1>Backing & Margins: Rules 5 & 6</h1>
        
        <h2>Rule 5: Institutional Backing (Anchor Book Quality)</h2>
        <FormulaCard 
          ruleNum="5" 
          name="Institutional Backing (Anchor Book)" 
          expr="Anchor Quality Score >= 70 / 100" 
          parameters={[
            { label: 'Minimum Anchor Book Score', val: '70 / 100' },
            { label: 'Blue-Chip Institution presence', val: 'Mutual Funds, tier-1 Sovereign wealth funds' }
          ]} 
        />
        <p>
          Anchor investors bid on the day before the IPO opens. The presence of reputable mutual funds (like SBI MF, HDFC MF, ICICI Prudential) or marquee global sovereign funds indicates thorough institutional due diligence, giving retail buyers peace of mind.
        </p>

        <h2>Rule 6: Fundamental Reality (PAT Margins)</h2>
        <FormulaCard 
          ruleNum="6" 
          name="Fundamental Reality (PAT Margins)" 
          expr="PAT Margins (T-3 to T-1) > 0 AND Growing" 
          parameters={[
            { label: 'Minimum Margin Requirement', val: 'Positive margins (no loss-making entries)' },
            { label: 'Trend Requirement', val: 'Increasing over last 3 consecutive fiscal years' }
          ]} 
        />
        <p>
          Many modern tech IPOs are loss-making and burn cash. Antigravity protects your capital pool by auditing margins: PAT margins must be positive and growing year-over-year, filtering out cash-burning entities.
        </p>
      </div>
    );

    const renderSizeSkinDoc = () => (
      <div>
        <h1>Size & Promoter Skin: Rules 7 & 8</h1>
        
        <h2>Rule 7: Issue Size Cap</h2>
        <FormulaCard 
          ruleNum="7" 
          name="Issue Size Cap" 
          expr="Total Issue Size < ₹3,000 Crore" 
          parameters={[
            { label: 'Maximum Gross Float Threshold', val: '₹3,000 Crore Cap' },
            { label: 'Retail Absorption Index', val: 'Prevents massive float stagnation' }
          ]} 
        />
        <p>
          Mega-sized listings (like Hyundai Motor India, LIC, Paytm) raise huge amounts of capital. These large float volumes require massive institutional buying to drive prices up, resulting in stagnant listing-day pops. Smaller floats (under ₹3,000 Cr) are easily absorbed by retail and local institutional liquidity, enabling sharp listing morning pops.
        </p>

        <h2>Rule 8: Skin in the Game</h2>
        <FormulaCard 
          ruleNum="8" 
          name="Skin in the Game" 
          expr="Post-IPO Promoter Holding >= 50.0%" 
          parameters={[
            { label: 'Minimum Promoter Post-IPO Stake', val: '50.0% Stake' },
            { label: 'Alignment Index', val: 'Ensures promoter interests match public shareholders' }
          ]} 
        />
        <p>
          A high post-IPO promoter stake guarantees that promoters stay aligned with public shareholders and prevents aggressive dumping of shares after lock-in periods expire.
        </p>
      </div>
    );

    const renderSmeDoc = () => (
      <div>
        <h1>Bidding Strategies: Mainboard vs. SME</h1>
        <p>
          Indian stock exchanges host two classes of IPOs: <strong>Mainboard IPOs</strong> and <strong>SME (Small and Medium Enterprises) IPOs</strong>.
        </p>
        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left', fontWeight: 'bold' }}>
                <th style={{ padding: '8px' }}>Parameter</th>
                <th style={{ padding: '8px' }}>Mainboard IPO</th>
                <th style={{ padding: '8px' }}>SME IPO</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Min. Lot Cost</td>
                <td style={{ padding: '8px' }}>₹14,000 to ₹15,000</td>
                <td style={{ padding: '8px' }}>₹1,00,000 to ₹1,40,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Issue Size</td>
                <td style={{ padding: '8px' }}>&gt; ₹250 Crore</td>
                <td style={{ padding: '8px' }}>₹10 Crore to ₹100 Crore</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Liquidity Risk</td>
                <td style={{ padding: '8px', color: 'var(--success)', fontWeight: '600' }}>Low (Active secondary trade)</td>
                <td style={{ padding: '8px', color: 'var(--danger)', fontWeight: '600' }}>High (Traded only in lots)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Because SME IPOs require a minimum block of over ₹1 Lakh per bid, they do not facilitate easy capital rotation inside a ₹1 Lakh budget pool, and present extremely high liquidity risks. Therefore, <strong>the IPO Investment Tool focuses strictly on Mainboard IPOs</strong> where listing-day volatility can be systematically harvested.
        </p>
      </div>
    );

    return (
      <div className="docs-layout animate-fade-in">
        <aside className="docs-sidebar">
          <span className="docs-sidebar-title">Getting Started</span>
          <button className={`docs-nav-link ${docSection === 'welcome' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('welcome')}>Quickstart Guide</button>
          
          <span className="docs-sidebar-title">The 8 Metrics</span>
          <button className={`docs-nav-link ${docSection === 'mandatory-gates' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('mandatory-gates')}>1 & 2: Mandatory Gates</button>
          <button className={`docs-nav-link ${docSection === 'valuation-structure' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('valuation-structure')}>3 & 4: Valuation & OFS</button>
          <button className={`docs-nav-link ${docSection === 'backing-margins' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('backing-margins')}>5 & 6: Backing & Margins</button>
          <button className={`docs-nav-link ${docSection === 'size-skin' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('size-skin')}>7 & 8: Size & Stake</button>

          <span className="docs-sidebar-title">Strategies</span>
          <button className={`docs-nav-link ${docSection === 'sme-bidding' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('sme-bidding')}>Mainboard vs SME</button>
        </aside>

        <div className="docs-content">
          {docSection === 'welcome' && renderWelcomeDoc()}
          {docSection === 'mandatory-gates' && renderMandatoryGatesDoc()}
          {docSection === 'valuation-structure' && renderValuationStructureDoc()}
          {docSection === 'backing-margins' && renderBackingMarginsDoc()}
          {docSection === 'size-skin' && renderSizeSkinDoc()}
          {docSection === 'sme-bidding' && renderSmeDoc()}
        </div>
      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ marginBottom: '10px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>
            User Settings & Profile
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Manage your personal profile, credentials, and collaborative family pools.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Profile details */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Personal Information</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Display Name</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    fontSize: '13px',
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={handleSaveDisplayName} 
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '8px' }}
                >
                  Save
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Email Address</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-h)' }}>{userProfile?.email || session?.user?.email || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Session Type</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--success)' }}>
                {isGuestMode ? 'Offline Simulation (Sandbox)' : 'Supabase Cloud Authenticated'}
              </span>
            </div>
          </div>

          {/* Group statistics */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Investment Group Details</h3>
            
            {familyGroup ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Group Name</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-h)' }}>{familyGroup.group_name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Shared PAN Slots</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)' }}>{userAccounts.length} slots</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Shared Group Members</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)' }}>{groupMembers.length} members</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                You are currently running a personal portfolio. Create an Investment Group in the Rotator tab to collaborate!
              </div>
            )}
          </div>
        </div>

        {/* Support educational guides row */}
        <div className="premium-card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 12px 0' }}>Help & Support</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Need help configuring Telegram alerts or banking ASBA blocks? Check our repository documentation or read the 8 Rules Guide.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setActiveTab('guide')} style={{ fontSize: '12px' }}>
              Read the Guides
            </button>
            <a href="https://github.com/Prabhat-12/ipo-investment-tool" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
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
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="sidebar">
        <div>
          {/* Brand header */}
          <div className="sidebar-brand">
            <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="sidebar-brand-name">IPO Investment Tool</h1>
              <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                {isGuestMode ? 'Offline Sandbox' : 'Cloud Connected'}
              </span>
            </div>
          </div>

          {/* Navigation vertical list */}
          <nav className="sidebar-menu">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'tracker', label: 'Active Tracker', icon: Calendar },
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
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-h)', fontWeight: 'bold', fontSize: '13px' }}>
              {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userProfile?.display_name || 'My Profile'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userProfile?.email || 'Settings & sharing'}
              </span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW PORTAL CONTENT SECTION */}
      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'tracker' && renderTrackerTab()}
        {activeTab === 'capital' && renderCapitalTab()}
        {activeTab === 'backtest' && renderBacktestTab()}
        {activeTab === 'guide' && renderGuideTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </main>

      {/* DETAIL SIDE PANEL DRAWER (SLIDE-OUT FROM FAR RIGHT) */}
      {selectedIpo && (
        <div className="drawer-backdrop" onClick={() => setSelectedIpo(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
                  {selectedIpo.name}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Symbol: <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{selectedIpo.symbol}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedIpo(null)}
                style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            {/* Recommendation badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: selectedIpo.decision === 'YES' ? 'var(--accent-bg)' : 'var(--danger-bg)',
              borderRadius: '16px',
              border: selectedIpo.decision === 'YES' ? '1px solid var(--accent-border)' : '1px solid var(--danger-border)',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: '800', color: selectedIpo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)', display: 'block', letterSpacing: '0.5px' }}>
                  Bidding Recommendation
                </span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: selectedIpo.decision === 'YES' ? 'var(--accent)' : 'var(--danger)' }}>
                  {selectedIpo.decision === 'YES' ? '✔ YES - DEPLOY ASBA' : '✖ NO - AVOID LISTING'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', display: 'block', lineHeight: '1' }}>
                  {selectedIpo.score}/8
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Rules</span>
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
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
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
            <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
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
                      borderRadius: '12px',
                      backgroundColor: rule.passed ? 'var(--accent-bg)' : 'transparent',
                      fontSize: '12px'
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
                          <span style={{ fontSize: '8px', fontWeight: '800', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
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
                <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                  Historical Financial Margins
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {selectedIpo.financials.map((f, idx) => (
                    <div key={idx} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--bg)' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold' }}>{f.fiscal_year}</span>
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
              <div style={{ padding: '14px', border: '1px solid var(--border-strong)', borderRadius: '12px', backgroundColor: 'var(--bg)', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', margin: '0 0 10px 0', color: 'var(--text-h)' }}>
                  Submit ASBA Application (UPI block)
                </h4>

                {userAccounts.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                    No active allotment PAN slots configured. Add account slots in the Family Rotator tab first!
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)' }}>Account PAN:</label>
                      <select
                        id="bid-slot-selector"
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-strong)', fontSize: '11px', flexGrow: 1, outline: 'none' }}
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
                      className="btn btn-primary"
                      style={{ padding: '8px 12px', fontSize: '11px', width: '100%' }}
                    >
                      Place Bid (Block ₹{selectedIpo.retail_lot_cost?.toLocaleString('en-IN')})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CTA action */}
            <button
              onClick={() => setSelectedIpo(null)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '12px' }}
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

  return (
    <div style={{
      backgroundColor: 'var(--bg)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-h)' }}>GMP Premium Curve</span>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '20px',
          backgroundColor: chartData[chartData.length - 1]?.value >= 20 ? 'var(--accent-bg)' : 'var(--danger-bg)',
          color: chartData[chartData.length - 1]?.value >= 20 ? 'var(--accent)' : 'var(--danger)'
        }}>
          Latest: {chartData[chartData.length - 1]?.value || 0}%
        </span>
      </div>
      <div style={{ height: '140px' }}>
        <AreaChart data={chartData}>
          <Grid horizontal />
          <Area dataKey="value" fill="var(--accent)" fillOpacity={0.15} stroke="var(--accent)" strokeWidth={2.5} />
          <XAxis />
          <ChartTooltip />
        </AreaChart>
      </div>
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

  return (
    <div style={{
      backgroundColor: 'var(--bg)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-h)' }}>Valuation P/E vs Peers</span>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '20px',
          backgroundColor: companyPe < chartData.slice(1).reduce((s,p)=>s+p.pe,0)/Math.max(1,chartData.length-1) ? 'var(--accent-bg)' : 'var(--danger-bg)',
          color: companyPe < chartData.slice(1).reduce((s,p)=>s+p.pe,0)/Math.max(1,chartData.length-1) ? 'var(--accent)' : 'var(--danger)'
        }}>
          P/E: {companyPe.toFixed(1)}x
        </span>
      </div>
      <div style={{ height: '140px' }}>
        <BarChart data={chartData}>
          <Grid horizontal />
          <Bar dataKey="pe" fill="var(--accent)" />
          <BarXAxis />
          <ChartTooltip />
        </BarChart>
      </div>
    </div>
  );
}
