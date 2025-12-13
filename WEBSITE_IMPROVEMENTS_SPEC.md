# AnyCable Website Improvements Specification

**Repository:** anycable-web (anycable.io)  
**Date:** December 12, 2025  
**Owner:** Irina  
**Timeline:** Q1 2026 (8 weeks)

---

## Current State Analysis

### Tech Stack
- **Build:** Vite + Handlebars templates + Pug
- **Styling:** SCSS/PostCSS
- **JavaScript:** @anycable/web, Splide (carousel)
- **Deployment:** Netlify

### Existing Structure
```
src/
├─ index.html (homepage)
├─ blog/ (blog posts)
├─ case-studies/ (3 case studies: Healthie, Vito, Callbell)
├─ anycasts/ (video content)
├─ pro/ (Pro product page)
├─ eula/ (legal)
└─ partials/ (header, footer, etc.)
```

### What's Working Well
✅ Clean, modern design  
✅ Use case sections on homepage (5 industries)  
✅ Case studies exist (3 published)  
✅ Pro product page  
✅ Blog infrastructure  
✅ Fast performance (Vite + Netlify)

### Critical Gaps
❌ **No /features page** - Features not showcased  
❌ **No /compare page** - No competitor comparisons  
❌ **No /customers page** - Case studies buried  
❌ **No /learn page** - No central learning hub  
❌ **Pricing incomplete** - AnyCable+ tiers not defined  
❌ **No video hub** - Anycasts exist but not prominent  
❌ **Weak CTAs** - Just "Sign up" button  
❌ **No calculator** - Can't estimate costs  

---

## Phase One: New Pages & Content

### 1. Features Showcase Page (/features)

**Purpose:** Central page showing all AnyCable capabilities

**Sections:**

**Hero**
```
"What Can AnyCable Do?"
Real-time features that scale, without the complexity.
```

**Feature Grid** (6-8 cards)
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ 🔴 Presence         │ 📨 Reliable Delivery│ 🔐 Signed Streams   │
│ Know who's online   │ Never lose messages │ Zero-config Hotwire │
│ [3-line code]       │ [3-line code]       │ [3-line code]       │
│ Learn more →        │ Learn more →        │ Learn more →        │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ 📊 Instrumentation  │ 🚀 High Performance │ 🔧 Multiple Backends│
│ Built-in monitoring │ 10K+ concurrent     │ Rails, Laravel, JS  │
│ [Screenshot]        │ [Benchmark chart]   │ [Code examples]     │
│ Learn more →        │ Learn more →        │ Learn more →        │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

**Feature Comparison Table**
| Feature | AnyCable Open Source | AnyCable Pro | AnyCable+ (Managed) | Action Cable | Pusher |
|---------|---------------------|--------------|---------------------|--------------|--------|
| Performance | ⚡️⚡️⚡️ | ⚡️⚡️⚡️⚡️ | ⚡️⚡️⚡️⚡️ | ⚡️ | ⚡️⚡️ |
| Presence | ✓ | ✓ | ✓ | ✗ | ✓ |
| Message History | ✓ | ✓ | ✓ | ✗ | ✓ |
| Self-hosted | ✓ | ✓ | ✗ | ✓ | ✗ |
| Managed Option | ✗ | ✗ | ✓ | ✗ | ✓ |
| Pricing | Free | $490/yr | $29-299/mo | Free | $49+/mo |

**Architecture Diagram**
- Visual showing: Browser → AnyCable-Go → Rails → Redis
- Highlight performance benefits

**CTA Section**
```
"Ready to add real-time features?"
[Get Started - Free] [See Pricing] [Book a Demo]
```

**File to create:** `src/features/index.html`

---

### 2. Comparison Hub (/compare)

**Purpose:** Help developers choose between AnyCable and alternatives

**Pages to create:**

**`/compare/action-cable`**
```
# AnyCable vs Action Cable

## TL;DR
AnyCable is 10x faster and scales better, but requires running an additional server (AnyCable-Go).
Use Action Cable if: Simple app, < 500 concurrent connections
Use AnyCable if: Need performance, > 500 connections, advanced features

## Performance Comparison
[Benchmark charts: throughput, latency, memory]

## Feature Comparison
[Side-by-side table]

## Cost Comparison
[Infrastructure cost calculator]

## When to Migrate
- [ ] More than 500 concurrent connections
- [ ] CPU usage > 60% on Action Cable
- [ ] Need presence tracking
- [ ] Need message history
- [ ] Deploying to resource-constrained platforms

[Read Migration Guide →] [See Pricing →]
```

**`/compare/pusher`**
```
# AnyCable vs Pusher

## TL;DR
AnyCable gives you full control and costs less at scale, but you manage infrastructure.
Use Pusher if: Just getting started, want zero ops
Use AnyCable if: Cost-conscious, need Rails integration, want control

## Pricing Comparison
[Calculator: connections → monthly cost comparison]

AnyCable+ (managed): $29-299/mo
Pusher: $49-499/mo (same scale)

Self-hosted AnyCable: ~$50-100/mo infrastructure

## Feature Parity
✓ Both have presence
✓ Both have message history
✓ AnyCable has native Rails integration
✓ Pusher has more SDKs

[Try AnyCable+ Free →] [Migration Guide →]
```

**`/compare/ably`**
```
# AnyCable vs Ably

Similar comparison format to Pusher
```

**`/compare`** (hub page)
```
"Find the Right Real-Time Solution"

Compare AnyCable with:
- [Action Cable] - Rails default
- [Pusher] - Popular SaaS
- [Ably] - Enterprise SaaS
- [Socket.io] - Node.js WebSockets

Or jump to:
- [Feature Comparison Matrix]
- [Pricing Calculator]
- [Migration Guides]
```

**Files to create:**
- `src/compare/index.html`
- `src/compare/action-cable/index.html`
- `src/compare/pusher/index.html`
- `src/compare/ably/index.html`

---

### 3. Customer Showcase (/customers)

**Purpose:** Social proof and diverse use cases

**Structure:**

**Hero**
```
"Who Uses AnyCable?"
Trusted by companies building real-time features that scale.
```

**Logo Wall**
- Healthie, Callbell, Vito (existing)
- + 10-15 more logos (collect from users)

**Featured Case Studies** (expand existing)

Currently have: Healthie, Callbell, Vito
Add: 3-5 more diverse examples

**Format for each:**
```
[Company Logo]

"Quote from CTO/Developer about results"

Industry: Healthcare / SaaS / E-commerce
Use Case: Chat / Collaboration / Notifications
Scale: 50K connections, 1M messages/day
Results: 10x performance improvement, 60% cost reduction

[Read Full Story →]
```

**Industry Breakdown**
```
Healthcare: Healthie, [others]
SaaS: Callbell, [others]
E-commerce: [collect examples]
Gaming: [collect examples]
Fintech: [collect examples]
```

**Community Projects**
- Open source projects using AnyCable
- Example apps
- Contributions

**CTA**
```
"Want to be featured?"
Share your AnyCable story
[Submit Your Story →]
```

**Files to create:**
- `src/customers/index.html`
- Expand existing case studies with more details

---

### 4. Learning Hub (/learn)

**Purpose:** Central place for all educational content

**Structure:**

**Hero**
```
"Learn AnyCable"
From zero to real-time in 30 minutes.
```

**Getting Started Paths**
```
┌──────────────────┬──────────────────┬──────────────────┐
│ New to AnyCable  │ Migrating        │ Advanced         │
├──────────────────┼──────────────────┼──────────────────┤
│ Quick Start      │ From Action Cable│ Performance      │
│ First Channel    │ From Pusher      │ Scaling          │
│ Deploy to Heroku │ From Ably        │ Architecture     │
│ 30 min total     │ 1-2 hours        │ Deep dives       │
│ [Start →]        │ [Start →]        │ [Start →]        │
└──────────────────┴──────────────────┴──────────────────┘
```

**Video Tutorials** (when created)
```
📺 Video Library

[Thumbnail] What is AnyCable? (5 min)
[Thumbnail] Setup with Rails 8 (10 min)
[Thumbnail] Building a Chat App (25 min)
[Thumbnail] AnyCable Pro Features (8 min)

[See All Videos →]
```

**Blog Posts by Topic**
```
📝 Latest Articles

Getting Started
→ Rails 8 + AnyCable: Perfect Match
→ Your First Real-time Feature

Use Cases
→ Building Production Chat
→ Real-time Collaboration

Performance
→ Handling 10K Connections
→ Benchmarks & Optimization

[See All Posts →]
```

**Documentation**
```
📚 Documentation

[Icon] Getting Started Guide
[Icon] Features Overview
[Icon] API Reference
[Icon] Troubleshooting

[Browse Docs →]
```

**Community**
```
👥 Community & Support

[Discord] Join Discord - Live chat
[GitHub] GitHub Discussions - Q&A
[Twitter] Follow @any_cable - Updates

[Get Help →]
```

**File to create:** `src/learn/index.html`

---

### 5. Enhanced Pricing Page (/pricing)

**Current state:** Has Pro pricing, no AnyCable+ tiers

**New structure:**

**Hero**
```
"Pricing That Scales With You"
Choose the deployment that fits your needs.
```

**Pricing Tiers** (3 main options)

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Open Source     │ AnyCable+       │ AnyCable Pro    │
│ Free Forever    │ Managed Service │ On-Premise      │
├─────────────────┼─────────────────┼─────────────────┤
│ $0              │ Starting at $29 │ $490/year       │
│                 │                 │                 │
│ ✓ Core features │ Everything in   │ Everything +    │
│ ✓ Self-hosted   │ Open Source +   │                 │
│ ✓ Unlimited     │ ✓ Hosted infra  │ ✓ JWT auth      │
│ ✓ Community     │ ✓ Auto-scaling  │ ✓ GraphQL       │
│                 │ ✓ Monitoring    │ ✓ Binary        │
│ Best for:       │ ✓ Email support │ ✓ Long polling  │
│ Side projects   │                 │ ✓ Hot reload    │
│ Learning        │ Best for:       │                 │
│                 │ Production apps │ Best for:       │
│ [Get Started]   │ Small-mid SaaS  │ Enterprise      │
│                 │                 │ High security   │
│                 │ [Try Free]      │ [Buy Now]       │
└─────────────────┴─────────────────┴─────────────────┘
```

**AnyCable+ Detailed Tiers**

```
Managed Service (AnyCable+)

┌─────────────────────────────────────────────────────┐
│ Free Tier                                           │
│ $0/month                                            │
│ • Up to 100 concurrent connections                  │
│ • US East region only                               │
│ • Community support                                 │
│ • Perfect for: Side projects, prototypes            │
│ [Start Free]                                        │
├─────────────────────────────────────────────────────┤
│ Starter                                             │
│ $29/month                                           │
│ • Up to 1,000 concurrent connections                │
│ • 3 regions (US, EU, Asia)                         │
│ • Email support                                     │
│ • 99% uptime SLA                                    │
│ • Perfect for: Small SaaS, MVP                      │
│ [Start Trial]                                       │
├─────────────────────────────────────────────────────┤
│ Growth                                              │
│ $99/month                                           │
│ • Up to 10,000 concurrent connections               │
│ • Global regions                                    │
│ • Priority support                                  │
│ • Custom domain (wss://realtime.yourapp.com)       │
│ • 99.9% uptime SLA                                  │
│ • Perfect for: Production apps, growing SaaS        │
│ [Start Trial]                                       │
├─────────────────────────────────────────────────────┤
│ Scale                                               │
│ $299/month                                          │
│ • Up to 100,000 concurrent connections              │
│ • Dedicated resources                               │
│ • Premium support                                   │
│ • 99.95% uptime SLA                                 │
│ • Perfect for: Large apps, enterprise               │
│ [Contact Sales]                                     │
└─────────────────────────────────────────────────────┘
```

**Feature Comparison Table**
| Feature | Open Source | AnyCable+ | Pro |
|---------|-------------|-----------|-----|
| WebSocket server | ✓ | ✓ | ✓ |
| Presence tracking | ✓ | ✓ | ✓ |
| Reliable streams | ✓ | ✓ | ✓ |
| Signed streams | ✓ | ✓ | ✓ |
| Instrumentation | ✓ | ✓ | ✓ |
| Infrastructure | Self-host | Managed | Self-host |
| Monitoring | DIY | Included | DIY |
| Support | Community | Email/Priority | Email |
| JWT auth | ✗ | ✗ | ✓ |
| GraphQL | ✗ | ✗ | ✓ |
| Binary formats | ✗ | ✗ | ✓ |
| Long polling | ✗ | ✗ | ✓ |
| Hot reload | ✗ | ✗ | ✓ |

**Cost Calculator** (interactive)
```
"Estimate Your Costs"

Concurrent connections: [slider: 100 - 100,000]
Messages per second: [slider: 10 - 10,000]

Your estimated costs:

AnyCable+ (managed): $XX/month
  Recommended tier: Starter/Growth/Scale
  
Self-hosted AnyCable: $XX/month
  Infrastructure: AWS t3.medium ($35)
  Redis: ElastiCache ($50)
  Total: ~$85/month
  
Pusher (equivalent): $XXX/month
  
[Sign Up for AnyCable+] [Try Self-Hosted]
```

**FAQ Section**
```
Common Questions

Q: What happens if I exceed my connection limit?
A: We'll notify you and help upgrade. No service interruption.

Q: Can I switch between plans?
A: Yes, upgrade/downgrade anytime. Prorated billing.

Q: What's included in support?
A: Starter: Email (48h), Growth: Priority (12h), Scale: Premium (4h)

Q: Do you offer discounts for nonprofits?
A: Yes! Contact sales@anycable.io

[See All FAQs →]
```

**Files to update:**
- `src/pricing/index.html` (major enhancement)
- Add calculator JavaScript
- Add pricing comparison logic

---

### 6. Homepage Enhancements

**Current homepage is good, but add:**

**Feature Highlight Section** (above use cases)
```
"Why AnyCable?"

[Icon] Performance at Scale
Handle 10K+ concurrent connections
[Learn More →]

[Icon] Reliable Delivery
Never lose messages, automatic recovery
[Learn More →]

[Icon] Flexible Deployment
Open source, managed, or Pro
[Compare Options →]
```

**Social Proof Section** (before footer)
```
"Trusted by Teams Worldwide"

[Logo Grid: 12-16 company logos]

"AnyCable handles our 50K concurrent connections effortlessly"
— CTO, Healthcare SaaS

[See Customer Stories →]
```

**Better CTAs**
- Primary: "Try AnyCable+ Free" (not just "Sign up")
- Secondary: "View Pricing"
- Tertiary: "Read Docs"

**Files to update:**
- `src/index.html`

---

## Phase One Deliverables Summary

### New Pages (6 pages)
- ✅ `/features` - Feature showcase
- ✅ `/compare` - Comparison hub (4 sub-pages)
- ✅ `/customers` - Customer showcase
- ✅ `/learn` - Learning hub
- ✅ Enhanced `/pricing` with calculator
- ✅ Enhanced homepage

### New Content
- ✅ Feature comparison tables
- ✅ Cost calculator (interactive)
- ✅ Competitor comparisons (3 pages)
- ✅ Logo wall (collect 12-16 logos)
- ✅ 3-5 new case studies
- ✅ FAQ section

### Interactive Elements
- ✅ Pricing calculator
- ✅ Feature comparison filters
- ✅ Video embeds (when created)

---

## Technical Implementation

### File Structure
```
src/
├─ index.html (enhanced)
├─ features/
│  └─ index.html (new)
├─ compare/
│  ├─ index.html (new)
│  ├─ action-cable/index.html (new)
│  ├─ pusher/index.html (new)
│  └─ ably/index.html (new)
├─ customers/
│  └─ index.html (new)
├─ learn/
│  └─ index.html (new)
├─ pricing/
│  └─ index.html (enhanced)
├─ js/
│  └─ calculator.js (new)
└─ partials/
    ├─ pricing_table.hbs (new)
    ├─ comparison_table.hbs (new)
    └─ feature_card.hbs (new)
```

### New Components Needed

**Pricing Calculator** (`js/calculator.js`)
```javascript
// Interactive slider
// Calculates costs based on connections/messages
// Shows recommendations
// GTM tracking for interactions
```

**Comparison Table** (`partials/comparison_table.hbs`)
```handlebars
{{! Reusable comparison table component }}
{{! Takes data array, renders side-by-side comparison }}
```

**Feature Card** (`partials/feature_card.hbs`)
```handlebars
{{! Reusable feature showcase card }}
{{! Icon, title, description, code snippet, CTA }}
```

### SEO Optimization

**Meta tags for new pages:**
- `/features`: "AnyCable Features | Real-time WebSocket Server"
- `/compare/action-cable`: "AnyCable vs Action Cable | Performance Comparison"
- `/customers`: "AnyCable Customer Stories | Case Studies"
- `/learn`: "Learn AnyCable | Tutorials & Guides"

**Schema.org markup:**
- Product schema for pricing
- Review schema for case studies
- FAQ schema for pricing questions

---

## Success Metrics

### Traffic
- Organic search: +200%
- Direct traffic: +50%
- Referral traffic: +100%

### Engagement
- Bounce rate: 45% → 30%
- Pages per session: 2.1 → 3.5
- Time on site: 1:30 → 3:00

### Conversion
- Homepage → Trial: 3% → 7%
- Pricing page → Trial: 8% → 15%
- Features page → Trial: Track new
- Compare pages → Trial: Track new

### SEO Rankings
- "anycable vs action cable" → Position #1
- "rails websocket performance" → Top 5
- "action cable alternative" → Position #1-3
- "websocket server rails" → Top 5

---

## Implementation Timeline

### Week 1-2: Foundation
- Features showcase page
- Comparison hub structure
- Pricing page redesign

### Week 3-4: Comparison & Customers
- 3 comparison pages (Action Cable, Pusher, Ably)
- Customer showcase page
- Collect case studies (3-5 new)

### Week 5-6: Learning & Interactive
- Learning hub page
- Pricing calculator
- Interactive comparisons

### Week 7-8: Polish & Launch
- Homepage enhancements
- SEO optimization
- Cross-linking
- Testing
- Launch announcement

---

## Content Needs

### To Collect
- [ ] 12-16 company logos (permission to use)
- [ ] 3-5 new customer stories (interviews)
- [ ] Benchmark data (vs Action Cable, Pusher)
- [ ] Infrastructure cost data (AWS, Heroku pricing)
- [ ] Feature screenshots (monitoring, dashboards)

### To Write
- [ ] Feature descriptions (8 features)
- [ ] Comparison content (3 pages, ~1000 words each)
- [ ] Case study write-ups (3-5 stories)
- [ ] Pricing FAQs (10-15 questions)
- [ ] Meta descriptions (all new pages)

### To Design
- [ ] Feature icons (8 custom icons)
- [ ] Comparison charts (performance, cost)
- [ ] Architecture diagrams (can reuse from docs)
- [ ] Calculator UI
- [ ] Logo wall layout

---

## Questions & Decisions

1. **AnyCable+ Pricing - Confirm tiers:**
   - Free: 100 connections?
   - Starter: $29/mo for 1K?
   - Growth: $99/mo for 10K?
   - Scale: $299/mo for 100K?

2. **Calculator scope:**
   - Just connection-based pricing?
   - Include infrastructure costs?
   - Show Pusher/Ably comparison?

3. **Case studies:**
   - Which customers can we feature?
   - Do we have permission for logos?
   - Need new interviews?

4. **Video content:**
   - Embed on /learn page?
   - Separate /videos page?
   - YouTube channel setup?

5. **A/B testing:**
   - Test different CTAs?
   - Test pricing presentation?
   - Tools: Netlify edge functions?

---

## Ready to Start

Can begin immediately with:
1. Features showcase page (/features)
2. Pricing page enhancement with tiers
3. Comparison page (vs Action Cable)

These require minimal design work and leverage existing content.

Let's make anycable.io the best WebSocket product site! 🚀
