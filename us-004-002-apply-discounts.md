# Story 004.002: Apply Discounts

## Status
Draft

## Story
**As a** sales associate,
**I want** to apply discounts to individual items or the entire sale,
**so that** I can process promotions and special offers for customers.

## Acceptance Criteria
1. The POS interface provides a clear way to apply discounts to the cart.
2. The sales associate can apply a percentage discount to a single item in the cart.
3. The sales associate can apply a fixed amount discount to a single item in the cart.
4. The sales associate can apply a percentage discount to the entire cart's subtotal.
5. The sales associate can apply a fixed amount discount to the entire cart's subtotal.
6. When a discount is applied, the cart visually updates to show the discount amount and the new subtotal/total.
7. The system prevents applying a discount that would make an item's price or the total less than zero.

## Tasks / Subtasks
- [ ] Enhance the cart component UI to allow applying discounts.
    - [ ] Add UI elements (e.g., buttons, input fields) for applying discounts to individual items and the total cart (AC: 1).
- [ ] Implement frontend logic for applying discounts.
    - [ ] Add logic for percentage and fixed amount discounts on individual items (AC: 2, 3).
    - [ ] Add logic for percentage and fixed amount discounts on the entire cart (AC: 4, 5).
    - [ ] Ensure the cart's state updates correctly to reflect applied discounts (AC: 6).
    - [ ] Add validation to prevent discounts from making the total negative (AC: 7).
- [ ] Write unit tests for the discount calculation logic, covering all discount types and edge cases. [Source: docs/architecture/testing-strategy.md]
- [ ] Write E2E tests for applying discounts to the cart and verifying the final totals. [Source: docs/architecture/testing-strategy.md]

## Dev Notes
- **Previous Story Insights**: This story builds on `us-004-001-add-items-to-cart.md`. The discount functionality will be integrated with the cart component developed in the previous story.
- **Data Models**: No new data models are required. The discount information will be managed within the frontend state of the cart.
- **API Specifications**: No new API endpoints are required for this story. The discount information will be calculated on the frontend and sent as part of the final sale transaction in a later story.
- **Component Specifications**: The cart component from `us-004-001` will be enhanced to include UI elements for applying discounts (e.g., buttons, input fields).
- **File Locations**: Changes will primarily be in the frontend React SPA, specifically within the cart component and state management logic.
- **Testing Requirements**: As per `docs/architecture/testing-strategy.md`, unit tests (using Jest) are critical for the discount calculation logic. E2E tests (using Cypress) should cover applying different types of discounts and verifying the cart's final total. [Source: docs/architecture/testing-strategy.md]
- **Technical Constraints**: All discount calculations should be performed with precision to avoid rounding errors.

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-12-15 | 1.0 | Initial draft of story for applying discounts. | Bob (Scrum Master) |

## Dev Agent Record
### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
