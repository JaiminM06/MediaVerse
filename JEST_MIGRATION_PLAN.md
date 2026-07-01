# MediaVerse Jest Migration Plan

## 1. Migration Strategy

The migration from `jest.unstable_mockModule` to the **Hybrid Spy & Sandbox Architecture** must be executed incrementally to avoid breaking changes. The test suite must remain green (passing) at the end of each phase.

### Validation Strategy
- Run `npm test` after each phase.
- Ensure test coverage does not drop below the current threshold (60%).
- Run tests both in isolation (e.g., `jest src/tests/videoController.test.js`) and in parallel (`jest`) to verify order-independence.

### Rollback Strategy
- Every phase is scoped to specific files or domains.
- If a phase fails, revert the changes to the specific files updated in that phase (using `git checkout`). The global `setup.js` will remain intact until Phase 6 to support legacy tests during the transition.

---

## 2. Migration Phases

### Phase 1: Test Infrastructure Modernization (Integration Prep)
**Goal:** Establish the foundation for real-database integration tests without breaking existing unit tests.
**Files to Modify:**
- `package.json`: Add `mongodb-memory-server` and `ioredis-mock` as dev dependencies.
- `src/tests/integrationSetup.js` (NEW): Create a new setup file specifically for integration tests that spins up `mongodb-memory-server` and initializes `ioredis-mock`.
- `jest.config.js`: Separate unit test matches from integration test matches if necessary (e.g., creating a `jest.integration.config.js`).

### Phase 2: Service Layer Refactoring (Enable Spying)
**Goal:** Refactor services to export objects so `jest.spyOn()` can intercept their methods.
**Files to Modify:**
- `src/services/*.js`: Wrap named exports into a default export object.
  - Example: `export const VideoService = { getVideos, processVideo }; export default VideoService;`
- Update all standard imports in controllers that consume these services to use the object syntax.
- **Expected Impact:** Zero behavioral change in production, but unlocks the ability to use `jest.spyOn(VideoService, 'getVideos')` in tests.

### Phase 3: Controller Unit Tests Migration
**Goal:** Replace `unstable_mockModule` and dynamic imports with static imports and `jest.spyOn()` in controller tests.
**Files to Modify:**
- `src/tests/videoController.test.js`
- `src/tests/userController.test.js`
- `src/tests/controllers.test.js`
- **Actions:**
  - Remove `await setupTestMocks()`.
  - Replace dynamic `await import()` with static `import { getInfiniteHomeFeed } from '../controllers/video.controller.js'`.
  - Import the real Mongoose models (`import { Video } from '../models/video.model.js'`).
  - Use `jest.spyOn(Video, 'find').mockReturnValue(createMockQueryChain([]))` instead of mutating global mocks.
  - Add `afterEach(() => jest.restoreAllMocks())` to guarantee isolation.

### Phase 4: Service Unit Tests Migration
**Goal:** Migrate service-layer unit tests to use `jest.spyOn()`.
**Files to Modify:**
- `src/tests/services.test.js`
- `src/tests/search.test.js`
- `src/tests/analytics.test.js`
- `src/tests/notifications.test.js`
- **Actions:**
  - Similar to Phase 3, remove `unstable_mockModule`.
  - Spy on external dependencies (like Cloudinary or AWS SDK) if they export objects, or use targeted module mocks (`jest.mock(...)` if supported, or manual DI wrappers for external SDKs).

### Phase 5: Integration Tests Migration
**Goal:** Convert API integration tests to use the real in-memory database instead of Mongoose mocks.
**Files to Modify:**
- `src/tests/api.test.js`
- `src/tests/middleware.test.js`
- **Actions:**
  - Import and initialize the `integrationSetup.js` utilities.
  - Remove all database mocking. 
  - Seed the in-memory database with test data using actual Mongoose `.create()` calls.
  - Assert against real database state after API calls.

### Phase 6: Final Cleanup
**Goal:** Remove the legacy testing infrastructure permanently.
**Files to Modify:**
- `src/tests/setup.js`: Delete this file entirely.
- Remaining `.test.js` files: Verify no straggling `unstable_mockModule` calls exist.
- **Expected Impact:** The codebase is now fully migrated to the new architecture. Module caching issues are eliminated, and tests are 100% deterministic.
