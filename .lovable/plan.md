

# Remove Pricing/Paywall and Add About Us Page

## Overview
Remove all pricing and paywall functionality from DocBrief AI and replace with an About Us page.

## What Gets Removed

### Pricing & Paywall Components
- **`src/components/PricingSection.tsx`** -- Remove the pricing section from the homepage
- **`src/components/UpgradeModal.tsx`** -- Remove the upgrade/paywall modal
- **`src/lib/freeUsageLimiter.ts`** -- Remove the free usage limiter logic

### References Cleaned Up
- **`src/pages/Index.tsx`** -- Remove PricingSection import and usage
- **`src/pages/Upload.tsx`** -- Remove UpgradeModal, free usage limit check, and related state
- **`src/pages/Processing.tsx`** -- Remove `markFreeUsageUsed()` call
- **`src/pages/Explanation.tsx`** -- Remove upgrade modal and download paywall logic
- **`src/components/Header.tsx`** -- Replace "Pricing" nav link with "About Us" link

## What Gets Added

### New About Us Page (`src/pages/AboutUs.tsx`)
A clean, informative page with:
- Header and Footer (reusing existing components)
- Mission statement section
- What DocBrief AI does
- Team/company vision

### Routing & Navigation Updates
- **`src/App.tsx`** -- Add `/about` route
- **`src/components/Header.tsx`** -- Change "Pricing" link to "About Us" pointing to `/about`
- **`src/components/Footer.tsx`** -- Update "About" link to point to `/about`

## Technical Details

### Files to create
| File | Description |
|------|-------------|
| `src/pages/AboutUs.tsx` | New About Us page with mission, features, and vision sections |

### Files to modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/about` route |
| `src/pages/Index.tsx` | Remove PricingSection |
| `src/pages/Upload.tsx` | Remove UpgradeModal and free usage checks |
| `src/pages/Processing.tsx` | Remove `markFreeUsageUsed` import and call |
| `src/pages/Explanation.tsx` | Remove upgrade modal state and inline modal |
| `src/components/Header.tsx` | Replace Pricing link with About Us link |
| `src/components/Footer.tsx` | Update About link to `/about` |

### Files to delete
| File | Reason |
|------|--------|
| `src/components/PricingSection.tsx` | No longer needed |
| `src/components/UpgradeModal.tsx` | No longer needed |
| `src/lib/freeUsageLimiter.ts` | No longer needed |

