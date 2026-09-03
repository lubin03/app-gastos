# Tasks: Magic Image Receipt

- `[ ]` **Backend: Update Magic Controller**
  - Modify `c:\Laboratorios\app-gastos\backend\src\controllers\magic.ts`.
  - Destructure `imageBase64` and `mimeType` (or `imageMimeType`) from `req.body`.
  - Update validation to require `text`, `audioBase64`, OR `imageBase64`.
  - Inject `imageBase64` into the Gemini `parts` array as `inlineData` if provided.
  - Dynamically adjust the system prompt to explicitly mention handling a receipt image and extracting its details if `imageBase64` is provided. Handle 'INVALID_IMAGE' gracefully by returning a 400 error.

- `[ ]` **Frontend: Update MagicModal UI and Image Processing**
  - Modify `c:\Laboratorios\app-gastos\frontend\src\components\MagicModal.tsx`.
  - Add an `<input type="file" accept="image/*" capture="environment" hidden />` element.
  - Add a button with an `imageOutline` or `cameraOutline` icon next to the microphone/text input area.
  - Implement the `onChange` handler for the file input to read the selected file.
  - Implement a `compressImage` utility function using HTML5 `<canvas>` to resize the image to a maximum dimension of 1024px.
  - Convert the canvas output to base64 and extract the data portion.
  - Update `submitToApi` call to accept `imageBase64` and pass it to the backend.
  - Show loading state while compressing and uploading.

- `[ ]` **Frontend: Update Translations** (Optional but recommended)
  - Ensure any new tooltips or errors (like 'Error procesando imagen') are internationalized or fallback to Spanish properly in the UI.

- `[ ]` **Verification**
  - Test uploading a valid receipt image.
  - Test uploading a random non-receipt image (should fail gracefully).
  - Verify that text and audio still work correctly.
