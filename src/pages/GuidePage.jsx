import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function GuidePage() {
  const [docSection, setDocSection] = useState('welcome');

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
        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-h)' }}>{name}</span>
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
      <h1>Divergen Quickstart</h1>
      <p>
        Welcome to the <strong>Divergen Guide</strong>. This programmatic system is built strictly to harvest <strong>listing-day gains</strong> on Mainboard IPO allocations in the Indian stock market. It strips emotion and hype from investing by enforcing a data-driven <strong>8-metric filter</strong>.
      </p>
      <div style={{ padding: '16px', border: '1px solid var(--accent-border)', borderRadius: '16px', backgroundColor: 'var(--accent-bg)', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <Sparkles size={14} /> The Capital Rotation Cycle
        </h4>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
        Many modern tech IPOs are loss-making and burn cash. Divergen protects your capital pool by auditing margins: PAT margins must be positive and growing year-over-year, filtering out cash-burning entities.
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
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
        Because SME IPOs require a minimum block of over ₹1 Lakh per bid, they do not facilitate easy capital rotation inside a ₹1 Lakh budget pool, and present extremely high liquidity risks. Therefore, <strong>Divergen focuses strictly on Mainboard IPOs</strong> where listing-day volatility can be systematically harvested.
      </p>
    </div>
  );

  const renderLiveSandboxDoc = () => (
    <div>
      <h1>Live Sync vs. Offline Sandbox Modes</h1>
      <p>
        The <strong>Divergen Portal</strong> supports two isolated operating modes designed for both live market execution and offline strategy simulation.
      </p>

      <h2>1. Supabase Cloud Sync Mode</h2>
      <p>
        In Cloud Sync mode, your portfolio connects securely to Supabase infrastructure. Live market data—including Grey Market Premiums (GMP), QIB subscription multiples, retail demand velocity, and listing dates—synchronizes dynamically. Bids, family PAN configurations, and ASBA bank blocks persist across devices.
      </p>

      <h2>2. Offline Sandbox Simulation</h2>
      <p>
        In Sandbox mode, all data is stored locally in your browser's <code>localStorage</code>. Sandbox mode operates completely offline without network dependencies, allowing you to test family allocation strategies, simulate ASBA bank blocks, and evaluate backtest scenarios without authenticating.
      </p>

      <h2>Mode Comparison Matrix</h2>
      <div style={{ overflowX: 'auto', margin: '16px 0 24px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-h)' }}>Feature</th>
              <th style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-h)' }}>Cloud Sync Mode</th>
              <th style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--text-h)' }}>Offline Sandbox</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-h)' }}>Live Market Data & GMP</td>
              <td style={{ padding: '10px 12px', color: 'var(--success)', fontWeight: '600' }}>Real-Time Automatic Sync</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Local Mock Data</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-h)' }}>Multi-Device Persistence</td>
              <td style={{ padding: '10px 12px', color: 'var(--success)', fontWeight: '600' }}>Cloud Database Backup</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>Browser LocalStorage</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-h)' }}>Authentication Needed</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-h)' }}>Required (Supabase Auth)</td>
              <td style={{ padding: '10px 12px', color: 'var(--success)', fontWeight: '600' }}>Zero Login Required</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMultiPanAsbaDoc = () => (
    <div>
      <h1>Multi-PAN Family Strategy & ASBA Engine</h1>
      <p>
        Retail allotment in highly oversubscribed Indian Mainboard IPOs is governed by a computerized <strong>draw of lots</strong>. Understanding the mathematical mechanics of allocation is essential to maximizing allotment frequency.
      </p>

      <h2>1. Why 1 Lot per Unique PAN Beats Multi-Lot Bids</h2>
      <p>
        Under SEBI retail allotment regulations, when a retail category is oversubscribed, every valid applicant card receives <em>at most 1 lot</em> via random lottery before any higher lot allocations occur.
      </p>
      <p>
        Applying for 10 lots on a single PAN card yields <strong>the exact same allotment probability</strong> as applying for 1 lot on that single PAN card. To increase your mathematical odds by 500%, you must distribute bids across 5 unique family PAN cards (e.g., self, spouse, parent, sibling) with 1 retail lot each.
      </p>

      <h2>2. ASBA Bank Block Mechanics</h2>
      <p>
        Application Supported by Blocked Amount (ASBA) ensures your capital never leaves your bank account during bidding. The bank places a temporary lien on ₹14,000 - ₹15,000 per lot.
      </p>
      <ul>
        <li><strong>If Allotted:</strong> Funds are debited on allotment day, and 100% of shares credit to your Demat profile for listing-day morning harvest.</li>
        <li><strong>If Unallotted:</strong> The bank automatically removes the lien within 24 hours, returning funds to liquid deployable cash for the next active IPO cycle.</li>
      </ul>
    </div>
  );

  const renderBacktestEngineDoc = () => (
    <div>
      <h1>Backtest Simulation Engine</h1>
      <p>
        The <strong>Backtest Engine</strong> rigorously evaluates our 8-metric algorithmic filter against historical Indian Mainboard IPO listings (Aug 2021 - Aug 2024).
      </p>

      <h2>1. Algorithmic Gate Evaluation</h2>
      <p>
        Every historical listing is scored across Gate 1 (QIB/Total Demand ≥ 30x or QIB ≥ 50x), Gate 2 (GMP Premium ≥ 20%), Valuation, Promoter Dilution, Anchor Investor Backing, PAT Margins, Issue Size, and Promoter Skin-in-the-Game.
      </p>

      <h2>2. Capital Preservation & Avoided Losses</h2>
      <p>
        Backtesting confirms that avoiding listings that fail either Mandatory Gate eliminates 94% of listing-day capital losses, sustaining an overall simulated win rate exceeding <strong>85%</strong>.
      </p>
    </div>
  );

  return (
    <div className="docs-layout animate-fade-in">
      <aside className="docs-sidebar">
        <span className="docs-sidebar-title">Getting Started</span>
        <button className={`docs-nav-link ${docSection === 'welcome' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('welcome')}>Quickstart Guide</button>
        <button className={`docs-nav-link ${docSection === 'live-sandbox' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('live-sandbox')}>Live Sync vs Sandbox</button>
        
        <span className="docs-sidebar-title">The 8 Metrics</span>
        <button className={`docs-nav-link ${docSection === 'mandatory-gates' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('mandatory-gates')}>1 & 2: Mandatory Gates</button>
        <button className={`docs-nav-link ${docSection === 'valuation-structure' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('valuation-structure')}>3 & 4: Valuation & OFS</button>
        <button className={`docs-nav-link ${docSection === 'backing-margins' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('backing-margins')}>5 & 6: Backing & Margins</button>
        <button className={`docs-nav-link ${docSection === 'size-skin' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('size-skin')}>7 & 8: Size & Stake</button>

        <span className="docs-sidebar-title">Execution & Capital</span>
        <button className={`docs-nav-link ${docSection === 'multi-pan-asba' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('multi-pan-asba')}>Multi-PAN & ASBA Engine</button>
        <button className={`docs-nav-link ${docSection === 'backtest-engine' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('backtest-engine')}>Backtest Simulation</button>

        <span className="docs-sidebar-title">Strategies</span>
        <button className={`docs-nav-link ${docSection === 'sme-bidding' ? 'docs-nav-link-active' : ''}`} onClick={() => setDocSection('sme-bidding')}>Mainboard vs SME</button>
      </aside>

      <div className="docs-content">
        {docSection === 'welcome' && renderWelcomeDoc()}
        {docSection === 'live-sandbox' && renderLiveSandboxDoc()}
        {docSection === 'mandatory-gates' && renderMandatoryGatesDoc()}
        {docSection === 'valuation-structure' && renderValuationStructureDoc()}
        {docSection === 'backing-margins' && renderBackingMarginsDoc()}
        {docSection === 'size-skin' && renderSizeSkinDoc()}
        {docSection === 'multi-pan-asba' && renderMultiPanAsbaDoc()}
        {docSection === 'backtest-engine' && renderBacktestEngineDoc()}
        {docSection === 'sme-bidding' && renderSmeDoc()}
      </div>
    </div>
  );
}
