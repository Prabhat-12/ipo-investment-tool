def evaluate_ipo(ipo_data):
    """
    Evaluates an IPO based on the 8 metrics decision engine.
    Returns:
        dict: A dictionary containing rule outcomes, score, and final YES/NO decision.
    """
    rules = {}
    score = 0

    # Metric 1: Real-Time Demand (Subscription Rule)
    # Target: Total subscription > 30x OR Qualified Institutional Buyer (QIB) > 50x
    total_sub = ipo_data.get("total_sub", 0.0)
    qib_sub = ipo_data.get("qib_sub", 0.0)
    rules["demand"] = {
        "title": "Real-Time Demand",
        "description": "Total subscription > 30x OR QIB > 50x",
        "value": f"Total: {total_sub}x, QIB: {qib_sub}x",
        "passed": (total_sub >= 30.0) or (qib_sub >= 50.0)
    }
    if rules["demand"]["passed"]:
        score += 1

    # Metric 2: Capital Structure (Skin in the game - OFS vs Fresh Issue)
    # Target: Offer For Sale (OFS) constitutes less than 50% of the total issue size
    issue_size = ipo_data.get("issue_size_cr", 1.0)
    ofs_size = ipo_data.get("ofs_cr", 0.0)
    ofs_pct = (ofs_size / issue_size) * 100 if issue_size > 0 else 0.0
    rules["capital"] = {
        "title": "Capital Structure",
        "description": "Offer For Sale (OFS) < 50% of issue size",
        "value": f"OFS: {ofs_pct:.1f}%",
        "passed": ofs_pct < 50.0
    }
    if rules["capital"]["passed"]:
        score += 1

    # Metric 3: Valuation Buffer (P/E Relative to Listed Peers)
    # Target: Upper Price Band P/E is at least a 15% discount to listed peers' median P/E
    ipo_pe = ipo_data.get("pe_ratio", 0.0)
    peers_median_pe = ipo_data.get("peers_median_pe", 0.0)
    
    # If the company is loss-making (negative P/E), it doesn't have a valuation buffer
    if ipo_pe <= 0 or peers_median_pe <= 0:
        val_passed = False
        val_value = "N/A (Loss Making / No Peers)"
    else:
        # Check for 15% discount: IPO P/E <= 85% of peers median P/E
        discount_pct = ((peers_median_pe - ipo_pe) / peers_median_pe) * 100
        val_passed = discount_pct >= 15.0
        val_value = f"IPO P/E: {ipo_pe:.1f}x vs Peers Median: {peers_median_pe:.1f}x (Discount: {discount_pct:.1f}%)"

    rules["valuation"] = {
        "title": "Valuation Buffer",
        "description": "IPO P/E sits at a 15%+ discount to listed peers",
        "value": val_value,
        "passed": val_passed
    }
    if rules["valuation"]["passed"]:
        score += 1

    # Metric 4: Sentiment Anchor (Pre-listing GMP)
    # Target: Grey Market Premium represents an implied listing premium of > 20%
    gmp_pct = ipo_data.get("gmp_pct", 0.0)
    rules["sentiment"] = {
        "title": "Sentiment Anchor (GMP)",
        "description": "Pre-listing GMP reflects implied premium > 20%",
        "value": f"GMP Implied Premium: {gmp_pct}%",
        "passed": gmp_pct >= 20.0
    }
    if rules["sentiment"]["passed"]:
        score += 1

    # Metric 5: Institutional Backing (Anchor Book Quality)
    # Target: Quality rating of anchor list (marquee Mutual Funds / Sovereign Funds)
    anchor_score = ipo_data.get("anchor_marquee_score", 0)
    rules["anchors"] = {
        "title": "Institutional Backing",
        "description": "Marquee Mutual Funds / Sovereign Funds buy in (Score >= 70/100)",
        "value": f"Anchor Quality Score: {anchor_score}/100",
        "passed": anchor_score >= 70
    }
    if rules["anchors"]["passed"]:
        score += 1

    # Metric 6: Fundamental Reality (PAT Trajectory)
    # Target: Positive, rising Profit After Tax (PAT) margins over the last 3 fiscal years
    financials = ipo_data.get("financials", [])
    pat_margins = [f.get("pat_margin_pct", 0.0) for f in financials]
    
    pat_passed = False
    pat_value = "No historical financials found"
    
    if len(pat_margins) >= 2:
        # Check if latest margin is positive
        latest_margin = pat_margins[-1]
        
        # Check if margins are generally increasing or stable and positive
        is_positive = all(m >= 0 for m in pat_margins[-2:]) # Positive last 2 years
        is_growing = pat_margins[-1] >= pat_margins[-2]      # Growth in latest year
        
        pat_passed = is_positive and is_growing
        pat_value = "Margins: " + " -> ".join([f"{m:.1f}%" for m in pat_margins])
    elif len(pat_margins) == 1:
        pat_passed = pat_margins[0] > 0.0
        pat_value = f"Single year margin: {pat_margins[0]:.1f}%"

    rules["fundamentals"] = {
        "title": "Fundamental Reality",
        "description": "Positive and rising PAT margins in recent years",
        "value": pat_value,
        "passed": pat_passed
    }
    if rules["fundamentals"]["passed"]:
        score += 1

    # Metric 7: Market Capitalization / Issue Size Limit
    # Target: Total issue size is under ₹3,000 Crore (smaller sizes have higher listing surge potential)
    rules["issue_size"] = {
        "title": "Issue Size Filter",
        "description": "Total issue size < ₹3,000 Crore to prevent supply-glut listing flatlines",
        "value": f"Issue Size: ₹{issue_size:.1f} Cr",
        "passed": issue_size < 3000.0
    }
    if rules["issue_size"]["passed"]:
        score += 1

    # Metric 8: Post-IPO Promoter Holding
    # Target: Promoter group retains at least 50% stake post-IPO (skin in the game)
    promoter_holding = ipo_data.get("post_ipo_promoter_holding_pct", 0.0)
    rules["promoter_stake"] = {
        "title": "Skin In The Game",
        "description": "Promoters retain at least 50% post-IPO holding",
        "value": f"Promoter Stake: {promoter_holding:.1f}%",
        "passed": promoter_holding >= 50.0
    }
    if rules["promoter_stake"]["passed"]:
        score += 1

    # Final Decision Calculation:
    # 1. Listing gains are mechanical and highly driven by short-term demand.
    # 2. Thus, Demand (Subscription > 30x) AND Sentiment (GMP > 20%) are MANDATORY.
    # 3. Plus, the overall score must be >= 5 (passed at least 5 of the 8 metrics).
    mandatory_passed = rules["demand"]["passed"] and rules["sentiment"]["passed"]
    is_yes = mandatory_passed and (score >= 5)
    
    decision = "YES" if is_yes else "NO"
    
    # Generate notes explaining the reasoning
    notes = []
    if is_yes:
        notes.append(f"Strong listing potential. Passed {score}/8 metrics including QIB/retail demand and GMP premiums.")
    else:
        if not rules["demand"]["passed"]:
            notes.append("Failed Demand: Bidding subscriptions did not cross the 30x threshold.")
        if not rules["sentiment"]["passed"]:
            notes.append("Failed Sentiment: GMP is too low (<20% premium), showing weak listing day demand.")
        if score < 5:
            notes.append(f"Passed only {score}/8 metrics. Core fundamentals or valuation discount checks failed.")

    return {
        "score": score,
        "decision": decision,
        "rules": rules,
        "notes": "; ".join(notes)
    }

if __name__ == "__main__":
    # Small test
    test_ipo = {
        "name": "Test Tech IPO",
        "total_sub": 45.2,
        "qib_sub": 55.0,
        "issue_size_cr": 800.0,
        "ofs_cr": 200.0,
        "pe_ratio": 25.0,
        "peers_median_pe": 40.0,
        "gmp_pct": 35.0,
        "anchor_marquee_score": 85,
        "post_ipo_promoter_holding_pct": 65.0,
        "financials": [
            { "pat_margin_pct": 8.0 },
            { "pat_margin_pct": 10.5 }
        ]
    }
    result = evaluate_ipo(test_ipo)
    print(f"Test IPO Evaluation: {result['decision']} (Score: {result['score']}/8)")
    print(f"Notes: {result['notes']}")
