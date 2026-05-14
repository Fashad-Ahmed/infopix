# Graph Report - .  (2026-05-14)

## Corpus Check
- Corpus is ~4,634 words - fits in a single context window. You may not need a graph.

## Summary
- 44 nodes · 53 edges · 10 communities (5 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `infographicWorkflow` - 3 edges
2. `contentAgent` - 3 edges
3. `styleAgent` - 3 edges
4. `criticAgent` - 3 edges
5. `scrapeWebsiteTool` - 2 edges
6. `formatterAgent` - 2 edges
7. `InfographicInputSchema` - 2 edges
8. `BrandStyleSchema` - 2 edges
9. `InfographicContentSchema` - 2 edges
10. `ReviewOutputSchema` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (10 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.33
Nodes (6): contentAgent, criticAgent, formatterAgent, styleAgent, mastra, scrapeWebsiteTool

### Community 1 - "Community 1"
Cohesion: 0.25
Nodes (7): BaseSection, BrandStyleSchema, ComparisonSection, FinalPayloadSchema, InfographicContentSchema, KeyTakeawaySection, MetricSection

### Community 2 - "Community 2"
Cohesion: 0.29
Nodes (6): InfographicInputSchema, ReviewOutputSchema, assembleFinalPayloadStep, extractContentStep, extractStyleStep, reviewDraftStep

### Community 3 - "Community 3"
Cohesion: 0.4
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **16 isolated node(s):** `config`, `eslintConfig`, `nextConfig`, `geistSans`, `geistMono` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.