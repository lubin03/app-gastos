# Specification: Magic Image Receipt

## 1. Feature Description
Allow users to capture or upload an image of a receipt using the Magic Add modal. The image will be processed by the multimodal Gemini LLM to automatically extract the expense amount, category, account, and description, inserting it into the database seamlessly, similar to the existing text and audio flows.

## 2. Requirements

### 2.1 Functional Requirements
- **F.1**: The MagicModal must have an "Add Image" button (camera/gallery icon).
- **F.2**: Tapping the "Add Image" button must open the native file picker or camera, accepting image formats (e.g. `image/jpeg`, `image/png`).
- **F.3**: Selected images must be scaled/compressed in the frontend (e.g. max 1024px width/height) to reduce upload time.
- **F.4**: The compressed image must be converted to base64.
- **F.5**: The `POST /transactions/magic` payload must support an `imageBase64` field and an `imageMimeType` field.
- **F.6**: The backend must append the image data as `inlineData` to the Gemini API prompt if `imageBase64` is provided.
- **F.7**: The LLM prompt must be updated to instruct the model to extract the transaction details from the receipt image if provided.
- **F.8**: The modal must display a loading spinner while processing the image.

### 2.2 Non-Functional Requirements
- **NF.1**: Backward compatibility — the text and audio inputs must continue working as before.
- **NF.2**: The backend should handle cases where the image is too blurry by relying on the LLM's fallback logic (e.g., returning an error string or throwing an exception to be caught).

## 3. Scenarios

### 3.1 Uploading a valid receipt
- **Given** the MagicModal is open
- **When** the user taps the Image button and selects a clear photo of a receipt for $25.50
- **Then** the image is processed and the API responds with a successful expense of $25.50, and the modal closes.

### 3.2 Uploading an invalid/blurry image
- **Given** the MagicModal is open
- **When** the user selects a photo of a brick wall
- **Then** the LLM fails to find a valid transaction, the API returns a 400 error ("No se encontró un gasto en la imagen"), and the user is notified.
