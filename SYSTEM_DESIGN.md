# Refinance Calculator System

## Code Structure

```text
app/
  page.tsx                         Next.js refinance calculator UI
  calculate-refinance/route.ts     Next-compatible POST /calculate-refinance
  submit-lead/route.ts             Next-compatible POST /submit-lead
lib/
  refinance-engine.ts              Shared mortgage calculation domain logic
  lead-contracts.ts                Shared lead validation and response contracts
backend/
  src/main.ts                      NestJS bootstrap, CORS, global validation pipe
  src/app.module.ts                Root NestJS module
  src/refinance/                  Refinance API module
    dto/                           Request DTO validation
    application/                   Use-case service
    refinance.controller.ts        POST /calculate-refinance
  src/leads/                      Lead API module
    domain/                        Lead entity and repository interface
    dto/                           Request DTO validation
    application/                   Submit lead use case
    infrastructure/                In-memory repository implementation
    leads.controller.ts            POST /submit-lead
```

The frontend can run by itself through the Next route handlers. The `backend/` folder provides the same endpoint contract as a NestJS service for a separated production backend.

## Example Frontend Components

- `NumberField`: reusable numeric input with currency and unit adornments.
- `TextField`: reusable lead capture input.
- `Metric`: animated dashboard tile for payment, break-even, and savings values.
- `ComparisonRow`: before/after summary row.
- `HomePage`: orchestrates form state, country switching, API calls, dynamic results, charts, and lead submission.

## APIs

### POST `/calculate-refinance`

Request:

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
  "cashOutAmount": 0,
  "expectedStayYears": 6,
  "rollClosingCosts": false
}
```

Success response:

```json
{
  "current": {
    "monthlyPayment": 3166.04,
    "remainingBalance": 0,
    "totalInterestRemaining": 567791.87,
    "totalPaymentsRemaining": 987791.87,
    "monthsRemaining": 312
  },
  "proposed": {
    "monthlyPayment": 2504.23,
    "loanAmount": 420000,
    "remainingBalance": 0,
    "totalInterest": 481523.53,
    "totalPayments": 908723.53,
    "amortizationMonths": 360
  },
  "comparison": {
    "monthlySavings": 661.81,
    "breakEvenMonths": 10.88,
    "lifetimeSavings": 79068.34,
    "cashOutAmount": 0,
    "totalCostDelta": -79068.34
  },
  "decision": {
    "recommendation": "REFINANCE",
    "confidence": "high",
    "headline": "Refinancing looks beneficial.",
    "summary": "You may save about $662 per month and recover costs in 11 months.",
    "reasons": ["Estimated payment drops by $662 per month."],
    "warnings": []
  }
}
```

Validation error:

```json
{
  "error": "Invalid calculation input.",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "currentLoanBalance": ["Number must be greater than 0"]
    }
  }
}
```

### POST `/submit-lead`

Request:

```json
{
  "firstName": "Avery",
  "lastName": "Morgan",
  "email": "avery@example.com",
  "phone": "+14155550123",
  "country": "US",
  "loanBalance": 420000,
  "desiredAction": "REFINANCE_SAVE",
  "consent": true
}
```

Success response:

```json
{
  "leadId": "lead_lw9z9r_k31pqa",
  "status": "received",
  "nextStep": "A licensed mortgage advisor will review the scenario and follow up."
}
```

Validation error:

```json
{
  "error": "Invalid lead submission.",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Enter a valid email address."]
    }
  }
}
```
