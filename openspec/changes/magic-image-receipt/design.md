# Technical Design: Magic Image Receipt

## 1. Architecture

### Frontend (Ionic React)
We will modify the `MagicModal.tsx` component:
- Add a hidden file input using `useRef`: `<input type="file" accept="image/*" capture="environment" hidden ref={fileInputRef} onChange={handleImageSelect} />`
- Add a new "camera" button next to the textarea or the microphone button.
- When an image is selected, it will be drawn to an HTML5 `<canvas>` element for compression. The image will be scaled down proportionally so the maximum dimension (width or height) is 1024px.
- Extract the base64 payload from the canvas (`canvas.toDataURL('image/jpeg', 0.8)`).
- Call `submitToApi({ imageBase64: base64Data, imageMimeType: 'image/jpeg' })`.

### Backend (Express & Google Generative AI)
We will modify `createMagicTransaction` in `backend/src/controllers/magic.ts`:
- Destructure `imageBase64` and `imageMimeType` from `req.body`.
- Ensure either `text`, `audioBase64`, or `imageBase64` is provided.
- If `imageBase64` is present, construct a `inlineData` part:
```javascript
parts.push({
  inlineData: {
    mimeType: imageMimeType,
    data: imageBase64
  }
});
```
- Update the prompt dynamically: `User provided an image of a receipt. Please parse the transaction.` instead of the audio text. Or a unified prompt:
```javascript
const inputContext = text 
  ? `User input: "${text}"`
  : audioBase64 
    ? 'User provided an audio recording of their input in Spanish. Please transcribe and listen carefully.'
    : 'User provided an image of a receipt/ticket. Please read the image carefully and extract the main transaction details.';
```
- Add fallback instructions for images: "If the image is not a receipt or is completely unreadable, set the transcript field to 'SILENCE' or 'INVALID_IMAGE'."

## 2. API Contract Changes

**POST /transactions/magic**
*New Optional Request Body Fields:*
- `imageBase64` (string): The base64 representation of the compressed image.
- `imageMimeType` (string): Usually 'image/jpeg' or 'image/png'.

*Response:* Unchanged.

## 3. Risks & Mitigations
- **Risk**: Very large images causing Request Payload Too Large (413).
  - **Mitigation**: The frontend must compress the image using HTML5 canvas before converting to base64. Limit to 1024x1024 resolution and 80% JPEG quality.
- **Risk**: Hallucinated expenses from irrelevant images (e.g., a photo of a dog).
  - **Mitigation**: Prompt instruction strictly demanding "If no valid expense/income data is found in the image, output transcript: 'INVALID_IMAGE' and amount 0." We will catch this in the backend and return a 400 error.
