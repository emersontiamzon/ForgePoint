# Story 002.002: Record Purchases

## Status
Draft

## Story
**As an** inventory manager,
**I want** to record purchases from vendors,
**so that** new stock is logged in the system.

## Acceptance Criteria
1. The system provides an interface to record new purchases.
2. The purchase record includes the vendor, items purchased, and quantities.
3. The system checks for duplicate Purchase Order reference numbers for the same vendor and warns the user.
4. A confirmation step is required before finalizing a purchase, allowing the user to review all details.
5. The purchase recording process is transactional.

## Tasks / Subtasks
- [ ] Implement the `PurchaseOrder` and `PurchaseOrderItem` data models in the database according to `docs/architecture/data-models.md`.
- [ ] Create the service layer logic for purchase order creation, ensuring the process is transactional.
    - [ ] Implement logic to check for duplicate `po_reference` numbers for the same vendor.
- [ ] Implement the following API endpoints as specified in `docs/architecture/api-specifications.md`:
    - [ ] `POST /purchases` (AC: 1, 2, 3, 5)
    - [ ] `GET /purchases`
    - [ ] `GET /purchases/{id}`
- [ ] Design and implement the UI for recording purchases (AC: 1, 4).
    - [ ] Include a product search feature (by SKU or name).
    - [ ] Implement a confirmation step before finalizing the purchase.
- [ ] Write unit tests for the purchase order service layer, including tests for the duplicate check and transactional behavior. [Source: docs/architecture/testing-strategy.md]
- [ ] Write integration tests for the Purchase Order API endpoints. [Source: docs/architecture/testing-strategy.md]

## Dev Notes
- **Previous Story Insights**: This story depends on the vendor data created in story `us-002-001`. The purchase recording process will need to reference a vendor.
- **Data Models**: The `PurchaseOrder` and `PurchaseOrderItem` data models are defined in `docs/architecture/data-models.md`. [Source: docs/architecture/data-models.md]
- **API Specifications**: The Purchase Order API endpoints are defined in `docs/architecture/api-specifications.md`. This story will focus on `POST /purchases`, `GET /purchases`, and `GET /purchases/{id}`. [Source: docs/architecture/api-specifications.md]
- **Component Specifications**: The UI should feature robust product search and selection (by SKU or name). [Source: epic-002-vendor-purchases-management.md#Risk Mitigation]
- **File Locations**: Based on existing conventions, new files should align with the overall project structure.
- **Testing Requirements**: The testing strategy is outlined in `docs/architecture/testing-strategy.md`. Unit tests for the service layer and integration tests for the API endpoints are required, with a focus on transactional integrity. [Source: docs/architecture/testing-strategy.md]
- **Technical Constraints**: The purchase recording process must be transactional. [Source: epic-002-vendor-purchases-management.md#Technical Requirements]

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-12-15 | 1.0 | Initial draft of story for Recording Purchases. | Bob (Scrum Master) |

## Dev Agent Record
### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
