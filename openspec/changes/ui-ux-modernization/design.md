# Design: UI/UX Modernization & Responsive Layout

## Technical Approach
Implement a centralized glassmorphic design token system in `frontend/src/theme/variables.css` overriding Ionic modal, popover, alert, and form input shadow-DOM variables. Update all form inputs to Ionic 8 standard `labelPlacement="floating"` / `labelPlacement="stacked"` with `.glass-input` classes, and wrap main views in responsive container constraints (`.app-container`).

## Architecture Decisions

### Decision: Centralized Ionic CSS Shadow-DOM Custom Properties
**Choice**: Configure `ion-modal`, `ion-alert`, `ion-popover`, and `ion-item.glass-input` at the root CSS layer.
**Alternatives considered**: Ad-hoc inline CSS per component.
**Rationale**: Ad-hoc styles create visual drift and require duplicating border-radius rules across 16 files. Root CSS guarantees global consistency and maintains clean JSX.

### Decision: Responsive Desktop Container Utility
**Choice**: Introduce `.app-container` with `max-width: 1200px; margin: 0 auto; width: 100%;` applied inside `IonContent`.
**Alternatives considered**: Full-width stretching.
**Rationale**: Prevents wide monitors from stretching forms, tables, and modal triggers into unreadable single-line bands.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/theme/variables.css` | Modify | Add global modal border-radius (24px), glass backdrops, responsive modal media queries, alert/popover styling, `.app-container` |
| `frontend/src/App.tsx` | Modify | Tab bar container constraint and responsive padding |
| `frontend/src/components/TransactionModal.tsx` | Modify | Modernize input labels, file attachment styling, save CTA button |
| `frontend/src/components/MagicModal.tsx` | Modify | Rounded backdrop, text area and audio button polish |
| `frontend/src/pages/Accounts.tsx` | Modify | Apply `.glass-input` and modern `labelPlacement` to account & pay modals |
| `frontend/src/pages/Budgets.tsx` | Modify | Modernize budget form and progress bars |
| `frontend/src/pages/Categories.tsx` | Modify | Modernize category modal form and items |
| `frontend/src/pages/CreditCards.tsx` | Modify | Modernize invoices sheet modal and pay modal |
| `frontend/src/pages/Goals.tsx` | Modify | Refactor goal modal inputs and progress visualizers |
| `frontend/src/pages/Login.tsx` / `Register.tsx` | Modify | Center auth form inside a glass card with modern inputs |
| `frontend/src/pages/Profile.tsx` | Modify | Modernize profile fields, password inputs, and danger zone |
| `frontend/src/pages/Dashboard.tsx` | Modify | Apply `.app-container` and responsive multi-column grid |
| `frontend/src/pages/Reports.tsx` & `Insights.tsx` | Modify | Modernize chart card containers and segmented controls |

## Interfaces / Contracts

```css
/* Core Global Modal & Popup Tokens */
ion-modal {
  --border-radius: 24px;
  --backdrop-opacity: 0.65;
}
ion-modal.glass-modal {
  --background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
@media (min-width: 768px) {
  ion-modal.glass-modal {
    --width: 580px;
    --max-width: 90vw;
    --height: auto;
    --max-height: 88vh;
    --border-radius: 24px;
  }
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Frontend test suite passes | Run `pnpm test.unit` |
| Integration | Component rendering with updated classes | Vitest component tests |
| Visual / E2E | Web & Mobile responsiveness & modal rendering | Browser checks & Cypress |

## Migration / Rollout
No migration required. Pure frontend styling and UX refactor.
