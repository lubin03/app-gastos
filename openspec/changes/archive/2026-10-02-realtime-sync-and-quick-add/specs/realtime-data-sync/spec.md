# Real-Time Data Sync Specification

## Purpose
Provides client-side reactive invalidation and event broadcasting to guarantee that all mounted views, cached Ionic tab pages, and open browser contexts reflect data mutations instantaneously.

## Requirements

### Requirement: Automated Mutation Event Dispatch
The HTTP client wrapper and data mutation handlers MUST broadcast a synchronization event whenever a state-mutating operation (`POST`, `PUT`, `PATCH`, `DELETE`) completes successfully.

#### Scenario: Transaction mutation triggers domain broadcast
- GIVEN the user submits a new or updated transaction via the API client
- WHEN the API response returns a successful HTTP status (200, 201, 204)
- THEN a synchronization event MUST be dispatched containing `transactions` and `accounts` domain tags
- AND GET queries MUST NOT dispatch mutation events

#### Scenario: External direct mutation triggers broadcast
- GIVEN an operation is executed outside standard API client wrappers (such as bulk XLSX file import)
- WHEN the upload completes successfully
- THEN an explicit synchronization broadcast MUST be dispatched to all listeners

### Requirement: Cross-View Subscription and Invalidation
Active and background-mounted pages MUST be able to subscribe to domain-specific sync events and invoke their data reload handlers automatically upon receiving notifications.

#### Scenario: View receives notification for its domain
- GIVEN a page (e.g. `Accounts` or `CreditCards`) is mounted and subscribed to its respective domain
- WHEN a mutation event matching that domain is dispatched
- THEN the subscribed page MUST execute its reload callback and update displayed values

#### Scenario: View ignores unrelated domain mutations
- GIVEN a page is subscribed exclusively to `budgets`
- WHEN a mutation event containing only `creditCards` is dispatched
- THEN the page MUST NOT trigger an unnecessary data reload

### Requirement: Multi-Tab and Multi-Window Synchronization
The synchronization bus SHOULD propagate mutation notifications across open browser windows or tabs without page reloads.

#### Scenario: Mutation across browser tabs
- GIVEN the application is open in two distinct browser tabs
- WHEN a transaction is recorded in Tab A
- THEN Tab B MUST receive the synchronization signal via `BroadcastChannel` or storage events
- AND Tab B MUST refresh its active views to mirror the updated data
