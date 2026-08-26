# Authentication Specification

## Purpose
Registro, login y protección de rutas.

## Requirements

### Requirement: Email/Password Authentication
The system MUST allow users to register and log in using an email and password.

#### Scenario: Successful registration
- GIVEN the user provides a valid email and strong password
- WHEN the user submits the registration form
- THEN the system creates the user account
- AND authenticates the user

#### Scenario: Failed login due to invalid credentials
- GIVEN the user has a registered account
- WHEN the user attempts to log in with an incorrect password
- THEN the system denies access
- AND displays an invalid credentials error message

### Requirement: Google OAuth Authentication
The system SHALL allow users to register and log in using Google Auth.

#### Scenario: Successful login with Google
- GIVEN the user chooses to log in with Google
- WHEN the user grants permission via the Google OAuth flow
- THEN the system authenticates the user
- AND redirects them to the Dashboard
