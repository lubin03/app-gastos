# Data Privacy Specification

## Purpose
Políticas y rutinas de encriptación/desencriptación de PII para asegurar la privacidad del usuario.

## Requirements

### Requirement: Encrypt PII at Rest
The system MUST encrypt sensitive fields (Transaction Description, Tags, User details) before persisting to the database.

#### Scenario: Saving a transaction with a description
- GIVEN the user creates a transaction with the description "Dinner at place"
- WHEN the system saves the transaction
- THEN the description field is encrypted using the designated algorithm
- AND the ciphertext is stored in the database

### Requirement: Plaintext Aggregation Fields
The system MUST store aggregation fields (Amount, Date, Category) in plaintext.

#### Scenario: Saving a transaction amount
- GIVEN the user creates a transaction of $50
- WHEN the system saves the transaction
- THEN the amount field is stored in plaintext
- AND allows native database queries like SUM

### Requirement: Decrypt PII in Memory
The system MUST decrypt PII data on-the-fly in the backend memory before sending it to the client.

#### Scenario: Fetching transactions
- GIVEN the user requests their transaction list
- WHEN the backend retrieves encrypted records from the database
- THEN the backend decrypts the descriptions and tags in memory
- AND sends the plaintext data in the API response to the client
