# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-03-15

### Dynamic Card Fetching

#### RewardParserService
- Created `src/domain/services/reward-parser.service.ts` — parses poe.ninja `explicitModifiers` to build `DivinationCard[]` at runtime
- Supports 4 reward tag types: `<uniqueitem>`, `<currencyitem>`, `<divination>`, `<gemitem>`
- Skips 5 unmatchable tag types: `<whiteitem>`, `<magicitem>`, `<rareitem>`, `<normal>`, generic gem categories
- Skips variant reward cards (entries with `optional: true` — indeterminate arbitrage)
- Gem name normalization: `Empower` → `Empower Support`, `Enlighten` → `Enlighten Support`, `Enhance` → `Enhance Support`
- Generic gem detection: skips names ending in `Gem`, containing `Exceptional`, `Transfigured`, or commas
- 34 unit tests covering all tag types, skip scenarios, and edge cases

#### Pipeline Integration
- `ExtractAdapter` derives cards dynamically per-league from DivinationCard market data (replaces `CardRepository`)
- `explicitModifiers` field added to `PoeNinjaItemLine` and `ItemOverview` for API data passthrough
- Cards parsed per-league: Standard 287/454, Mirage 311/444, Hardcore Mirage 207/295

#### Config Elimination
- Deleted `src/config/cards.ts` (29 hardcoded item cards), `src/config/currency-cards.ts` (12 hardcoded currency cards)
- Deleted `CardRepository` implementation and `ICardRepository` interface
- Inlined `fetch-list.ts` into `LeagueAdapter` as `ITEM_TYPES_TO_FETCH` constant, deleted `src/config/` directory
- Removed stale `@config` path alias from `tsconfig.json` and `jest.config.js`
- Coverage: 287 dynamically parsed cards vs 41 previously hardcoded (7x improvement)

#### Dead Code Removal
- Removed empty `LoadAdapter` constructor
- Removed dead Chaos Orb special-case in `ArbitrageCalculationService` (The Wrath card was already deleted)

### Architecture Refactoring

#### Composition Root & Dependency Injection
- Created `src/infrastructure/composition-root.ts` as single wiring point for all dependencies
- `ArbitrageEvaluator` use-case now accepts `ArbitrageEvaluatorService` via constructor (proper DI)
- Removed all scattered singleton exports (`httpService`, `leagueRepository`, `cardRepository`, `leagueAdapter`, `arbitrageEvaluator`)
- `App` class stripped to pure logic — no module-level wiring
- `LeagueRepository` now requires `IHttpService` parameter (no default)

#### Domain Layer Cleanup
- Moved `getRewardDisplayName()` from `CardArbitrage` aggregate to `ArbitrageMapper` (presentation ≠ domain)
- Aggregate now contains only domain logic: `isActionable()` and `create()`
- Replaced all `'in' operator` type guards with `instanceof` checks (consistent with `TrustValidationService`)

#### Config Migration to TypeScript
- Converted `cards.js`, `currency-cards.js`, `fetch-list.js` to TypeScript modules
- Added `RawItemCardConfig` and `RawCurrencyCardConfig` interfaces for compile-time validation
- Replaced `require()` calls with proper `import` statements
- Removed all `eslint-disable global-require` comments

#### ItemClass Enum
- Created `src/domain/value-objects/item-class.enum.ts` with values matching poe.ninja API reality
- Only 3 values: `UNIQUE = 3`, `SKILL_GEM = 4`, `DIVINATION_CARD = 6`
- Replaced all magic numbers (`itemClass === 4`, `DIVINATION_CARD_CLASS = 6`) with enum references

#### API Types Fix
- `poe-ninja.types.ts` now defines raw API interfaces (`PoeNinjaItemLine`, `PoeNinjaCurrencyLine`) instead of importing domain VOs
- Added full `PoeNinjaCurrencyExchange` interface (10 fields) for the `receive`/`pay` objects
- Added `exaltedValue`, `divineValue`, `listingCount` to `PoeNinjaItemLine`
- Removed unsafe double-casts in `HttpService` (`as unknown as Record<string, unknown>[]`)

### Bug Fixes

#### Rounding Inconsistency
- `ArbitrageMapper.toDto()` no longer floors `cardPrice.chaosValue`
- DTO displays fractional card price (e.g., 2.75 instead of 2)
- `setCost` was already computed from fractional value — now display is consistent

#### Error Handling
- ETL pipeline: per-league try-catch — one league failure no longer crashes the entire pipeline
- Lambda handler: returns 500 with error message instead of throwing
- Dev mode: replaced `process.nextTick(async () => ...)` (silent rejection) with `main().catch(console.error)`

#### Ambiguous Match Visibility
- `RewardMatcherService` accepts optional `AmbiguousMatchCallback`
- Logs warning when reward matches multiple items (e.g., "The Poet's Pen" has 2 variants)
- Domain-pure: callback injected from composition root, no `console` in domain layer

### Data Cleanup

#### Dead Cards Removed (8 total)
- **Item cards (7)**: The Iron Bard (not in poe.ninja), Beauty Through Death / Immortal Resolve / The Valley of Steel Boxes (Prophecy removed from POE), Vanity (corrupted 6-link Tabula not found), The Last One Standing (Atziri's Disfavour not found), Pride Before the Fall (corrupted Kaom's Heart not found)
- **Currency cards (1)**: The Wrath (Chaos Orb not listed by poe.ninja — baseline currency)

### Code Audit Cleanup

#### Type Safety
- `isCurrencyCard()` upgraded to type predicate — eliminates 3 unsafe `as` casts across domain and infrastructure
- `ItemRewardSpec.itemClass` typed as `ItemClass` enum instead of `number`
- Deleted unsafe `fromRaw(data: Record<string, unknown>)` from `ItemOverview` and `CurrencyItem` (zero-validation casts)
- Fixed `(error as Error).message` in `HttpClient` with proper `instanceof` guard
- Simplified `DivinationCardLine.explicitModifiers` from `ExplicitModifier[] | null` to optional-only

#### Hexagonal Architecture
- Extracted `ILeagueApi` and `IMarketDataApi` ports to `src/domain/ports/http-service.port.ts` (split from monolithic `IHttpService`)
- Extracted `ILeagueAdapter` and `LeagueDataYield` to `src/domain/ports/league-adapter.port.ts`
- Domain port defines `RawLeagueData` — zero infrastructure imports in domain layer
- Created `PoeNinjaItemDto` and `PoeNinjaCurrencyDto` in `src/infrastructure/types/` for API-specific data
- Removed `detailsId` from `ItemOverview` domain VO (API-only field)

#### Domain Logic Placement
- `console.log` removed from `RewardParserService.parseAll()` — replaced with `CompleteCallback` pattern
- League eligibility rules moved from `ExtractAdapter.selectLeagues()` to `League.isEligible()` entity method
- 6 unit tests added for `League.isEligible()` (SSF, Ruthless, console, Hardcore, not-started)

#### Dead Code Removal
- Deleted `fromItemCardConfig()` and `fromCurrencyCardConfig()` factory methods (remnants of hardcoded config)
- Deleted `src/infrastructure/types/etl.types.ts` (unused, duplicate `LeagueData` name)
- Removed unnecessary `async` from `LoadAdapter.load()` (no await)

#### Consistency
- Fixed `||` to `??` in `HttpService` constructor
- Fixed relative imports in `ArbitrageEvaluatorService` to use `@domain/` aliases
- Added `TODO: reshape for Supabase` comments on `toPlain()` methods

### Dependencies & Cleanup
- Removed `moment` dependency (was used only for `Duration` type in `sleep()`)
- `sleep()` simplified to accept `number` only
- Removed unused default export in `http-client.ts`
- Removed unused `rateLimitedQueue` singleton export
- `League` entity made immutable (`readonly` fields, object-pattern constructor)

### ESLint Configuration
- Added `'no-console': 'off'` (Lambda logs to CloudWatch via console)
- Customized `'no-restricted-syntax'` to allow `for...of` / `for await...of` (kept `for...in` / `with` / labels banned)
- Removed stale `eslint-disable` comments from 8+ source files
