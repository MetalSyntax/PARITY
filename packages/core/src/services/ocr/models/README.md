# OCR model weights

Nothing lives in this directory yet. Per `.plans/parity_invoice_ocr_plan.md` §4, the
default local OCR path is meant to run PaddleOCR's multilingual detection +
recognition + angle-classification models, converted to ONNX, via
`onnxruntime-web`. That conversion — and the go/no-go on Spanish/accent/ñ
accuracy and phone-class inference time — is the Phase 0 spike and hasn't run
yet, so `PaddleOcrInvoiceProvider` (`../providers/paddleOcrProvider.ts`)
currently delegates to an injected `OcrTextRecognizer` (a Tesseract.js wrapper
today) instead of loading anything from here.

## Contract once the spike lands

- Combined `det` + `rec` + `cls` ONNX weights, ~10-20MB total.
- Hosted alongside the app build (not npm-published) and **lazy-loaded** the
  first time the user opens the scan flow — never bundled into the initial
  app load.
- Cached via the existing Workbox service worker (`vite-plugin-pwa`) so the
  download happens once per install, not once per session.
- Swap-out point: implement a new `OcrTextRecognizer` (or a richer
  box-returning interface, if layout-aware parsing lands at the same time)
  backed by `onnxruntime-web` inference over these weights, and inject it into
  `PaddleOcrInvoiceProvider` in place of the Tesseract wrapper. No change to
  `InvoiceOcrProvider`, `invoiceOcr.ts`, or any caller is required.
