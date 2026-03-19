# Roadmap

## Phase 1 - Solidify the Beta Foundation

Goal: make the current beta skeleton stable enough for repeated real-world usage.

Planned work:
- unify output schema across `tech`, `general`, and `image`
- clean up shared utility logic across scripts
- improve route classification quality
- strengthen error reporting and raw output tracing
- reduce hidden coupling on working directory and invocation style

## Phase 2 - Stronger Arbitration

Goal: improve result quality, not just result quantity.

Planned work:
- add source weighting and scoring
- add consistency checks across multiple sources
- detect conflicting information explicitly
- improve ranking after de-duplication
- expose confidence hints in final output

## Phase 3 - Source Abstraction

Goal: make it easier to add or replace search providers.

Planned work:
- introduce a source adapter layer
- standardize source result format
- separate provider-specific code from routing logic
- define source capability metadata

## Phase 4 - Better Observability and Testing

Goal: make the platform easier to debug and safer to evolve.

Planned work:
- add minimal regression tests
- add route-level test cases
- add schema validation tests
- snapshot intermediate pipeline outputs for debugging
- improve failure logs and traceability

## Phase 5 - Productized Platform Layer

Goal: move from a practical internal skill to a more mature reusable search platform.

Planned work:
- add clearer extension conventions
- add more documentation for adopters
- add example integration patterns for agent frameworks
- support richer answer packaging and reporting formats
