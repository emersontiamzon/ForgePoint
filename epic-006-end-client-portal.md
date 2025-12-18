# Epic: End-Client Portal

## Epic Goal

To provide the business's end-clients (e.g., contractors, builders) with a self-service portal to view products, create project cost estimations, and submit quotes for approval.

## Epic Description

This epic focuses on creating a dedicated portal for the customers of the businesses using ForgePoint. This feature adds significant value by empowering end-clients, reducing the quoting workload for the business owner, and improving client relationships.

- **What's being built:** A secure, personalized portal where end-clients can log in to view the business's product catalog. Clients will be able to add items to a "project list" to estimate costs and then submit this list as a formal quote request to the business.
- **Success criteria:**
  - End-clients can log in and view a product catalog.
  - End-clients can create a project list and see an estimated total cost.
  - End-clients can submit their project list as a quote request, which then appears for the business owner to review.

## Stories

*(To be defined)*

1.  **Story:** As an end-client, I want to log in to a portal to see the products offered by my supplier.
2.  **Story:** As an end-client, I want to browse or search the product catalog.
3.  **Story:** As an end-client, I want to add items to a project list to create a self-service cost estimation for my project.
4.  **Story:** As an end-client, I want to submit my project list as a formal quote request to the business.
5.  **Story:** As a business owner, I want to receive and review quote requests submitted by my clients.

## Technical Requirements

-   The portal will be part of the main React web application but will display a different UI for users with the "End-Client" role.
-   Access to the portal will be controlled by the Auth system (Epic-003). End-clients will have their own user accounts.
-   The product catalog data will be read-only for end-clients.
-   A new data model for "Quotes" or "Project Lists" will need to be created in the PostgreSQL database.

## Risk Mitigation

- **Primary Risk:** End-clients seeing incorrect pricing or product information.
- **Mitigation:**
  - The portal will consume the same product data API as the main POS, ensuring consistency.
  - Caching on product data will have a clear expiration/invalidation strategy to prevent stale data.
- **Primary Risk:** Confusion between estimated costs and a formal, binding quote.
- **Mitigation:**
  - The UI will clearly label all totals as "Estimated Cost" until a business owner reviews and approves the quote request.
  - An email notification will be sent to the client when their quote is formally approved.

## Definition of Done

- [ ] All stories completed with acceptance criteria met.
- [ ] End-to-end flow for a client creating and submitting a quote is fully tested.
- [ ] Business owners can view and manage client-submitted quote requests.
- [ ] The portal is secure and prevents clients from accessing any data outside of their intended scope.
