---
name: search-middle-platform
description: Multi-source search middle platform for routing, aggregation, arbitration, and answer synthesis across technical search, general web search, and image aggregation. Use when a task needs query classification, source selection, de-duplication, result arbitration, or a final answer built from multiple search sources rather than a single quick lookup.
---

# Search Middle Platform

Route one query through a compact search pipeline.

## What it does

Given a query, this skill can:
- classify the query
- select the search route
- run one or more search flows
- de-duplicate and arbitrate results
- synthesize a final answer

## Current routes

- `tech`
- `general`
- `image`

## Current components

- `scripts/search_hub.js`
- `scripts/multi_source_search_mvp.js`
- `scripts/tech_search_mvp.js`
- `scripts/tech_search_pro.js`
- `scripts/tech_search_ultimate.js`
- `scripts/search_multi_source_images.js`
- `scripts/search_router_mvp.js`
- `scripts/search_arbiter_mvp.js`
- `scripts/search_answer_mvp.js`
- `scripts/search_answer_nl.js`

## Entry point

Use the unified entry script:
- `node scripts/search_hub.js "<query>" <output-dir>`

Example:
- `node scripts/search_hub.js "OpenClaw browser timeout" output/search_hub`

## Recommended workflow

1. Decide whether the query is `tech`, `general`, or `image`
2. Route to the matching search flow
3. Aggregate and normalize raw results
4. Run basic arbitration
5. Return the final answer with raw output path if relevant

## References

Read when needed:
- `references/search-middle-platform-skill.md`
- `references/search-middle-platform-tests.md`

## Status

This is a beta skill:
- core skeleton is complete
- three base scenarios have been validated
- arbitration, classification, and answer packaging can still be improved
