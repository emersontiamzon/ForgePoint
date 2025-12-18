# Story 005.003: Mobile Offline Mode

## Status
Draft

## Story
**As a** sales associate,
**I want** the mobile app to work in an offline mode,
**so that** I can continue to make sales even with an unstable internet connection.

## Acceptance Criteria
1. The app detects loss of internet connectivity and displays a clear "Offline Mode" indicator.
2. While offline, the user can still search for products and add them to a cart, using locally stored product data.
3. While offline, sales can be completed (for non-credit card payments) and are queued locally in the on-device database.
4. The app detects when internet connectivity is restored.
5. Upon reconnection, the app automatically begins synchronizing queued offline sales with the backend via the `POST /api/sync/sales` endpoint.
6. The UI displays the status of the synchronization process (e.g., "Syncing...", "Sync Complete", "Sync Failed").
7. The app periodically pulls product updates from the backend using the `GET /api/sync/products` endpoint when online.

## Tasks / Subtasks
- [ ] Integrate WatermelonDB into the React Native project.
    - [ ] Define the local schema for `Product`, `Sale`, `Payment`, and `SaleItem`.
- [ ] Implement network detection using `@react-native-community/netinfo`.
    - [ ] Create UI indicators for online/offline status.
- [ ] Modify existing mobile app features (sales, stock check) to use the local WatermelonDB database as the source of truth.
- [ ] Implement the synchronization logic.
    - [ ] Queue sales created offline.
    - [ ] Push queued sales to `POST /api/sync/sales` upon reconnection.
    - [ ] Pull product updates from `GET /api/sync/products`.
- [ ] Implement the backend for the `POST /api/sync/sales` and `GET /api/sync/products` endpoints.
- [ ] Write comprehensive unit, integration, and E2E tests for the entire offline and synchronization workflow. [Source: docs/architecture/testing-strategy.md]

## Dev Notes
- **Previous Story Insights**: This story significantly enhances the mobile app by adding offline capabilities. It affects both `us-005-001-mobile-sales.md` and `us-005-002-mobile-stock-check.md` by allowing their core functions to operate offline.
- **Local Database Technology**: As defined in `docs/architecture/data-models.md`, **WatermelonDB** will be used for the on-device SQLite database. [Source: docs/architecture/data-models.md]
- **Synchronization Strategy**: The app will implement a push/pull synchronization mechanism with a "last write wins" conflict resolution strategy, as detailed in `docs/architecture/data-models.md`. [Source: docs/architecture/data-models.md]
- **API Specifications**:
    - `POST /api/sync/sales` and `GET /api/sync/products` endpoints (defined in `docs/architecture/api-specifications.md`) will be implemented on the backend to support the mobile app's sync process. [Source: docs/architecture/api-specifications.md]
- **Component Specifications**:
    - **Network Detection**: Use `@react-native-community/netinfo` to monitor network status.
    - **UI**: An "Offline Mode" indicator must be added to the main UI. A new UI section might be needed to show sync status and logs.
- **File Locations**: New files for WatermelonDB schema, models, and synchronization logic within the `/mobile-app` directory. Backend implementation of the new Sync API endpoints.
- **Testing Requirements**:
    - **Unit Tests**: For synchronization logic, conflict resolution, and queuing mechanisms.
    - **Integration Tests**: For the new backend Sync API endpoints.
    - **E2E Tests**: Critical for this feature. E2E tests should cover:
        1. Switching to offline mode and creating a sale.
        2. Reconnecting and verifying the sale is synced.
        3. Handling sync failures and providing user feedback. [Source: docs/architecture/testing-strategy.md]
- **Technical Constraints**:
    - Credit card payments cannot be processed offline. The UI must disable this option when offline.
    - The amount of data synced to the device (especially products) should be managed to avoid excessive storage use.

## Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2025-12-15 | 1.0 | Initial draft of story for Mobile Offline Mode. | Bob (Scrum Master) |

## Dev Agent Record
### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
