**ForgePoint Dashboard - Pre-Development Plan (Addressing Must-Fixes)**

This document outlines the proposed strategy for the critical
pre-development tasks required before starting the main build phase of
the ForgePoint Dashboard.

**1. Define the Development Environment**

We will define a modern, scalable, and efficient development stack.

  ----------------------------------------------------------------------------------------
  **Component**   **Technology**   **Version/Tool**   **Rationale**
  --------------- ---------------- ------------------ ------------------------------------
  **Frontend**    React (SPA)      **Vite +           Uses Vite for lightning-fast
                                   TypeScript**       bundling/HMR and TypeScript for
                                                      improved type safety and
                                                      maintainability.

  **Styling**     Tailwind CSS     Latest stable      Utility-first approach for rapid,
                                   version            consistent, and responsive styling.

  **Backend**     Node.js /        Latest LTS         Fast, scalable, unified JavaScript
                  Express                             stack.

  **Database**    PostgreSQL       Cloud SQL (GCP)    Robust, enterprise-grade relational
                                                      database for transactional data
                                                      (Inventory, Sales, Quotes).

  **Tooling**     VS Code          Prettier, ESLint   Consistent code formatting and
                                                      adherence to best practices across
                                                      the team.
  ----------------------------------------------------------------------------------------

**Local Setup:** Docker Compose will be used to containerize the Backend
(Node/Express) and Database (PostgreSQL) for rapid, consistent local
environment setup.

**2. Establish a Testing Strategy**

A three-tiered testing strategy will be implemented using
industry-leading frameworks.

  -------------------------------------------------------------------------------------
  **Test Type**         **Framework/Tool**   **Purpose**         **Scope**
  --------------------- -------------------- ------------------- ----------------------
  **Unit Testing**      Jest                 Verify individual   Backend Logic,
                                             functions, utility  Frontend Utility
                                             classes, and        Functions.
                                             business logic      
                                             methods.            

  **Component Testing** Jest / React Testing Verify UI           Individual React
                        Library              components render   Components (e.g.,
                                             correctly and       StatCard, NavLink).
                                             respond to user     
                                             interactions.       

  **Integration/E2E**   Cypress              Simulate full user  POS Checkout,
                                             flows in a real     Inventory Addition,
                                             browser             Client Quote
                                             environment.        submission (all
                                                                 cross-stack
                                                                 interactions).
  -------------------------------------------------------------------------------------

**Testing Goal:** Minimum 80% code coverage required for all
production-bound code.

**3. Plan the CI/CD Pipeline (GCP Target)**

The CI/CD pipeline will utilize GitHub Actions for continuous
integration, with Google Cloud Platform (GCP) services handling
deployment.

  -------------------------------------------------------------------------
  **Stage**      **Tool**       **Description**
  -------------- -------------- -------------------------------------------
  **Source       GitHub         Stores source code and triggers the
  Control**                     pipeline upon pull request (PR) or merge to
                                main.

  **Continuous   GitHub Actions 1\. **Linting:** Runs ESLint/Prettier
  Integration                   checks. 2. **Testing:** Executes Unit,
  (CI)**                        Component, and Integration tests. 3.
                                **Build:** Creates optimized production
                                bundles for Frontend and Backend services.

  **Deployment   Google Cloud   Takes artifacts from GitHub Actions and
  (CD)**         Build          manages deployment to GCP resources.

  **Hosting      Google Cloud   Serverless container hosting for the React
  (Frontend)**   Run            application, offering auto-scaling and cost
                                efficiency.

  **Hosting      Google Cloud   Separate microservices (e.g., pos-api,
  (Backend)**    Run (Services) inventory-api) hosted as distinct Cloud Run
                                services.

  **Database**   Google Cloud   Managed database instance. Database
                 SQL            migrations (via Flyway/Knex) will run as
                 (PostgreSQL)   part of the CD pipeline.
  -------------------------------------------------------------------------

**4. Select a Payment Gateway**

**Selected Provider: Stripe**

  -------------------------------------------------------------------------
  **Aspect**      **Detail**
  --------------- ---------------------------------------------------------
  **Provider**    Stripe

  **Integration   Stripe Terminal (for in-person POS hardware) and Stripe
  Model**         Payments API (for online/e-commerce use cases).

  **PCI           Stripe handles the majority of PCI scope (via
  Compliance**    Elements/Terminal) reducing our burden.

  **Key APIs      Payments, Customers, and Terminal SDK.
  Used**          
  -------------------------------------------------------------------------

**Integration Plan:** We will prioritize the backend integration of the
Payments API first, followed by the mock integration of the Stripe
Terminal SDK within the POS view for in-store transactions.

**5. Detail Core User Journeys**

**A. POS Sales Checkout Flow (Critical Path)**

1.  **Start Transaction:** User navigates to the POS tab.

2.  **Item Selection:** User searches/scans item (e.g., LUM-4X4-T8) and
    adds quantity (e.g., 5) to the Cart model in the React state.

3.  **Price Check:** System verifies stock (stock \> 0) and applies
    default retail price (and any active discounts/promos).

4.  **Payment Initiation:** User clicks \"Process Payment\". Total is
    calculated (Subtotal + Tax).

5.  **Payment Processing:**

    -   If Credit Card: Stripe Terminal SDK is invoked, awaiting card
        tap/swipe.

    -   If Cash: Cash Tendered field is populated, change due is
        calculated.

6.  **Transaction Completion:** Stripe confirms payment success.

7.  **System Updates:**

    -   Stock is decremented in PostgreSQL (mockInventory equivalent).

    -   A new Sale record is created in PostgreSQL (mockSales
        equivalent).

8.  **Receipt:** Receipt is printed/emailed, and the POS view is reset.

**B. Inventory Addition / Receiving Flow**

1.  **Initiation:** User navigates to the Inventory tab and clicks \"Add
    Purchase/Receive Stock.\"

2.  **Purchase Order (PO) Details:** User inputs Vendor, PO reference
    number, and date.

3.  **Item Entry:** User scans/searches the item (e.g., MAT-CON-80LB).

4.  **Quantity and Cost:** User inputs the received quantity
    (e.g., 1000) and the unit *cost* (e.g., \$6.50).

5.  **Submission:** User clicks \"Finalize Receiving\".

6.  **System Updates:**

    -   Stock quantity for MAT-CON-80LB is updated (incremented by
        1000).

    -   The unit **cost** is updated (or averaged) in the product
        record.

    -   A new Receiving Log record is created in PostgreSQL.

7.  **Confirmation:** Confirmation modal confirms stock update and new
    inventory valuation.
