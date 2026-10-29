/**
 * Divergen Live Market Sync Engine (Client-side)
 * Directly connects to the IPO Guru API (supported via CORS)
 * to fetch active and upcoming IPOs in real-time.
 */

const DEFAULT_API_KEY = "ipo_7HkoCwHQZlskYDXW95CczOKEHBbH5zzGIUpXFvnK";
const BASE_URL = "https://www.ipoguru.in/api/v2";

export async function fetchLiveMarketIpos() {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPOGURU_API_KEY) || DEFAULT_API_KEY;
  
  try {
    const res = await fetch(`${BASE_URL}/ipos?limit=20&type=mainboard`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`IPO Guru HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const rawList = json.data || [];
    const todayStr = new Date().toLocaleDateString('sv-SE');

    return rawList.map(item => {
      const issue = item.issue || {};
      const timeline = item.timeline || {};
      const gmp = item.gmp || {};

      const open_date = timeline.open_date || item.open_date;
      const close_date = timeline.close_date || item.close_date;
      const listing_date = timeline.listing_date || item.listing_date;

      let status = 'upcoming';
      if (open_date && close_date) {
        if (todayStr >= open_date && todayStr <= close_date) {
          status = 'bidding';
        } else if (todayStr > close_date) {
          status = 'closed';
          if (listing_date && todayStr >= listing_date) {
            status = 'listed';
          }
        } else {
          status = 'upcoming';
        }
      } else if (item.status) {
        status = item.status.toLowerCase() === 'open' ? 'bidding' : item.status.toLowerCase();
      }

      const price_min = parseFloat(issue.price_min || item.price_min || 0);
      const price_max = parseFloat(issue.price_max || item.price_max || price_min);
      const lot_size = parseInt(issue.lot_size || item.lot_size || 1, 10);
      const retail_lot_cost = parseFloat(issue.min_investment || item.min_investment || (lot_size * price_max));
      const gmp_pct = parseFloat(gmp.percentage || item.gmp_pct || 0);
      const issue_size_cr = parseFloat(issue.issue_size || item.issue_size || 0);

      return {
        slug: item.slug,
        name: item.name || item.display_name || 'IPO Issue',
        symbol: issue.nse_symbol || issue.bse_scrip_code || (item.slug ? item.slug.slice(0, 10).toUpperCase().replace(/-/g, '') : 'IPO'),
        price_band_low: price_min,
        price_band_high: price_max,
        issue_size_cr,
        lot_size,
        retail_lot_cost,
        open_date,
        close_date,
        listing_date,
        status,
        gmp_pct,
        gmp_rs: parseFloat(gmp.price || 0),
        estimated_listing: parseFloat(gmp.estimated_listing_price || (price_max * (1 + gmp_pct / 100))),
        logo: (item.images && item.images.logo) || item.logo || null,
        web_url: item.web_url || ''
      };
    });
  } catch (err) {
    console.warn("Client-side live market sync failed:", err);
    throw err;
  }
}
