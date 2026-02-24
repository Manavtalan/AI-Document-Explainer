

# Fix: Document Analysis Failing on PDF Upload

## Root Cause

The PDF text extraction crashes on the client side before any request is sent to the backend. The error "We could not read this file" is a catch-all from the `safeExtractText` function.

**The bug**: `pdfjs-dist` is installed at **version 5.x** but the worker URL in `textExtraction.ts` points to the **version 3.x** CDN:

```
// Current (BROKEN - v3 worker with v5 library)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
```

PDF.js requires the worker version to exactly match the library version. This mismatch causes a silent crash during `getDocument()`, which gets caught as a generic "corrupted" error.

## Fix

### File: `src/lib/textExtraction.ts`

Update the worker configuration to work with pdfjs-dist v5.x. In v5, the worker can be imported directly as a module instead of using a CDN URL:

```typescript
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

This approach:
- Bundles the worker with the app via Vite's `?url` import
- Guarantees version parity between library and worker
- Eliminates CDN dependency and external network requests
- Works reliably with pdfjs-dist v5.x

## Summary

| Item | Detail |
|------|--------|
| **Problem** | PDF.js v5 library + v3 worker = crash |
| **Symptom** | "We could not read this file" on every PDF |
| **Fix** | Import worker from the installed package |
| **Files changed** | `src/lib/textExtraction.ts` (2 lines) |

