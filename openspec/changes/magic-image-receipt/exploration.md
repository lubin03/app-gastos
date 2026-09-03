## Exploration: Magic Image Receipt

### Current State
Currently, the system uses the `MagicModal.tsx` component in the frontend to capture text or record audio, which is then sent to the `POST /transactions/magic` endpoint. The backend controller (`backend/src/controllers/magic.ts`) receives `text` or `audioBase64` and uses `gemini-3.5-flash-lite` to extract transaction details based on the user's existing categories and accounts. 

### Affected Areas
- `frontend/src/components/MagicModal.tsx` — Needs a new UI element (e.g., a camera or gallery icon button) to select or capture an image. Also needs to handle converting the file to base64.
- `backend/src/controllers/magic.ts` — Needs to receive `imageBase64` in the request body and include it in the Gemini parts array. The prompt should be slightly adjusted to mention that a receipt image was provided.

### Approaches
1. **Extend Existing Magic Flow** — Add an image upload button to `MagicModal` and modify the existing `/transactions/magic` endpoint to handle `imageBase64`.
   - Pros: Reuses all the existing parsing, category resolution, and DB insertion logic. Familiar UI for the user.
   - Cons: Modal might get slightly crowded.
   - Effort: Low

2. **Create a Dedicated Receipt Scanner** — Create a separate UI flow (e.g., a dedicated "Scan Receipt" button on the fab) and a new `/transactions/receipt` endpoint.
   - Pros: Clean separation of concerns.
   - Cons: Duplicates 90% of the logic in `magic.ts`.
   - Effort: Medium

### Recommendation
**Extend Existing Magic Flow**. The logic for resolving categories, matching accounts, and inserting the transaction is identical. Gemini handles multimodal inputs natively, so adding an image is just pushing another `inlineData` part to the model, exactly like audio.

### Risks
- **Image Size**: Large photos from modern phones (e.g., 5MB-10MB) might slow down the API request. We should ideally compress/resize the image in the frontend before sending the base64 string to the backend.
- **Model Capabilities**: We need to ensure `gemini-3.5-flash-lite` has good enough OCR capabilities for crinkled or low-light receipts.

### Ready for Proposal
Yes. The path forward is clear and low effort.
