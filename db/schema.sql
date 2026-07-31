-- PostgreSQL Schema for Indian IPO Tracker (Supabase)

-- Drop tables if they exist (for database initialization/reset)
DROP TABLE IF EXISTS anchor_investors CASCADE;
DROP TABLE IF EXISTS financials CASCADE;
DROP TABLE IF EXISTS peers CASCADE;
DROP TABLE IF EXISTS gmp_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS ipos CASCADE;

-- 1. IPOS table: stores the master data for each IPO
CREATE TABLE ipos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50),
    price_band_low NUMERIC(10, 2),
    price_band_high NUMERIC(10, 2),
    issue_size_cr NUMERIC(12, 2),
    fresh_issue_cr NUMERIC(12, 2),
    ofs_cr NUMERIC(12, 2),
    lot_size INTEGER,
    retail_lot_cost NUMERIC(12, 2),
    open_date DATE,
    close_date DATE,
    allotment_date DATE,
    refund_date DATE,
    listing_date DATE,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'bidding', 'closed', 'allotment_pending', 'listed'
    listing_price NUMERIC(10, 2),
    listing_gains_pct NUMERIC(6, 2),
    
    -- Additional 2 metrics
    market_cap_cr NUMERIC(12, 2),
    post_ipo_promoter_holding_pct NUMERIC(5, 2),
    
    -- Decisions
    decision VARCHAR(10) DEFAULT 'PENDING', -- 'YES', 'NO', 'PENDING'
    decision_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching IPOs by name or symbol
CREATE INDEX idx_ipos_symbol ON ipos(symbol);
CREATE INDEX idx_ipos_status ON ipos(status);

-- 2. SUBSCRIPTIONS table: daily tracking of bidding multiples
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    qib NUMERIC(8, 2) DEFAULT 0.00,
    nii NUMERIC(8, 2) DEFAULT 0.00,
    retail NUMERIC(8, 2) DEFAULT 0.00,
    total NUMERIC(8, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ipo_id, date)
);

-- 3. GMP HISTORY table: daily informal grey market premium
CREATE TABLE gmp_history (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    gmp_rs NUMERIC(10, 2) DEFAULT 0.00,
    estimated_listing NUMERIC(10, 2),
    implied_gain_pct NUMERIC(6, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ipo_id, date)
);

-- 4. PEERS table: P/E comparison against listed competitors
CREATE TABLE peers (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    peer_name VARCHAR(255) NOT NULL,
    peer_pe NUMERIC(8, 2),
    ipo_pe NUMERIC(8, 2) -- IPO's P/E relative to this peer
);

-- 5. FINANCIALS table: Profit After Tax (PAT) and revenue trajectory for 3 fiscal years
CREATE TABLE financials (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(20) NOT NULL, -- e.g., 'FY24', 'FY25'
    revenue_cr NUMERIC(12, 2),
    pat_cr NUMERIC(12, 2),
    pat_margin_pct NUMERIC(5, 2)
);

-- 6. ANCHOR INVESTORS table: Institutional allocations prior to opening
CREATE TABLE anchor_investors (
    id SERIAL PRIMARY KEY,
    ipo_id INTEGER REFERENCES ipos(id) ON DELETE CASCADE,
    investor_name VARCHAR(255) NOT NULL,
    shares_allocated BIGINT,
    amount_allocated_cr NUMERIC(12, 2),
    is_marquee BOOLEAN DEFAULT FALSE -- Flag if it belongs to blue-chip/Tier-1 list
);

-- Trigger to auto-update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ipos_modtime BEFORE UPDATE ON ipos FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_gmp_history_modtime BEFORE UPDATE ON gmp_history FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
