# Flow Spec: Categories and Skills Reference Data

## Goal
Document how service taxonomy data is maintained and consumed.

## Categories
1. Create category through API.
2. Retrieve paginated list as select options.
3. Retrieve all names for lightweight dropdown use.

## Skills
1. Create skill through API.
2. Retrieve paginated list as select options.

## Invariants
1. Categories and skills are reference data used by provider profile setup.
2. Current implementation is create/list focused; update/delete paths are intentionally absent or commented.

## Related Tables
- `categories`
- `skills`
- provider junction tables (`provider_categories`, `provider_skills`)
