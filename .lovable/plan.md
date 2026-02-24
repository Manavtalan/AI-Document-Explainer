

# Upgrade Contract Explainer to Match Offer Letter Detail Level + Unify Upload Flow

## Overview

Two major changes:
1. **Upgrade the Contract Explainer** from a basic 7-field text output to a rich, structured analysis matching the Offer Letter Explainer's level of detail (sections with status colors, risk flags, missing items, glossary, Q&A chat).
2. **Unify the upload flow** into a single "Upload Document" entry point where users pick the document type (Contract or Offer Letter) after uploading.

---

## Part 1: Unify Upload Flow

### What Changes

- **Homepage**: Replace the two separate cards ("Contract Explainer" + "Offer Letter Explainer") with a single prominent card: **"Document Explainer"**
  - New copy: "Upload any contract, offer letter, or agreement. Get a clear, plain-English breakdown in seconds."
  - Single CTA: "Upload Document"
  - Route: `/upload`
- **Header navigation**: Replace two nav items with one: "Upload Document" pointing to `/upload`
- **Upload page (`/upload`)**: Update copywriting
  - Title: "Upload your document" (instead of "Upload your contract")
  - Subtitle: "We'll analyze it and give you a clear explanation"
  - After file is selected, the existing doc-type modal already lets users pick "Contract" or "Offer Letter" -- keep this modal but update its prompt to feel like the primary flow rather than an afterthought
- **Remove `/offer-letter-explainer` as a separate upload page** -- redirect it to `/upload` so existing links still work. The offer letter upload page becomes redundant since `/upload` handles both flows.

### Files Changed
| File | Change |
|------|--------|
| `src/components/ToolsSection.tsx` | Replace two cards with one "Document Explainer" card |
| `src/components/Hero.tsx` | Update headline and CTA to say "document" instead of "contract" |
| `src/components/Header.tsx` | Single "Upload" nav item instead of two |
| `src/pages/Upload.tsx` | Update copy: "Upload your document", keep doc-type modal |
| `src/App.tsx` | Add redirect from `/offer-letter-explainer` to `/upload` |

---

## Part 2: Upgrade Contract Explainer Output

### Current State (7 simple text fields)
The contract analysis returns a flat JSON with 7 string fields (`what_is_this`, `who_is_involved`, `agreements`, `payments`, `duration`, `risks`, `be_careful`). The results page renders these as plain text cards with no status indicators, no risk flags, no glossary, and no Q&A.

### Target State (matching Offer Letter Explainer)
A rich structured analysis with:
- **Document metadata**: contract type, parties, confidence score
- **Key terms summary card** (like the compensation summary but for contracts -- key financial terms, dates, obligations at a glance)
- **14+ sections with status colors** (green/yellow/red/missing), original text quotes, plain-English explanations, key figures, and action items
- **Red flags and caution items** panel
- **Missing items** panel
- **Jargon glossary**
- **Q&A chat** for follow-up questions

### New Contract Analysis JSON Structure

```text
{
  "document_type_detected": "contract | nda | lease | service_agreement | ...",
  "party_a": "Company/Entity A",
  "party_b": "Company/Entity B",
  "contract_title": "extracted or inferred title",
  "confidence_score": 85,

  "key_terms_summary": {
    "contract_value": { "amount": "$50,000", "notes": "..." },
    "payment_schedule": { "terms": "Net 30", "notes": "..." },
    "effective_date": { "date": "March 1, 2026", "notes": "..." },
    "termination_date": { "date": "February 28, 2027", "notes": "..." },
    "governing_law": { "jurisdiction": "State of California", "notes": "..." }
  },

  "sections": [
    {
      "id": "contract_type",
      "title": "Contract Type & Purpose",
      "status": "green | yellow | red | missing",
      "status_label": "Standard | Caution | Risk | Missing",
      "original_text": "relevant quote",
      "explanation": "plain English",
      "key_figures": [],
      "action_items": []
    },
    // ... (parties, scope_of_work, payment_terms, duration,
    //      termination, liability, indemnification, confidentiality,
    //      ip_ownership, non_compete, dispute_resolution,
    //      governing_law, amendments, risks_and_red_flags)
  ],

  "red_flags": [...],
  "caution_items": [...],
  "missing_items": [...],
  "glossary": [...],
  "negotiation_tips": [...]
}
```

### Implementation Details

#### Backend: New Edge Function
| File | Description |
|------|-------------|
| `supabase/functions/analyze-contract-v2/index.ts` | New edge function using Lovable AI gateway (same as offer letter) with a detailed contract-specific system prompt. Returns the rich JSON structure above. |
| `supabase/functions/contract-qa/index.ts` | New edge function for contract Q&A chat (same pattern as `offer-letter-qa`). |

The existing `analyze-document` edge function stays untouched (backward compatibility). The new flow calls `analyze-contract-v2` instead.

#### Frontend: New Store + Results Components
| File | Description |
|------|-------------|
| `src/hooks/useContractStore.ts` | New Zustand store matching the rich contract analysis structure (similar to `useOfferLetterStore.ts`). |
| `src/components/contract/KeyTermsSummary.tsx` | Summary card for contracts (like `CompensationSummary` but showing contract value, dates, parties, governing law). |
| `src/components/contract/ContractSectionBreakdown.tsx` | Reuses the same expandable section card pattern from `SectionBreakdown.tsx`. |
| `src/components/contract/ContractChatPanel.tsx` | Q&A chat for contracts (same pattern as `ChatPanel.tsx`). |
| `src/pages/ContractResults.tsx` | New results page matching `OfferLetterResults.tsx` layout: summary card, quick alerts, section breakdown, risk panel, missing items, glossary, tips, disclaimer, chat. |
| `src/pages/ContractProcessing.tsx` | New processing page (or update existing `Processing.tsx`) to call `analyze-contract-v2` and navigate to `ContractResults`. |

#### Routing Updates
| Route | Destination |
|-------|-------------|
| `/upload` | Unified upload page (existing, updated copy) |
| `/processing` | Updated to call the new v2 edge function |
| `/contract-results` | New rich results page |
| `/explanation` | Keep working (redirect to `/contract-results` or keep as legacy) |
| `/offer-letter-processing` | Unchanged |
| `/offer-letter-results` | Unchanged |

### What Can Be Reused
The Offer Letter Explainer components are highly reusable:
- `SectionBreakdown.tsx` works for any sections array with `status`, `original_text`, `explanation`, etc. -- can be shared or lightly adapted.
- `ChatPanel.tsx` pattern is identical -- only the system prompt and store differ.
- The glossary, red flags, missing items, and negotiation tips rendering in `OfferLetterResults.tsx` can be extracted into shared components.

---

## Summary of All File Changes

### New Files (8)
| File | Purpose |
|------|---------|
| `supabase/functions/analyze-contract-v2/index.ts` | Rich contract analysis edge function |
| `supabase/functions/contract-qa/index.ts` | Contract Q&A chat edge function |
| `src/hooks/useContractStore.ts` | Zustand store for contract analysis state |
| `src/components/contract/KeyTermsSummary.tsx` | Contract key terms summary card |
| `src/components/contract/ContractSectionBreakdown.tsx` | Expandable section cards for contracts |
| `src/components/contract/ContractChatPanel.tsx` | Q&A chat panel for contracts |
| `src/pages/ContractResults.tsx` | Rich contract results page |
| `src/pages/ContractProcessing.tsx` | Contract processing/loading page |

### Modified Files (6)
| File | Change |
|------|--------|
| `src/App.tsx` | Add new routes, redirect `/offer-letter-explainer` to `/upload` |
| `src/pages/Upload.tsx` | Update copy to "Upload your document" |
| `src/components/Hero.tsx` | Update headline/CTA to "document" |
| `src/components/ToolsSection.tsx` | Single "Document Explainer" card |
| `src/components/Header.tsx` | Single nav item |
| `src/components/Footer.tsx` | Update any contract-specific links |

### Unchanged
- All Offer Letter Explainer pages and components (still work via the doc-type modal)
- Old `analyze-document` edge function (legacy, not deleted)
- Old `Explanation.tsx` (can redirect or keep as fallback)

---

## Execution Order
1. Create the two new edge functions (backend first)
2. Create the new Zustand store
3. Create the contract results components (KeyTermsSummary, SectionBreakdown, ChatPanel)
4. Create ContractProcessing and ContractResults pages
5. Update routing in App.tsx
6. Update Upload page, Hero, ToolsSection, and Header copy
7. Test end-to-end

