import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SettingsPage({
  userProfile,
  session,
  isGuestMode,
  familyGroup,
  userAccounts = [],
  groupMembers = [],
  onLogout,
  onNavigateTab,
  onProfileUpdated
}) {
  const [displayName, setDisplayName] = useState(userProfile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.display_name) {
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    const userId = session?.user?.id || session?.id;

    if (supabase && !isGuestMode) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { display_name: displayName.trim() }
        });
        if (error) throw error;

        await supabase
          .from('user_profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', userId);

        if (onProfileUpdated) {
          onProfileUpdated({ display_name: displayName.trim() });
        }
        alert("Display name updated successfully!");
      } catch (err) {
        alert("Failed to update profile name: " + err.message);
      }
    } else {
      if (onProfileUpdated) {
        onProfileUpdated({ display_name: displayName.trim() });
      }
      alert("Display name updated (Sandbox Mode)!");
    }
    setIsSaving(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.5px' }}>
          User Settings & Profile
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Manage your personal profile, credentials, and collaborative family pools.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Personal Details Card */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Personal Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="settings-display-name" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Display Name
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="settings-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  fontSize: '13px',
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.01)',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
              <button 
                onClick={handleSaveDisplayName} 
                disabled={isSaving}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px', minHeight: '44px' }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Email Address
            </span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-h)' }}>
              {userProfile?.email || session?.user?.email || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Session Mode
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: isGuestMode ? 'var(--accent)' : 'var(--success)' }}>
              {isGuestMode ? 'Offline Simulation (Sandbox)' : 'Supabase Cloud Authenticated'}
            </span>
          </div>
        </div>

        {/* Investment Group Details Card */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Investment Group Details
          </h3>
          
          {familyGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Active Group Name
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-h)' }}>
                  {familyGroup.group_name}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Shared PAN Slots
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)' }}>
                  {userAccounts.length} slots configured
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Group Members
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-h)' }}>
                  {groupMembers.length} verified members
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: '1.6' }}>
              You are currently running an individual portfolio. You can create a collaborative Investment Group in the Family Rotator tab!
            </div>
          )}
        </div>
      </div>

      {/* Account Session & Security Section with Sign Out */}
      <div className="premium-card" style={{ border: '1px solid var(--danger-border)', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-h)', margin: 0 }}>
              Account Session & Security
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Sign out of your active session on this device. You can re-authenticate anytime.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="btn"
            style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sign Out of Account
          </button>
        </div>
      </div>

      {/* Help & Support */}
      <div className="premium-card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 10px 0' }}>
          Help & Support
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
          Need assistance understanding the 8 quantitative gates, setting up ASBA banking blocks, or configuring Telegram alerts?
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => onNavigateTab && onNavigateTab('guide')} 
            style={{ fontSize: '12px', padding: '10px 16px', borderRadius: '12px', minHeight: '44px' }}
          >
            Read the 8 Rules Guide
          </button>
          <a href="https://github.com/Prabhat-12/ipo-investment-tool" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '12px', padding: '10px 16px', borderRadius: '12px', minHeight: '44px' }}
            >
              View GitHub Repository
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
