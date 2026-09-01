# Tasks: UI/UX Modernization & Responsive Polish

## Phase 1: Global Theme & Container Infrastructure

- [x] 1.1 Update `frontend/src/theme/variables.css` with global `--border-radius: 24px` for `ion-modal`, rounded `ion-alert` and `ion-popover`, glassmorphism backdrop filters, and desktop modal width/height constraints.
- [x] 1.2 Add `.app-container` responsive wrapper utility with `max-width: 1200px` and responsive padding tokens to `variables.css`.
- [x] 1.3 Add unified form input tokens (`.glass-input`, focus ring transitions, rounded border-radius `16px`) in `variables.css`.
- [x] 1.4 Refactor `frontend/src/App.tsx` tab bar layout with centered container constraint and touch-friendly button sizing.

## Phase 2: Modals & Popups Modernization

- [x] 2.1 Refactor `frontend/src/components/TransactionModal.tsx` to use `.glass-modal`, modern `labelPlacement="floating"`, rounded attachment list, and pill CTA buttons.
- [x] 2.2 Refactor `frontend/src/components/MagicModal.tsx` with rounded glass container, smooth micro-interactions, and styled text area.
- [x] 2.3 Refactor `frontend/src/pages/Accounts.tsx` account creation/edit modal and pay modal to use `.glass-modal`, `.glass-input`, and rounded institution list.
- [x] 2.4 Refactor `frontend/src/pages/Categories.tsx` modal to use `.glass-modal` and modern floating labels.
- [x] 2.5 Refactor `frontend/src/pages/Budgets.tsx` modal to use `.glass-modal` and `.glass-input`.
- [x] 2.6 Refactor `frontend/src/pages/CreditCards.tsx` invoice details modal and payment modal with rounded sheet styling.
- [x] 2.7 Refactor `frontend/src/pages/Goals.tsx` goal creation/edit modal with `.glass-modal` and rounded progress bars.

## Phase 3: Forms & Responsive Screen Polish

- [x] 3.1 Refactor Auth screens (`Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`) with centered glass card container, modern `labelPlacement`, and pill gradient buttons.
- [x] 3.2 Apply `.app-container` and responsive multi-column layout to `Dashboard.tsx`.
- [x] 3.3 Apply `.app-container` and modern transaction item styling to `Transactions.tsx`.
- [x] 3.4 Polish `Reports.tsx` and `Insights.tsx` with rounded segmented buttons and modern chart wrappers.
- [x] 3.5 Polish `Profile.tsx` forms and danger zone card with unified glass inputs.

## Phase 4: Verification & Testing

- [x] 4.1 Run unit tests (`npm run test.unit -- --run` in frontend and `npm test` in backend) to verify zero regression.
- [x] 4.2 Verify responsive layout rendering on web and mobile viewports with production build.

