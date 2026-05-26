# Mortgage Refinance Calculator

A modern, lender-grade mortgage refinance calculator for both USA refinance and Canada renew/switch scenarios.

Live demo: [https://mortgage-calculator-beta-olive.vercel.app/](https://mortgage-calculator-beta-olive.vercel.app/)

## Overview

This application helps borrowers understand whether refinancing or renewing a mortgage is financially beneficial using real-world lending logic.

It calculates:

- Monthly payment changes
- Break-even timing
- Interest savings or increase
- Loan term extension impact
- Cash-out impact
- True net outcome
- Debt vs benefit warnings
- Advisor-style risk and confidence scores
- Lender-facing lead quality signals

The goal is to behave less like a basic calculator and more like a mortgage advisor decision-support system.

## Features

### USA Refinance Mode

- Monthly compounding calculations
- Mortgage points support
- Cash-out refinance support
- Closing cost integration
- Break-even analysis
- Full amortization comparison
- Debt vs benefit warning for cash-out scenarios

### Canada Renew / Switch Mode

- Semi-annual compounding conversion
- Renewal-aware mortgage term logic
- No-points flow for Canadian mortgage assumptions
- Cash-out and term-extension risk analysis
- Canada-specific explanation points

### Decision Engine

- Beneficial / Trade-offs / Not beneficial recommendation
- True net outcome calculation
- Risk score and risk band
- Confidence score and confidence factors
- Lender lead score and lender action recommendation
- Primary risk driver detection
- Debt vs benefit ratio for cash-out decisions

### Admin Panel

- Lead management dashboard
- Lead details and status updates
- Analytics summary
- CSV export
- Lender default settings

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Framer Motion
- Lucide React

### Backend

- Next.js API routes for the deployed frontend app
- NestJS backend service for separate API deployment
- TypeScript
- Zod validation

### Deployment

- Frontend: Vercel
- Backend: Render / Railway compatible

## Project Structure

```text
mortgage-calculator/
  package.json
  README.md
  RUN_COMMANDS.txt
  install-required-libraries.txt

  frontend/
    package.json
    app/
      page.tsx
      layout.tsx
      globals.css
      calculate-refinance/route.ts
      submit-lead/route.ts
      api/calculate/route.ts
      admin/
        page.tsx
        api/
          analytics/route.ts
          leads/route.ts
          leads/[id]/route.ts
          leads/export/route.ts
          settings/route.ts
    admin/
      page.tsx
      api/
        analytics/route.ts
        leads/route.ts
        leads/[id]/route.ts
        leads/export/route.ts
        settings/route.ts
    lib/
      refinance-engine.ts
      admin-store.ts
      lead-contracts.ts
    scripts/
      audit-refinance-engine.cjs

  backend/
    package.json
    src/
      main.ts
      app.module.ts
      refinance/
        refinance.controller.ts
        refinance.module.ts
        application/refinance-calculator.service.ts
        dto/calculate-refinance.dto.ts
      leads/
        leads.controller.ts
        leads.module.ts
        application/lead-submission.service.ts
        domain/lead.entity.ts
        dto/submit-lead.dto.ts
        infrastructure/in-memory-lead.repository.ts
      shared/
        refinance-engine.ts
        lead-contracts.ts
```

## Core Calculation Logic

### USA Monthly Compounding

```text
M = P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
```

Where:

- `M` = monthly payment
- `P` = loan amount
- `r` = monthly interest rate
- `n` = total number of payments

### Canada Semi-Annual Compounding

```text
r_m = (1 + r/2)^(2/12) - 1
```

The engine converts Canadian nominal rates into an equivalent monthly rate before calculating payments.

## Installation

Install all required libraries from the project root:

```bash
npm run install:all
```

On Windows PowerShell, this also works:

```bash
npm.cmd run install:all
```

## Run Locally

Run the frontend:

```bash
npm run dev:frontend
```

Run the backend:

```bash
npm run dev:backend
```

Open:

```text
Frontend: http://localhost:3000
Admin:    http://localhost:3000/admin
Backend:  http://localhost:4000
```

## API Example

### POST `/calculate-refinance`

```json
{
  "country": "US",
  "currentLoanBalance": 420000,
  "currentRate": 6.85,
  "currentRemainingYears": 26,
  "newRate": 5.95,
  "newAmortizationYears": 30,
  "termYears": 5,
  "closingCosts": 7200,
  "points": 0,
  "cashOutAmount": 0,
  "expectedStayYears": 6,
  "rollClosingCosts": false
}
```

The same endpoint exists in the Next.js frontend app and the NestJS backend service.

## Scripts

From the project root:

```bash
npm run install:all
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
```

Frontend-only:

```bash
cd frontend
npm run dev
npm run build
npm run typecheck
npm run audit:refinance
```

Backend-only:

```bash
cd backend
npm run start:dev
npm run build
npm run start:prod
npm run typecheck
```

## Audit

The refinance engine has a focused audit script that protects key financial behavior:

```bash
npm.cmd --prefix frontend run audit:refinance
```

The audit covers:

- Clean beneficial refinance
- USA and Canada compounding differences
- Negative savings
- Late break-even
- Cash-out risk
- Term extension risk
- Debt vs benefit warning
- Source-of-truth true net outcome behavior

## Deployment

### Frontend on Vercel

Set the Vercel root directory to:

```text
frontend
```

Build command:

```bash
npm run build
```

### Backend on Render or Railway

Set the backend root directory to:

```text
backend
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm run start:prod
```

The backend reads the platform port from:

```text
PORT
```

## Future Improvements

- Add persistent PostgreSQL storage
- Add admin authentication
- Export borrower scenarios to PDF
- Save and compare multiple scenarios
- Add CRM integration
- Add lender-specific configuration
- Add analytics tracking

## Author

Anirban Mondal

## License

MIT License

## Final Note

This project goes beyond a basic mortgage calculator by combining:

- Financial accuracy
- Risk-based decision logic
- Advisor-style recommendations
- Lender-facing lead intelligence

It is designed as a foundation for real-world mortgage decision support and lead generation.
