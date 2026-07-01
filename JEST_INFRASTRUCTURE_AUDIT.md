# MediaVerse Jest Testing Infrastructure Audit

## 1. Current Architecture Overview

The MediaVerse testing suite currently relies on Jest's experimental ESM support, specifically utilizing `jest.unstable_mockModule` within a centralized `src/tests/setup.js` file.

**Key Characteristics:**
- **Loader-Level Mocking:** `setup.js` intercepts the Node.js ESM module loader to inject mock implementations for databases (Mongoose models), caches (Redis), external SDKs (AWS, Cloudinary), and internal services.
- **Global Mock State:** A single `setupTestMocks()` function instantiates these mocks globally for the entire test worker process.
- **Dynamic Imports:** Tests must dynamically `await import(...)` controllers and models *after* calling `setupTestMocks()` to ensure the ESM loader returns the mocked version instead of the real module.
- **Manual State Reset:** Tests use `beforeEach()` hooks (e.g., `reset(Video)`) to manually overwrite the return values of these global mocks (like `.mockReturnValue()`).

## 2. Problem Statement & Root Cause Analysis

### Identified Issues
1. **Cross-Test Contamination:** Mocks bleed state between tests.
2. **Order-Dependent Execution:** Tests pass in isolation but fail when run consecutively.
3. **Cache Pollution:** Integration tests cannot easily override a mock that was registered by a unit test earlier in the lifecycle.
4. **Fragile Setup:** Dynamically importing controllers inside `beforeAll` blocks makes tests harder to read and breaks IDE auto-completion.

### Root Cause Analysis
The root cause stems from the fundamental conflict between **Node.js ESM Caching** and **Global Mutable Mocks**.
- In ESM, the module loader caches evaluated modules permanently per worker process. 
- When `jest.unstable_mockModule` replaces `video.model.js`, that mocked object is cached.
- Because Jest runs multiple test suites (`describe` blocks) concurrently within the same file (or across files if using `--runInBand`), they all receive the *exact same memory reference* to the mock object.
- When `Test A` calls `Video.find.mockResolvedValue([])` and `Test B` concurrently calls `Video.find.mockRejectedValue(Error)`, a race condition occurs. Whichever executes last overwrites the global mock, causing the other test to fail unpredictably.

## 3. Architecture Alternatives

### Alternative A: Dependency Injection (DI)
- **Concept:** Pass models and services directly into controllers (`new VideoController(VideoModel, Redis)`).
- **Advantages:** 100% decoupling. Zero module loader hacking. Ultimate testability.
- **Disadvantages:** Requires a massive rewrite of the entire application architecture. Overkill for an Express.js app of this size.

### Alternative B: `jest.resetModules()` with CommonJS
- **Concept:** Revert to CommonJS (`require`) and clear the module registry between tests.
- **Advantages:** Ensures a clean slate for every test.
- **Disadvantages:** MediaVerse is already written in native ES Modules (`"type": "module"`). Reverting to CJS is a step backward and breaks modern node ecosystem compatibility.

### Alternative C: `jest.spyOn()` + Object-Oriented Exports (The Recommended Approach)
- **Concept:** Import the *real* modules, but use `jest.spyOn()` to mock specific methods on the exported objects (e.g., `jest.spyOn(Video, 'find').mockResolvedValue(...)`).
- **Advantages:**
  - Works natively with ESM without experimental loader hacks.
  - Mocks can be cleanly restored after each test using `jest.restoreAllMocks()`.
  - No dynamic `await import()` required in tests; standard static imports work.
  - Eliminates the centralized `setup.js` bottleneck.
- **Disadvantages:** Requires internal services exporting bare named functions to be refactored to export an object (e.g., `const VideoService = { getVideos }; export default VideoService;`).

### Alternative D: In-Memory Databases for Integration Tests
- **Concept:** Use `mongodb-memory-server` and `ioredis-mock` for integration tests instead of mocking Mongoose/Redis models.
- **Advantages:** Tests real database queries, catching schema and index errors. Completely eliminates the need to mock Mongoose chains (which is notoriously difficult and brittle).

## 4. The Best Architecture (The Hybrid Approach)

For a production-grade Node.js/Express application using ESM, the optimal architecture is a **Hybrid Spy & Sandbox Architecture**:

1. **Unit Tests (Controllers/Services):** 
   - Use **`jest.spyOn()`** on real module objects.
   - Refactor services to export objects to allow method spying.
   - Use `jest.restoreAllMocks()` in `afterEach` to guarantee a pristine state.

2. **Integration Tests (Routes/App):**
   - **Stop mocking Mongoose.** Use `mongodb-memory-server` to spin up a real, ephemeral MongoDB instance per test file.
   - Use `ioredis-mock` for Redis.
   - Only mock external network boundaries (AWS S3, Cloudinary).

**Why this is the best choice:**
It strikes the perfect balance between implementation effort and test reliability. It completely eliminates `jest.unstable_mockModule`, resolves all cache pollution issues, restores standard static ESM imports, and drastically increases the confidence level of integration tests by using a real database engine.

## 5. Risks & Estimated Effort

- **Estimated Effort:** Medium-High (approx. 3-5 days of refactoring).
- **Risks:** 
  - Refactoring services to export objects will require updating standard imports across the app.
  - Mocking Mongoose queries via `spyOn` requires slightly different syntax than `unstable_mockModule`.
- **Mitigation:** Execute incrementally. Update one domain (e.g., Videos) at a time, ensuring tests pass before moving to the next.
