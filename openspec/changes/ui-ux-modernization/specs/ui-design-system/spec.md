# UI Design System Specification

## Purpose
Defines the visual, ergonomic, and responsiveness requirements for modal popups, forms, inputs, navigation, and cross-platform screen layouts.

## Requirements

### Requirement: Glassmorphic Modal and Popup Aesthetics
The application MUST display all modals, alerts, and popovers with rounded corners, subtle glassmorphic backdrop filters, and desktop max-width constraints.

#### Scenario: Opening a form modal on desktop
- GIVEN a user on a wide screen (desktop / tablet)
- WHEN the user opens a modal (e.g. TransactionModal, Account creation, MagicModal)
- THEN the modal MUST render with `--border-radius: 24px`
- AND the modal MUST NOT stretch full-width (max-width capped at 580px)
- AND the background MUST display backdrop blur glassmorphism.

#### Scenario: Opening a sheet modal on mobile
- GIVEN a user on a mobile device
- WHEN a bottom sheet modal is triggered
- THEN the top corners MUST be rounded (minimum 20px radius)
- AND the modal content MUST be fully scrollable with safe-area padding.

### Requirement: Form Input Usability and Modern Styling
All interactive form inputs, selects, textareas, and date pickers MUST use rounded glass containers (`lines="none"`, `16px` border-radius) with explicit floating or stacked label placements.

#### Scenario: Interacting with form inputs
- GIVEN any screen containing inputs (Login, Transactions, Accounts, Budgets, Goals, Profile)
- WHEN the user views or focuses an input field
- THEN the input MUST render inside a rounded container (`glass-input`) with no harsh square outlines
- AND the active focus state MUST highlight with the primary accent color without layout shift.

### Requirement: Responsive Desktop Layout Centering
The application MUST center wide content views within responsive constraints rather than stretching single column lists across the entire display.

#### Scenario: Viewing dashboard and lists on desktop
- GIVEN a viewport width greater than 768px
- WHEN navigating across dashboard, accounts, budgets, or reports
- THEN the container MUST be horizontally centered with maximum width limits (1200px)
- AND grid cards MUST display in multi-column rows where appropriate.
