# SkillSphere — Certificate Monetization & Payment Plan

**Status:** Pending team review
**Last updated:** 2026-04-29

---

## Plan 1 — Tiered Certificate Pricing (Your Plan)

Course content stays **free**. The certificate is the **paid unlock** at 100% completion. Price depends on the course level. Every paid certificate includes a public verification page via QR.

### Pricing

| Course Level | Certificate Price |
|---|---|
| Beginner | Rs. 1,499 |
| Intermediate | Rs. 2,499 |
| Advanced | Rs. 3,499 |

Price is derived from the course `level` field — no separate price config needed per course.

### What the Student Gets

1. **Certificate PDF** — generated after payment, emailed + downloadable in app
2. **Public Verification Page** — `skillsphere.com.pk/verify/<CERT-ID>` — included free with every paid certificate, accessible to anyone via the QR on the certificate

### Public Verification Page

- Route: `skillsphere.com.pk/verify/:certificateNumber`
- No login required — open to employers, institutions, anyone
- Shows: student name, course, level, issue date, instructor name, SkillSphere branding
- Large green **"✓ Verified"** badge
- This is what the QR code on the certificate points to
- Already half-built — QR generation exists, just needs this landing page + endpoint

### QR Code Update

- **Current (production):** QR encodes just the certificate number
- **New:** QR encodes `https://skillsphere.com.pk/verify/<CERT-ID>`
- No extra charge — included with every paid certificate
- Only the value passed into the QR generator changes

### Complete Student Journey

```
Student finishes last lesson → progress hits 100%
              ↓
"Congratulations!" screen appears
              ↓
Certificate price shown based on course level
(Rs. 1,000 / 1,500 / 2,000)
              ↓
Student taps "Get Certificate"
              ↓
Redirected to PayFast hosted checkout
              ↓
Payment completed
              ↓
Gateway calls webhook → backend verifies → certificate generated
              ↓
Certificate PDF emailed to student
Certificate appears in student dashboard
              ↓
Student downloads PDF → scans QR code on certificate
              ↓
Browser opens: skillsphere.com.pk/verify/CERT-XXXX
              ↓
Public page shows verified certificate details
Employer / institution can verify independently
```

### Revenue Projection

| Scenario | Beginner (×Rs.1,000) | Intermediate (×Rs.1,500) | Advanced (×Rs.2,000) | Monthly Total |
|---|---|---|---|---|
| 100 completions/mo (40/40/20) | Rs. 40,000 | Rs. 60,000 | Rs. 40,000 | **Rs. 1,40,000** |
| 200 completions/mo | Rs. 80,000 | Rs. 1,20,000 | Rs. 80,000 | **Rs. 2,80,000** |
| 500 completions/mo | Rs. 2,00,000 | Rs. 3,00,000 | Rs. 2,00,000 | **Rs. 7,00,000** |

*Gateway fees (~2.5%) deducted from above figures.*

### Technical Requirements

#### New DB Table — `Payments`

| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto increment |
| userId | INT FK | References Users |
| courseId | INT FK | References Courses |
| certificateId | INT FK | References Certificates (set after generation) |
| amount | DECIMAL(10,2) | Amount charged in PKR |
| status | ENUM | `pending`, `completed`, `failed`, `refunded` |
| gateway | ENUM | `raast_qr`, `raast_rtp`, `jazzcash`, `easypaisa`, `bank`, `card_local`, `card_international`, `other` |
| gatewayTransactionId | VARCHAR | Transaction ID from gateway |
| gatewayResponse | JSON | Full raw response (for debugging) |
| paidAt | DATETIME | Timestamp when payment confirmed |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

#### Changes to Existing Tables

- `Courses` — add `level` column: `ENUM('beginner', 'intermediate', 'advanced')`
- `Certificates` — add `isPaid BOOLEAN DEFAULT FALSE` + `paymentId FK`

#### Change to Certificate Generation Trigger
- **Current:** Auto-generates at 100% progress
- **New:** At 100% → show payment gate → generate only after webhook confirms payment

#### New API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/initiate` | Student | Create pending payment, return gateway checkout URL |
| POST | `/api/payments/webhook/payfast` | None | PayFast payment confirmation callback |
| POST | `/api/payments/webhook/payfast` | None | PayFast PK payment confirmation callback |
| GET | `/api/payments/status/:courseId` | Student | Check if student has paid for this course cert |
| GET | `/api/payments/history` | Student | Student's full payment history |
| GET | `/api/certificates/verify/:certificateNumber` | None (public) | Public certificate verification |

#### New Frontend Screens

- **Payment Gate Screen** — shown at 100% completion, displays price by level, payment via PayFast (covers JazzCash, EasyPaisa, cards)
- **Public Verification Page** — web-only, no login, shows certificate details + verified badge

#### Payment Gateway — GoPayFast (gopayfast.com)

**Single integration covers both local and international students.**
State Bank of Pakistan licensed. Website: gopayfast.com

##### Account Requirements (No Registered Business Needed)
- Select **"Individual"** or **"Sole Proprietorship"** during signup
- Required: CNIC + personal NTN certificate
- NTN is free — apply online at fbr.gov.pk (takes 1–3 days)
- No company registration, no SECP filing required

##### Exact MDR Rates (exclusive of service tax)

| Payment Method | MDR Rate | Who Uses It |
|---|---|---|
| **Raast QR** | **0.60%** | Cheapest — instant bank-to-bank via QR scan |
| **Raast RTP** | **0.95%** | Request to Pay — customer approves in their banking app |
| **Bank Accounts** | **2.20%** | Internet banking / direct bank transfer |
| **Wallets** (JazzCash, EasyPaisa) | **2.20%** | Most common for Pakistani students |
| **Debit & Credit Cards (Local)** | **2.95%** | Pakistani bank cards |
| **Debit & Credit Cards (International)** | **3.50%** | Foreign students — no second gateway needed |

> **Note:** All rates are exclusive of Service Tax (GST). Factor ~13% tax on top of the MDR when calculating exact net.

##### What You Receive Per Certificate (before service tax)

| Payment Method | Beginner Rs. 1,499 | Intermediate Rs. 2,499 | Advanced Rs. 3,499 |
|---|---|---|---|
| Raast QR (0.60%) | **Rs. 1,490** | **Rs. 2,484** | **Rs. 3,478** |
| Raast RTP (0.95%) | **Rs. 1,485** | **Rs. 2,475** | **Rs. 3,466** |
| Bank / Wallets (2.20%) | **Rs. 1,466** | **Rs. 2,444** | **Rs. 3,422** |
| Local Cards (2.95%) | **Rs. 1,455** | **Rs. 2,425** | **Rs. 3,396** |
| International Cards (3.50%) | **Rs. 1,447** | **Rs. 2,412** | **Rs. 3,377** |

##### Key Advantages
- **Raast QR at 0.60%** — encourage students to pay via Raast to minimize your fee loss
- **International cards built-in at 3.50%** — no second gateway needed for foreign students
- **Google Pay not available in Pakistan yet (as of 2026)** — ignore any mention of it
- **JazzCash, EasyPaisa, Raast, Cards (local + international)** — all in one integration

##### What Happens at Checkout

```
Student hits 100% → payment screen shows
              ↓
Payment options displayed:
  • Raast QR (cheapest for you — highlight this)
  • JazzCash / EasyPaisa wallet
  • Debit / Credit card (local or international)
  • (Google Pay — not available in Pakistan yet)
              ↓
Student selects method → GoPayFast hosted checkout
              ↓
Payment confirmed → webhook → certificate generated
```

#### Implementation Order

| Priority | Step | Effort | Dependency |
|---|---|---|---|
| 1 | Add `level` to Courses + seed existing | Small | None |
| 2 | Create `Payments` model + table | Small | None |
| 3 | Payment initiate + status endpoints | Medium | Step 2 |
| 4 | GoPayFast webhook + signature verification | Medium | Step 3 |
| 5 | Change cert generation to trigger from webhook | Small | Step 4 |
| 6 | Payment gate UI on completion screen | Medium | Step 3 |
| 7 | Public `/verify/:id` page (web) | Small | None |
| 8 | Update QR to encode full verify URL | Small | Step 7 |

Steps 1, 2, and 7 have no dependencies and can be done in parallel.

---

## Plan 2 — Multiple Monetization Strategies (Suggested Plan)

A broader set of revenue streams on top of or instead of Plan 1. Can be combined with Plan 1.

### Strategy 1 — Freemium (Highest Volume)

- Course content is **free**
- Certificate is **paid**
- Students are already invested at 100% — conversion is highest at this point
- This is the Coursera model
- **Pricing:** Flat rate per certificate (e.g. Rs. 299–499) regardless of level

### Strategy 2 — Upsell at Exact Completion Moment

- Full-screen modal the moment student hits 100%
- Emotional high point → highest intent to pay
- "You did it! Get your official certificate for Rs. X"
- Payment inline, no navigation away

### Strategy 3 — Certificate Bundles

- Single certificate: Rs. 299
- 3 certificate pack: Rs. 699 (saves 22%)
- Unlimited yearly pass: Rs. 1,499
- Cash upfront reduces per-cert payment friction
- Students commit to learning more courses when they prepay

### Strategy 4 — Corporate / Bulk Licensing

- Companies pay for 10–50 employee certificates at once
- Invoice-based payment (bank transfer acceptable at this scale)
- One corporate deal = revenue of 50 individual student payments
- Target HR departments, training managers

### Strategy 5 — Premium Certificate Tier

- Standard certificate: Rs. 199
- Premium certificate: Rs. 499
- Premium adds: LinkedIn-shareable URL, verified badge page, printed physical copy option
- Same PDF generation work — higher perceived value

### Strategy 6 — Subscription Pass

- Rs. 999/month = unlimited certificates for that month
- Targets power learners doing multiple courses
- Recurring monthly revenue

### Strategy 7 — LinkedIn / CV Verification Add-on

- After payment, student gets a public verification URL
- `skillsphere.com.pk/verify/<CERT-ID>`
- Shareable on LinkedIn, CV, email signatures
- Already half-built from the QR code — just needs a landing page
- Can be charged as Rs. 99 add-on or included free with premium tier

### Payment Gateways (same as Plan 1)

| Gateway | Covers | Fee | Role |
|---|---|---|---|
| **GoPayFast (gopayfast.com)** | Raast QR/RTP, JazzCash, EasyPaisa, Bank accounts, Local cards, International cards | 0.60%–3.50% depending on method | Only gateway needed — covers local + international |

### Revenue Potential by Strategy

| Strategy | Type | Potential |
|---|---|---|
| Freemium flat cert price | Per completion | Medium — low ticket, high volume |
| Bundles | Prepaid | Medium — upfront cash |
| Corporate licensing | B2B deals | High — low frequency, large amounts |
| Premium tier | Per completion | Medium — higher ticket |
| Subscription pass | Recurring | High — predictable monthly revenue |
| LinkedIn add-on | Micro add-on | Low per transaction, adds up at scale |

---

## Recommended Approach

Implement **Plan 1** first — it is simpler, cleaner, and directly tied to what is already built. Once payment infrastructure is in place, layer in elements from **Plan 2** (bundles, subscription, corporate) on top without rebuilding anything.

**Phase 1:** Plan 1 (tiered pricing + verification page)
**Phase 2:** Add bundle packs + subscription pass from Plan 2
**Phase 3:** Corporate licensing + premium tier
