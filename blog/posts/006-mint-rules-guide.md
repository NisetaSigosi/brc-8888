Here's the markdown file for your 6th blog post (006-mint-rules-guide.md):

```markdown
---
title: "Understanding mint_rules in BRC-8888: Detailed Breakdown"
date: "2025-12-14"
author: "Niseta Sigosi"
excerpt: "A comprehensive guide to BRC-8888's mint_rules object, explaining fair-launch mechanics, vesting schedules, and phased pricing for controlled token distribution."
---

### Understanding mint_rules in BRC-8888: Detailed Breakdown

In the BRC-8888 protocol, `mint_rules` is a key object defined during the deploy operation. It enforces fair-launch mechanics for minting new units of an object (e.g., tokens like UNQ). This ensures controlled distribution, prevents abuse (like sniping), and promotes equitable access. The rules are validated off-chain by indexers, making them mandatory for any valid mint inscription. Below, I break down each field in detail, with examples from the genesis UNQ deploy.

#### Structure of mint_rules
`mint_rules` is an optional JSON object in the deploy inscription (under the deploy op). If omitted, mints are unrestricted except for total supply. All values are strings or integers for precision.

```json
"mint_rules": {
  "user_cap": "integer_string",        // Max per address (e.g., "10000")
  "exempt_addrs": [                    // Array of founder/special exemptions
    {
      "address": "bc1p...",
      "role": "string",                // e.g., "founder"
      "amount": "integer_string",      // Exempt qty (e.g., "1000000")
      "vesting": {                     // Optional linear vesting
        "type": "linear",
        "start": "ISO8601",            // e.g., "2025-11-18T00:00:00Z"
        "cliff_days": integer,         // Days before unlock starts
        "duration_days": integer,      // Total vesting period
        "unlock_period": "monthly"     // Payout frequency
      },
      "lock_conditions": {             // Optional locks
        "lock_until_public_minted": "integer_string"  // e.g., "20000000"
      }
    }
  ],
  "cooldown_blocks": integer,          // Blocks between mints per address
  "phases": [                          // Array of pricing tiers
    {
      "start_minted": "integer_string",  // Start after this total minted
      "end_minted": "integer_string",    // End before this total minted
      "price_sats": integer,             // Fixed sats per unit
      "perks": "string"                  // Optional benefits (e.g., "AI traits")
    }
  ]
}
```

#### Field-by-Field Explanation

**1. user_cap: "integer_string"**  
- **Purpose:** Limits how many units a single address can mint (prevents whale dominance). Enforced by indexers tracking minted_by_addr.  
- **Details:** Arbitrary precision string (e.g., "10000" for UNQ). 0 or omitted = no cap. Applies to non-exempt addresses only.  
- **Example from UNQ:** `"user_cap": "10000"` — no address can mint >10,000 UNQ (fairness for small holders).  
- **Indexer Role:** Rejects mint if minted_by_addr[addr][tick] + qty > user_cap.  

**2. exempt_addrs: Array of Objects**  
- **Purpose:** Special exemptions (e.g., for founders) with vesting/locks to prevent dumps. Allows controlled pre-mints without fees.  
- **Details:** Each entry is an address with optional vesting (linear unlock post-cliff) and lock_conditions (e.g., non-transfer until public mints hit a threshold).  
- **Vesting Breakdown:**  
  - `type`: "linear" (gradual unlock).  
  - `start`: ISO timestamp when vesting begins.  
  - `cliff_days`: Days before any unlock (e.g., 90 for UNQ founder).  
  - `duration_days`: Total period (e.g., 365 for 12 months).  
  - `unlock_period`: "monthly" (payout frequency).  
  - Indexers calculate unlocked = amount * min(1, (time - cliff_end) / duration), floored.  
- **Lock Conditions Breakdown:**  
  - `lock_until_public_minted`: Non-transfer/mint until total_minted >= this value (e.g., "20000000" for UNQ).  
- **Example from UNQ:** Founder exemption for 1M UNQ with 90-day cliff, 12-month linear vesting, and lock until 20M public minted.  
- **Indexer Role:** For exempt addr, check amount cap, vesting unlock, and lock conditions before allowing mint.  

**3. cooldown_blocks: integer**  
- **Purpose:** Prevents rapid mints from one address (anti-bot/spam).  
- **Details:** Blocks between mints (e.g., 144 ~1 day). 0 or omitted = no cooldown.  
- **Example from UNQ:** `cooldown_blocks: 144` — wait 1 day per mint batch.  
- **Indexer Role:** Reject if last_mint_block[addr][tick] + cooldown > current_block.  

**4. phases: Array of Objects**  
- **Purpose:** Tiered fixed pricing for mints, creating urgency/FOMO without auctions.  
- **Details:** Each phase defines start/end minted, price_sats per unit, and optional perks (e.g., "AI traits"). Indexers compute cost as sum(price * qty in phase).  
- **Example from UNQ:** Phase 1 (0–10M): 2100 sats; Phase 2 (10M+): 4200 sats + perks.  
- **Indexer Role:** Calculate phased cost based on total_minted; reject if TX output to reserve < required (minus 1% treasury).  

### How mint_rules Work in Practice

**Deploy Phase:** Set rules in deploy JSON — indexers store and enforce.  

**Mint Validation:** Indexers check user_cap/cooldown/phases; exempts get vesting/lock checks. Pay phased cost to reserve + 1% to treasury via TX outputs.  

**Stats Tracking:** Indexers maintain total_minted, minted_by_addr for phase progression and locks.  

### Complete Example: UNQ Genesis Deploy mint_rules

```json
{
  "mint_rules": {
    "user_cap": "10000",
    "exempt_addrs": [
      {
        "address": "bc1pqz5uyfvn0s0c3g6jvkgj82q6h8kj8kqg5wq7xv4q3q3q3q3q3q3q3q3q3q",
        "role": "founder",
        "amount": "1000000",
        "vesting": {
          "type": "linear",
          "start": "2025-11-18T00:00:00Z",
          "cliff_days": 90,
          "duration_days": 365,
          "unlock_period": "monthly"
        },
        "lock_conditions": {
          "lock_until_public_minted": "20000000"
        }
      }
    ],
    "cooldown_blocks": 144,
    "phases": [
      {
        "start_minted": "0",
        "end_minted": "10000000",
        "price_sats": 2100,
        "perks": "early_supporter_badge"
      },
      {
        "start_minted": "10000001",
        "end_minted": "21000000",
        "price_sats": 4200,
        "perks": "ai_enhanced_traits"
      }
    ]
  }
}
```

### Comparison with Other Standards

| Feature | BRC-8888 mint_rules | BRC-20 Minting | Runes Etching |
|---------|---------------------|----------------|---------------|
| Per-address limits | Yes (user_cap) | No | No |
| Vesting schedules | Yes (exempt_addrs) | No | No |
| Phase pricing | Yes (phases) | No | No |
| Cooldown periods | Yes (cooldown_blocks) | No | No |
| Founder exemptions | Yes (with locks) | No | No |
| Anti-bot protection | Yes | Partial | Partial |

### Indexer Enforcement Process

1. **Parse Rules:** Indexers load mint_rules from deploy inscription
2. **Track State:** Maintain minted_by_addr, total_minted, last_mint_block
3. **Validate Mint:** For each mint inscription:
   - Check if address is exempt (skip user_cap if yes)
   - Validate user_cap not exceeded
   - Verify cooldown period passed
   - Calculate price based on current phase
   - Check vesting/locks for exempt addresses
4. **Update Stats:** Increment counters, record timestamps
5. **Fee Collection:** Verify 1% treasury fee + phased price paid

### Benefits of mint_rules

**Fair Distribution:** Prevents whale accumulation with user_cap  
**Sustainable Growth:** Phased pricing creates organic demand curves  
**Team Alignment:** Vesting ensures long-term project commitment  
**Bot Resistance:** Cooldown periods deter automated sniping  
**Transparent Rules:** All parameters on-chain, verifiable by anyone  

### Common Use Cases

1. **Fair Launch Tokens:** Limit early accumulation, promote wide distribution
2. **Project Funding:** Phased pricing for progressive fundraising
3. **Team Tokens:** Founder allocations with vesting to prevent immediate dumps
4. **Community Rewards:** Special exemptions for contributors with conditions
5. **Airdrop Preparations:** Controlled minting before distribution events

### Best Practices

1. **Set Realistic Caps:** user_cap should balance fairness with practical limits
2. **Gradual Vesting:** 12-36 month vesting with 90-180 day cliffs for team tokens
3. **Conservative Pricing:** Start with accessible prices, increase gradually
4. **Clear Communication:** Document all rules in project documentation
5. **Test Thoroughly:** Simulate mint scenarios before mainnet deployment

### Integration with Evolvable Features

BRC-8888's evolvable objects allow mint_rules to be updated post-deploy via `evolve` operations. This enables:
- Adjusting caps based on community feedback
- Modifying vesting schedules if needed
- Adding new phases as project progresses
- Creating special exemptions for partnerships

All evolutions require valid Dilithium3 signatures and are tracked via Merkle proofs.

### Getting Started with mint_rules

1. **Design Your Rules:** Consider your project's needs for fairness and sustainability
2. **Use the Tool:** Visit [BRC-8888 Tool](https://nisetasigosi.github.io/brc-8888/) to generate deploy JSON
3. **Test on Testnet:** Validate rules work as expected
4. **Deploy on Mainnet:** Inscribe your deploy with confidence
5. **Monitor Indexer Stats:** Track mint progress and rule enforcement

BRC-8888's mint_rules ensure fair, sustainable launches, addressing BRC-20's sniping issues while enabling stats-driven evolutions.

---

*Ready to implement mint_rules for your project? Use the [BRC-8888 deployment tool](https://nisetasigosi.github.io/brc-8888/) to get started.*
