# Story 004.005: Generate Receipts

## Status
Draft

## Story
**As a** sales associate,
**I want** to generate a digital or printed receipt for the customer,
**so that** customers have proof of purchase and I can provide good customer service.

## Acceptance Criteria
1. Upon successful completion of a sale (via `POST /api/sales`), the system provides an option to immediately generate and print a receipt.
2. The printed receipt includes essential transaction details: `SaleItems` (product name, quantity, unit price, item discount), total discount, total tax, total amount, payment method, date/time of sale, and store information.
3. The system provides an option to generate a digital receipt after a sale.
4. The digital receipt can be sent via email to a customer-provided address, containing the same essential transaction details as the printed receipt.
5. The sales associate can retrieve a past sale using a sale ID or date/time and re-print or re-send its receipt.

## Tasks / Subtasks
- [ ] Create a frontend UI component to render a receipt based on `Sale` data.
    - [ ] Display all required transaction details (AC: 2).
- [ ] Implement print functionality for the rendered receipt.
- [ ] Implement UI and logic for sending digital receipts.
    - [ ] Provide an input field for customer email.
    - [ ] Call a backend API endpoint (e.g., `POST /api/sales/{id}/send-receipt-email`) to send the digital receipt.
- [ ] Enhance the `POST /api/sales` endpoint to return the complete `Sale` object upon successful creation for immediate receipt generation.
- [ ] Implement the `GET /api/sales/{id}` endpoint to retrieve full sale details, including `SaleItems` and `Payment`.
- [ ] Implement a backend API endpoint (`POST /api/sales/{id}/send-receipt-email`) to handle sending digital receipts via email.
- [ ] Write unit tests for receipt formatting and email generation logic. [Source: docs/architecture/testing-strategy.md]
- [ ] Write integration tests for the `GET /api/sales/{id}` endpoint and the `POST /api/sales/{id}/send-receipt-email` endpoint. [Source: docs/architecture/testing-strategy.md]
- [ ] Write E2E tests for printing and emailing receipts, and for retrieving and re-issuing receipts for past sales. [Source: docs/architecture/testing-strategy.md]

## Dev Notes
- **Previous Story Insights**: This story builds on `us-004-004-process-payments.md` as receipt generation follows a completed sale. It relies on the `Sale`, `Payment`, and `SaleItem` data being correctly recorded.
- **Data Models**: The `Sale`, `Payment`, and `SaleItem` data models (defined in `docs/architecture/data-models.md`) will be the primary source of information for receipt content. [Source: docs/architecture/data-models.md]
- **API Specifications**:
    - The `POST /api/sales` endpoint will be modified to return the full `Sale` object (or at least its ID) upon completion to facilitate immediate receipt generation. [Source: docs/architecture/api-specifications.md]
    - The `GET /api/sales/{id}` endpoint, defined in `docs/architecture/api-specifications.md`, will be used to fetch past sale details for re-printing/re-sending. [Source: docs/architecture/api-specifications.md]
    - A new backend API endpoint `POST /api/sales/{id}/send-receipt-email` might be needed to securely handle sending digital receipts, especially if it involves templates or complex email services. [Source: docs/architecture/api-specifications.md]
- **Component Specifications**: New UI components for displaying receipts, print functionality, and an email input field for digital receipts will be required.
- **File Locations**: New frontend components for receipt display and email functionality. New backend service logic for sending digital receipts via email.
- **Testing Requirements**: As per `docs/architecture/testing-strategy.md`, unit tests (using Jest) for receipt formatting, integration tests (using Supertest with Jest) for fetching sale data (`GET /api/sales/{id}`) and the email sending API, and E2E tests (using Cypress) for printing and emailing receipts. [Source: docs/architecture/testing-strategy.md]
- **Technical Constraints**: Receipt generation should be fast. Email sending should be reliable and include error handling.

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-12-15 | 1.0 | Initial draft of story for Generate Receipts. | Bob (Scrum Master) |

## Dev Agent Record
### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
