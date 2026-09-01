# Proposal: UI/UX Modernization & Responsive Polish

## Intent
Elevate the visual design, consistency, and responsive behavior across all 16 web and mobile views. Modernize form inputs, eliminate boxy/square modals and alerts, and add glassmorphic styling and responsive container ergonomics.

## Scope

### In Scope
- Comprehensive theme enhancements in `variables.css` (rounded modal `--border-radius: 24px`, glassmorphic backdrops, alert/popover rounding, pill buttons, responsive layout tokens).
- Form modernization across all pages with standard Ionic 8 floating/stacked labels, `glass-input` styling, and rounded selects.
- Modal & popup upgrades (`TransactionModal`, `MagicModal`, `Accounts`, `Categories`, `Budgets`, `CreditCards`, `Goals`) with rounded corners, backdrop blur, and max-width desktop constraints.
- Responsive container wrapping in web views (centered `max-w-7xl` containers) to avoid stretched UI on wide screens.
- Auth screens visual polish (`Login`, `Register`, `ForgotPassword`, `ResetPassword`) with centered glass cards and gradient buttons.

### Out of Scope
- Backend API logic changes.
- Database schema changes.

## Capabilities

### New Capabilities
- `ui-design-system`: Global glassmorphism, responsive container layout tokens, modern modal dialog specs, and form input standards.

### Modified Capabilities
- None

## Approach
Extend `variables.css` with a modern Glassmorphism UI tokens system (dialogs, sheet modals, popovers, alerts, inputs, badges). Refactor existing page forms and modal components to use standard Ionic 8 label placement and rounded container classes. Add desktop container centering to preserve aesthetics across screen sizes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/theme/variables.css` | Modified | Modal, alert, input, popover, and responsive tokens |
| `frontend/src/App.tsx` | Modified | Tab bar and viewport layout styling |
| `frontend/src/components/*` | Modified | TransactionModal, MagicModal, and Header responsive polish |
| `frontend/src/pages/*` | Modified | 16 screens updated to unified modern input and modal design |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Small screen modal overflow | Low | Set `max-height: 85vh` and scrollable content inside modals |
| Light theme contrast degradation | Low | Validate color variables in both dark and light modes |

## Rollback Plan
Revert changes to `frontend/src/theme/variables.css` and affected page/component files via `git checkout`.

## Dependencies
- None (uses existing Ionic 8, React 19, Recharts setup).

## Success Criteria
- [ ] All modals, popovers, and alerts display rounded corners (20px-24px) and glassmorphic styling.
- [ ] Forms on all screens use modern non-square inputs with proper label placement and clear focus states.
- [ ] Desktop screens remain centered with elegant proportions instead of stretching edge-to-edge.
- [ ] Mobile navigation and sheet modals feel native and ergonomic.
