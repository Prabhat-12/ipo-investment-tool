import os
import json
from decision_engine import evaluate_ipo

def run_backtest():
    # Paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    historical_path = os.path.join(current_dir, "db", "historical_ipos.json")
    results_path = os.path.join(current_dir, "src", "data", "backtest_results.json")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(results_path), exist_ok=True)

    if not os.path.exists(historical_path):
        print(f"Error: Historical data not found at {historical_path}")
        return

    with open(historical_path, "r") as f:
        ipos = json.load(f)

    # Sort IPOs chronologically by open_date
    ipos.sort(key=lambda x: x["open_date"])

    # 1. Simulate Strategy A: Blindly applying to every IPO (subject to lottery)
    # 2. Simulate Strategy B: Smart Filter (Apply only to YES recommendations)
    
    capital_blind = 100000.0
    capital_smart = 100000.0
    
    blind_history = []
    smart_history = []
    
    stats = {
        "total_evaluated": len(ipos),
        "yes_count": 0,
        "no_count": 0,
        "blind_final_capital": 0.0,
        "smart_final_capital": 0.0,
        "smart_total_profit": 0.0,
        "blind_total_profit": 0.0,
        "detailed_results": []
    }

    # Tracking metrics success rates
    metric_counts = {
        "demand": {"passed": 0, "failed": 0},
        "capital": {"passed": 0, "failed": 0},
        "valuation": {"passed": 0, "failed": 0},
        "sentiment": {"passed": 0, "failed": 0},
        "anchors": {"passed": 0, "failed": 0},
        "fundamentals": {"passed": 0, "failed": 0},
        "issue_size": {"passed": 0, "failed": 0},
        "promoter_stake": {"passed": 0, "failed": 0}
    }

    for ipo in ipos:
        # Run decision engine
        eval_res = evaluate_ipo(ipo)
        decision = eval_res["decision"]
        score = eval_res["score"]
        rules = eval_res["rules"]

        # Increment metric stats
        for key in metric_counts:
            if rules[key]["passed"]:
                metric_counts[key]["passed"] += 1
            else:
                metric_counts[key]["failed"] += 1

        if decision == "YES":
            stats["yes_count"] += 1
        else:
            stats["no_count"] += 1

        # Lottery Allotment Probability
        # Probability = 1 / retail subscription multiple (e.g. if subscribed 10x, chance is 10%)
        # Capped at 1.0 (100% allotment if undersubscribed)
        retail_sub = ipo.get("retail_sub", 1.0)
        allotment_prob = min(1.0, 1.0 / retail_sub) if retail_sub > 0 else 1.0
        
        lot_cost = ipo.get("retail_lot_cost", 15000.0)
        listing_gains_pct = ipo.get("listing_gains_pct", 0.0)

        # Expected return = Lot Cost * Allotment Probability * Gains %
        expected_allotted_value = lot_cost * allotment_prob
        expected_gain = expected_allotted_value * (listing_gains_pct / 100.0)

        # Apply to Blind Strategy (All IPOs)
        capital_blind += expected_gain
        blind_history.append({
            "date": ipo["open_date"],
            "name": ipo["name"],
            "capital": round(capital_blind, 2),
            "gain": round(expected_gain, 2)
        })

        # Apply to Smart Strategy (Only YES IPOs)
        expected_gain_smart = 0.0
        if decision == "YES":
            expected_gain_smart = expected_gain
            capital_smart += expected_gain_smart
            
        smart_history.append({
            "date": ipo["open_date"],
            "name": ipo["name"],
            "capital": round(capital_smart, 2),
            "gain": round(expected_gain_smart, 2),
            "decision": decision,
            "score": score
        })

        stats["detailed_results"].append({
            "name": ipo["name"],
            "symbol": ipo["symbol"],
            "open_date": ipo["open_date"],
            "listing_date": ipo["listing_date"],
            "decision": decision,
            "score": score,
            "listing_gains_pct": listing_gains_pct,
            "allotment_probability_pct": round(allotment_prob * 100, 1),
            "expected_gain": round(expected_gain_smart, 2),
            "rules": {k: v["passed"] for k, v in rules.items()}
        })

    stats["blind_final_capital"] = round(capital_blind, 2)
    stats["smart_final_capital"] = round(capital_smart, 2)
    stats["blind_total_profit"] = round(capital_blind - 100000.0, 2)
    stats["smart_total_profit"] = round(capital_smart - 100000.0, 2)
    stats["metric_counts"] = metric_counts
    
    # Save backtest results
    output_data = {
        "stats": stats,
        "blind_history": blind_history,
        "smart_history": smart_history
    }
    
    with open(results_path, "w") as f:
        json.dump(output_data, f, indent=4)
        
    print("Backtest simulation completed.")
    print(f"Blind Strategy Final Capital: ₹{stats['blind_final_capital']:,} (Profit: ₹{stats['blind_total_profit']:,})")
    print(f"Smart Filter Strategy Final Capital: ₹{stats['smart_final_capital']:,} (Profit: ₹{stats['smart_total_profit']:,})")
    print(f"Recommended {stats['yes_count']} IPOs out of {stats['total_evaluated']} total.")

if __name__ == "__main__":
    run_backtest()
