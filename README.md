# NEXA Campus v1.6.29 - Billing Plan Type Hotfix

Fix build error:

```txt
Type error: Argument of type 'BillingPlanId' is not assignable to parameter of type 'SetStateAction<PaidBillingPlanId>'.
Type '"radar"' is not assignable to type 'SetStateAction<PaidBillingPlanId>'.
```

## Penyebab

`BILLING_PLANS[planId]` masih dianggap TypeScript sebagai `BillingPlan`, dan `plan.id` bertipe `BillingPlanId` (`radar | pulse | command`).
Padahal state `selectedPlan` cuma boleh `PaidBillingPlanId` (`pulse | command`).

## Fix

Di `src/components/billing/ManualPaymentCard.tsx`, handler pilih plan diganti dari:

```tsx
onClick={() => setSelectedPlan(plan.id)}
```

menjadi:

```tsx
onClick={() => setSelectedPlan(planId)}
```

Karena `planId` berasal dari `(['pulse', 'command'] as const)`, TypeScript tahu nilainya pasti paid plan, bukan `radar`.

## Cara pasang

1. Copy folder `src` ke root project.
2. Timpa file lama.
3. Jalankan:

```bash
npm run build
```

4. Kalau sukses:

```bash
git add -A
git commit -m "fix: manual payment selected plan type"
git push
```
