import React from 'react';
import { Copy, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { MobileDataCard } from '../components/ui/mobile-data-card';

export default function CapitalRotatorPage({
  isMobile,
  familyGroup,
  groupMembers = [],
  userAccounts = [],
  userApplications = [],
  capital = 100000,
  liquidCapital = 100000,
  ipos = [],
  showAddAccountModal,
  setShowAddAccountModal,
  newAccountName,
  setNewAccountName,
  newAccountPan,
  setNewAccountPan,
  onAddAccountSlot,
  onResolveApplication
}) {
  const totalMembers = (familyGroup && groupMembers.length > 0) ? groupMembers.length : (userAccounts.length || 1);
  const totalAccounts = userAccounts.length;
  const totalBlocked = userApplications
    .filter(app => app.status === 'PENDING')
    .reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header & Metric Strip */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', color: 'var(--text-h)', margin: 0, letterSpacing: '-0.025em' }}>
            Family Rotator
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage family member PAN slots, ASBA bank accounts, and capital rotation limits.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '999px', fontWeight: '500', alignSelf: isMobile ? 'flex-start' : 'center' }}>
          <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
            <span className="animate-ping" style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#34d399', opacity: 0.75 }}></span>
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: '6px', height: '6px', backgroundColor: 'var(--success)' }}></span>
          </span>
          Active Portfolio
        </div>
      </div>

      {/* 4-Card Metric Strip */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)' }}>
        <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Active PAN Slots</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>{totalMembers} Members</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Configured family accounts</span>
        </div>

        <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Linked Bank Accounts</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>{totalAccounts} Accounts</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>ASBA enabled netbanking profiles</span>
        </div>

        <div style={{ flex: 1, padding: '24px 20px', borderRight: isMobile ? 'none' : '1px solid var(--border)', borderBottom: isMobile ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Total Capital Pool</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-h)', letterSpacing: '-0.025em', lineHeight: 1 }}>₹{capital.toLocaleString('en-IN')}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Consolidated family capital</span>
        </div>

        <div style={{ flex: 1, padding: '24px 20px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Available Liquid Cash</span>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success)', letterSpacing: '-0.025em', lineHeight: 1 }}>
            ₹{liquidCapital.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--success)', display: 'block', marginTop: '6px', fontWeight: '500' }}>
            {capital > 0 ? ((liquidCapital / capital) * 100).toFixed(0) : 100}% Capital Deployable
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: PAN Slots & Credentials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-h)', letterSpacing: '-0.3px' }}>
              PAN Slots & Credentials
            </h3>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '999px', fontWeight: '600', cursor: 'pointer', minHeight: '36px' }}
            >
              + Add Family Member
            </button>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {userAccounts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  No family members added yet. Tap above to add your first PAN slot.
                </div>
              ) : (
                userAccounts.map(account => {
                  const bidsCount = userApplications.filter(app => app.account_id === account.id && app.status === 'PENDING').length;
                  return (
                    <MobileDataCard
                      key={account.id}
                      title={account.account_holder_name}
                      subtitle={
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.2' }}>
                          {account.pan_mask}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (account.pan_mask) {
                                navigator.clipboard.writeText(account.pan_mask);
                                toast.success(`Copied PAN: ${account.pan_mask}`);
                              }
                            }}
                            title="Copy PAN"
                            style={{ border: 'none', background: 'none', padding: '0', margin: '0 0 0 6px', cursor: 'pointer', color: 'var(--text-muted)', verticalAlign: 'middle', lineHeight: 1 }}
                          >
                            <Copy size={12} style={{ verticalAlign: 'middle' }} />
                          </button>
                        </span>
                      }
                      topRightBadge={
                        bidsCount > 0 ? (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', backgroundColor: 'var(--accent-bg)', padding: '3px 9px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                            {bidsCount} Active Bid{bidsCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                            Idle
                          </span>
                        )
                      }
                      bottomLeft={
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Capital Limit</span>
                      }
                      bottomRight={
                        <span style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '12px' }} className="tabular-nums">
                          ₹{(capital / Math.max(userAccounts.length, 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      }
                    />
                  );
                })
              )}
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--card-bg)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member Profile</th>
                    <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PAN Details</th>
                    <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capital Limit</th>
                    <th style={{ padding: '14px 20px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Active Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No family members added yet. Click above to add your first PAN slot.
                      </td>
                    </tr>
                  ) : (
                    userAccounts.map(account => {
                      const bidsCount = userApplications.filter(app => app.account_id === account.id && app.status === 'PENDING').length;
                      const avatarLetters = account.account_holder_name.substring(0, 2).toUpperCase();

                      return (
                        <tr key={account.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-strong)', color: 'var(--text-h)', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '11px', flexShrink: 0 }}>
                                {avatarLetters}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{account.account_holder_name}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                              {account.pan_mask}
                            </span>
                            <button
                              onClick={() => {
                                if (account.pan_mask) {
                                  navigator.clipboard.writeText(account.pan_mask);
                                  toast.success(`Copied PAN: ${account.pan_mask}`);
                                }
                              }}
                              title="Copy PAN"
                              style={{ border: 'none', background: 'none', padding: '0', margin: '0 0 0 6px', cursor: 'pointer', color: 'var(--text-muted)', verticalAlign: 'middle', lineHeight: 1 }}
                            >
                              <Copy size={12} style={{ verticalAlign: 'middle' }} />
                            </button>
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--text-h)' }} className="tabular-nums">
                            ₹{(capital / Math.max(userAccounts.length, 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {bidsCount > 0 ? (
                              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--accent)', backgroundColor: 'var(--accent-bg)', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                {bidsCount} Active Bid{bidsCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', fontWeight: '500', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                Idle
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Capital Allocation & ASBA Block History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Capital Allocation */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-h)', letterSpacing: '-0.3px' }}>
              Capital Allocation
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active ASBA Allocations</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-h)' }} className="tabular-nums">
                ₹{totalBlocked.toLocaleString('en-IN')} / ₹{capital.toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${capital > 0 ? Math.min((totalBlocked / capital) * 100, 100) : 0}%`, backgroundColor: 'var(--text-h)', transition: 'width 0.3s ease' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {userAccounts.map(account => {
                const activeBlocked = userApplications
                  .filter(app => app.account_id === account.id && app.status === 'PENDING')
                  .reduce((sum, app) => sum + parseFloat(app.bid_amount), 0);
                
                return (
                  <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{account.account_holder_name}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-h)' }} className="tabular-nums">
                      ₹{activeBlocked.toLocaleString('en-IN')} ({capital > 0 ? ((activeBlocked / capital) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Unallocated Liquid Cash</span>
                <span style={{ fontWeight: '700', color: 'var(--success)' }} className="tabular-nums">
                  ₹{liquidCapital.toLocaleString('en-IN')} ({capital > 0 ? ((liquidCapital / capital) * 100).toFixed(0) : 100}%)
                </span>
              </div>
            </div>
          </div>

          {/* ASBA Block History */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-h)', letterSpacing: '-0.3px' }}>
              ASBA Block History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto' }}>
              {userApplications.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '20px 0' }}>
                  No bidding applications found. Place bids from the Dashboard to see real-time blocking here.
                </div>
              ) : (
                userApplications.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 6).map(app => {
                  const ipo = ipos.find(i => i.id === app.ipo_id);
                  const account = userAccounts.find(a => a.id === app.account_id);
                  if (!ipo || !account) return null;

                  return (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-h)' }}>{ipo.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {account.account_holder_name} • {app.status === 'PENDING' ? 'Blocked' : app.status === 'ALLOTTED' ? 'Allotted' : 'Refunded'}
                        </span>
                        {app.status === 'PENDING' && onResolveApplication && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              onClick={() => onResolveApplication(app.id, true)}
                              style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: 'var(--success)', border: '1px solid var(--success)', backgroundColor: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Mark Allotted
                            </button>
                            <button
                              onClick={() => onResolveApplication(app.id, false)}
                              style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Mark Refunded
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: app.status === 'PENDING' ? 'var(--text-h)' : app.status === 'ALLOTTED' ? 'var(--success)' : 'var(--text-muted)' }} className="tabular-nums">
                          ₹{app.bid_amount.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {new Date(app.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-h)', margin: 0 }}>Add Family Member PAN</h3>
              <button onClick={() => setShowAddAccountModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={onAddAccountSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'rgba(0, 0, 0, 0.02)', color: 'var(--text-h)', fontSize: '13px', outline: 'none' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>PAN Number (10 Characters)</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={newAccountPan}
                  onChange={(e) => setNewAccountPan(e.target.value.toUpperCase())}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'rgba(0, 0, 0, 0.02)', color: 'var(--text-h)', fontSize: '13px', outline: 'none', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px' }}
                >
                  Save PAN Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
