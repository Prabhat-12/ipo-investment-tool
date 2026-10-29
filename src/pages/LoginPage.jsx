import React, { useState } from 'react';
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DivergenLogo } from '../components/ui/DivergenLogo';
import { supabase } from '../supabaseClient';

export default function LoginPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [guestName, setGuestName] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError(null);

    if (supabase) {
      try {
        if (authMode === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          toast.success("Welcome back! Signed in to Cloud Connected portal.");
          if (onLoginSuccess) {
            onLoginSuccess({ session: data.session, isGuestMode: false });
          }
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName }
            }
          });
          if (error) throw error;
          toast.success("Account created successfully! Please sign in with your credentials.");
          setAuthMode('login');
        }
      } catch (err) {
        setAuthError(err.message);
        toast.error("Authentication failed: " + err.message);
      }
    } else {
      setAuthError("Supabase client is offline. Please use Guest Access below.");
      toast.error("Supabase client is offline. Please use Guest Access below.");
    }
    setAuthLoading(false);
  };

  const handleGuestLogin = async (e) => {
    if (e) e.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    setGuestLoading(true);

    // Fire-and-forget: log guest visit to Supabase for telemetry
    if (supabase && typeof navigator !== 'undefined' && navigator.onLine !== false) {
      supabase
        .from('guest_visits')
        .insert({ name, visited_at: new Date().toISOString() })
        .then(() => {})
        .catch(() => {});
    }

    const guestId = `guest-${Date.now()}`;
    const guestSession = {
      id: guestId,
      display_name: name,
      user: {
        id: guestId,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@guest.local`
      }
    };

    toast("Entered Offline Sandbox mode", { icon: '🧪' });
    if (onLoginSuccess) {
      onLoginSuccess({ session: guestSession, isGuestMode: true });
    }
    setGuestLoading(false);
  };

  return (
    <main
      role="main"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(139,130,115,0.04), transparent 50%), radial-gradient(ellipse at bottom left, rgba(139,130,115,0.05), transparent 50%)',
        padding: '24px',
        color: 'var(--text)',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div className="login-grid" style={{ maxWidth: '960px', width: '100%' }}>
        {/* Branding & Value Propositions */}
        <div className="login-branding" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DivergenLogo 
            variant="login"
            subtitle="Systematic Listing Gain Engine"
          />

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            An algorithmic analyzer that strips emotion from IPO bidding in India. By tracking real-time QIB/retail subscriptions, GMP premium curves, and promoters' post-IPO stakes, Divergen delivers disciplined, quantitative YES/NO investment signals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>8 strict quantitative rules</strong> evaluating subscription momentum, valuation multiples, and institutional anchors.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Multi-PAN Account Management</strong> to systematically maximize retail allotment probability across family accounts.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Real-time Telemetry & Telegram Alerts</strong> delivering optimal bid timing notifications on Day 3 before market close.</span>
            </div>
          </div>
        </div>

        {/* Login / Guest Selector Card */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            backdropFilter: 'blur(16px)'
          }}
        >
          {/* Auth Tab Switching (Sign In / Create Account) */}
          <div>
            <div
              role="tablist"
              aria-label="Authentication Options"
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                marginBottom: '20px',
                paddingBottom: '2px'
              }}
            >
              <button
                role="tab"
                id="tab-signin"
                aria-selected={authMode === 'login'}
                aria-controls="panel-auth"
                type="button"
                onClick={() => setAuthMode('login')}
                style={{
                  flexGrow: 1,
                  paddingBottom: '12px',
                  border: 'none',
                  background: 'none',
                  color: authMode === 'login' ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: authMode === 'login' ? '2px solid var(--accent)' : 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Sign In
              </button>
              <button
                role="tab"
                id="tab-signup"
                aria-selected={authMode === 'signup'}
                aria-controls="panel-auth"
                type="button"
                onClick={() => setAuthMode('signup')}
                style={{
                  flexGrow: 1,
                  paddingBottom: '12px',
                  border: 'none',
                  background: 'none',
                  color: authMode === 'signup' ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: authMode === 'signup' ? '2px solid var(--accent)' : 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Create Account
              </button>
            </div>

            <form
              id="panel-auth"
              role="tabpanel"
              aria-labelledby={authMode === 'login' ? 'tab-signin' : 'tab-signup'}
              onSubmit={handleAuthSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {authMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="auth-display-name" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <input
                    id="auth-display-name"
                    name="displayName"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(139, 130, 115, 0.04)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-h)',
                      fontSize: '14px',
                      minHeight: '44px'
                    }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="auth-email" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(139, 130, 115, 0.04)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-h)',
                    fontSize: '14px',
                    minHeight: '44px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="auth-password" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(139, 130, 115, 0.04)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-h)',
                    fontSize: '14px',
                    minHeight: '44px'
                  }}
                  required
                />
              </div>

              {authError && (
                <div
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#ef4444',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)'
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn btn-primary"
                style={{
                  padding: '13px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: '700',
                  width: '100%',
                  opacity: authLoading ? 0.6 : 1,
                  minHeight: '44px',
                  cursor: authLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {authLoading ? 'Authorizing...' : authMode === 'login' ? 'Sign In Securely' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Guest Access Sandbox */}
          <div style={{ borderTop: '1px dashed var(--border-strong)', paddingTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px' }}>
                Guest Sandbox Access
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
              Want to test the platform instantly? Enter your name — no password or account setup required.
            </p>
            <form
              onSubmit={handleGuestLogin}
              style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}
            >
              <label htmlFor="guest-name-input" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Your Name for Guest Access
              </label>
              <input
                id="guest-name-input"
                type="text"
                placeholder="Enter your name..."
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
                  fontSize: '14px',
                  minHeight: '44px'
                }}
              />
              <button
                type="submit"
                disabled={guestLoading || !guestName.trim()}
                className="btn btn-primary"
                style={{
                  padding: '11px 22px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  minHeight: '44px'
                }}
              >
                {guestLoading ? 'Entering...' : 'Enter Sandbox →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
