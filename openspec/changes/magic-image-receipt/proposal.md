## Proposal: Magic Image Receipt

### Intent
Allow users to upload or capture an image of a receipt/ticket and have the AI automatically parse the transaction details (amount, category, description, account) just as it currently does with text and audio inputs.

### Proposed Approach
Extend the existing `MagicModal` flow to accept image inputs via a new camera/gallery button. 

1. **Frontend**: Add a hidden `<input type="file" accept="image/*" capture="environment">` to `MagicModal.tsx`.
   - When a user selects an image, compress it slightly (e.g. using a canvas to scale it down to a max width/height of 1024px to save bandwidth).
   - Convert the compressed image to a base64 string.
   - Send the `imageBase64` payload to the `POST /transactions/magic` endpoint alongside the (optional) text and `mimeType`.
   - Add a loading state indicating the image is being processed.
2. **Backend**: Modify `magic.ts` in `createMagicTransaction`.
   - Check for `req.body.imageBase64`.
   - If present, append it as an `inlineData` part to the Gemini prompt array.
   - Adjust the system prompt slightly to explicitly mention: `User provided an image of a receipt. Extract the items, determine the total amount...`
   - Gemini 1.5 Flash / Flash-lite handles images natively, so parsing will be identical to audio/text.

### Scope and Impact
- **Impacted Files**:
  - `frontend/src/components/MagicModal.tsx`
  - `backend/src/controllers/magic.ts`
- **Database**: No schema changes required.
- **Dependencies**: None. Multimodality is natively supported by the existing `@google/generative-ai` package used in the backend.
- **Backward Compatibility**: Completely backwards compatible, as text and audio flows remain untouched.
