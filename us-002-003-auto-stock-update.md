# Story 002.003: Automatic Stock Update

## Status
Draft

## Story
**As an** inventory manager,
**I want** the system to automatically update the stock quantity of items when I record a new purchase,
**so that** I don't have to do it manually.

## Acceptance Criteria
1. When a new purchase is successfully recorded through the `POST /api/purchases` endpoint, the system automatically identifies the product and updates its stock quantity.
2. The stock update must occur in real-time (e.g., within the same transaction or with less than 1-second delay).
3. The system correctly handles the addition of stock for existing products.
4. The stock update is an integral part of the transactional purchase recording process.

## Tasks / Subtasks
- [ ] Enhance the service layer responsible for `POST /api/purchases` to include product stock quantity updates.
    - [ ] For each `PurchaseOrderItem`, identify the corresponding `Product` and increment its `stock_quantity`.
    - [ ] Ensure the entire operation (purchase record creation + stock update) is atomic and transactional.
- [ ] Update the `Product` data model (if it doesn't exist or doesn't have `stock_quantity`) to include a `stock_quantity` field.
- [ ] Implement a mechanism to handle potential errors during stock update (e.g., product not found) within the transaction.
- [ ] Write unit tests for the updated service layer logic, specifically focusing on the stock update mechanism and its transactional properties. [Source: docs/architecture/testing-strategy.md]
- [ ] Write integration tests for the `POST /api/purchases` endpoint to verify that stock quantities are correctly updated in the database after a successful purchase. [Source: docs/architecture/testing-strategy.md]

## Dev Notes
- **Previous Story Insights**: This story builds directly on `us-002-002-record-purchases.md`, specifically extending the `POST /api/purchases` endpoint. It also implicitly depends on `us-002-001-vendor-management.md` for vendor data.
- **Data Models**: The `PurchaseOrder` and `PurchaseOrderItem` data models are defined in `docs/architecture/data-models.md`. This story will also require access to and modification of a `Product` data model (assuming it exists and includes a `stock_quantity` field). [Source: docs/architecture/data-models.md]
- **API Specifications**: The `POST /api/purchases` endpoint will need to be extended to include the stock update logic within its existing transactional scope. [Source: docs/architecture/api-specifications.md]
- **Component Specifications**: No specific guidance found in architecture docs.
- **File Locations**: The changes will primarily be in the service layer responsible for handling purchase order creation and product inventory management.
- **Testing Requirements**: The testing strategy is outlined in `docs/architecture/testing-strategy.md`. Unit and integration tests must explicitly cover the transactional integrity of the stock update process and verify correct quantity adjustments. [Source: docs/architecture/testing-strategy.md]
- **Technical Constraints**: The stock update *must* be part of the same transaction as the purchase record creation to ensure data consistency. [Source: epic-002-vendor-purchases-management.md#Technical Requirements]

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-12-15 | 1.0 | Initial draft of story for Automatic Stock Update. | Bob (Scrum Master) |

## Dev Agent Record
### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
