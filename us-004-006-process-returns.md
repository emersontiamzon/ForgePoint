# Story 004.006: Process Returns

## Status
Draft

## Story
**As a** sales associate,
**I want** to be able to process customer returns and issue refunds,
**so that** I can handle customer service needs and maintain accurate inventory and sales records.

## Acceptance Criteria
1. The POS interface allows a sales associate to initiate a return process for a previously completed sale.
2. The associate can find a sale by searching for a receipt ID, transaction ID, or customer information.
3. The system displays the items originally purchased in the selected sale, along with their quantities, original prices, and any applied discounts.
4. The associate can select specific `SaleItem`s from the original sale to be returned, specifying the quantity of each.
5. The system automatically calculates the refund amount based on the returned items' original prices, proportional discounts, and taxes.
6. The system facilitates processing refunds to the original payment method (e.g., credit card refund via Stripe, cash refund for cash purchases).
7. Upon successful return processing, the system updates inventory levels to reflect the returned items (unless marked as unsellable).
8. The system generates a return receipt for the customer, detailing the returned items and refund amount.

## Tasks / Subtasks
- [ ] Develop UI components for initiating a return.
    - [ ] Sales search component (by ID, transaction ID, or other criteria).
    - [ ] Display original sale details, including `SaleItems`.
- [ ] Develop UI components for selecting items to return and specifying quantities.
- [ ] Implement frontend logic for calculating refund amounts based on selected items, original prices, discounts, and taxes.
- [ ] Develop UI for confirming the return and initiating the refund.
- [ ] Implement frontend logic to call the `POST /api/returns` endpoint.
    - [ ] Send `sale_id`, `returned_items` details, and `refund_method`.
- [ ] Implement backend service logic for `POST /api/returns`.
    - [ ] Validate return request against original sale data.
    - [ ] Calculate refund amount on the backend for verification.
    - [ ] Process refunds via Stripe API for credit card payments or mark as cash refund.
    - [ ] Record `Return` details in the database transactionally.
    - [ ] Update inventory levels for returned items (increment `stock_quantity`).
- [ ] Implement backend logic for generating a return receipt.
- [ ] Write unit tests for refund calculation and inventory update logic. [Source: docs/architecture/testing-strategy.md]
- [ ] Write integration tests for the `POST /api/returns` endpoint, covering various return scenarios and Stripe refund integration. [Source: docs/architecture/testing-strategy.md]
- [ ] Write E2E tests for the full return and refund workflow. [Source: docs/architecture/testing-strategy.md]

## Dev Notes
- **Previous Story Insights**: This story builds on `us-004-004-process-payments.md` and `us-004-005-generate-receipts.md`. It requires access to historical `Sale`, `Payment`, and `SaleItem` data. It also interacts with inventory updates from `us-002-003`.
- **Data Models**: The `Sale`, `Payment`, `SaleItem`, and `Product` models are all relevant. The new `Return` data model (defined in `docs/architecture/data-models.md`) will be used to record the return transaction. [Source: docs/architecture/data-models.md]
- **API Specifications**:
    - `GET /api/sales/{id}` will be used to retrieve original sale details. [Source: docs/architecture/api-specifications.md]
    - A new endpoint `POST /api/returns`, defined in `docs/architecture/api-specifications.md`, will be implemented to process the return. This endpoint should be transactional. [Source: docs/architecture/api-specifications.md]
    - Enhanced `GET /api/sales` with search parameters might be needed to find sales for return by various criteria.
- **Component Specifications**: New UI components for searching sales, displaying sale details, selecting items for return, confirming refund amounts, and processing refunds will be required.
- **File Locations**: New frontend components for the return workflow. New backend service logic for `POST /api/returns`, including refund processing (Stripe integration for credit cards), inventory updates, and return record creation.
- **Testing Requirements**: As per `docs/architecture/testing-strategy.md`, comprehensive unit tests (using Jest) for refund calculation logic, integration with Stripe refunds, and inventory updates are critical. Integration tests (using Supertest with Jest) for `POST /api/returns` endpoint. E2E tests (using Cypress) for various return scenarios (full return, partial return, cash, credit card refund). [Source: docs/architecture/testing-strategy.md]
- **Technical Constraints**: Returns and refunds are highly sensitive financial transactions and must be fully transactional on the backend to ensure data integrity. Integration with Stripe's refund API will be necessary for credit card refunds. [Source: epic-004-pos.md#Risk Mitigation]

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-12-15 | 1.0 | Initial draft of story for processing returns. | Bob (Scrum Master) |

## Dev Agent Record
### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
