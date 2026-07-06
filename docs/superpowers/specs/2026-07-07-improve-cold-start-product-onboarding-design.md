# Improve Cold-Start Product Onboarding Design

## Context

Production Playwright auditing showed that a zero-data workspace does not reliably lead a merchant into the first useful e-commerce operations loop. The current app can display empty dashboards, empty alerts, empty opportunities, and a Chat answer, but those surfaces do not consistently point to real UI actions. Product editing also fails silently for products without image URLs, and Chat tool contracts mention unsupported marketplace values.

## Design

This iteration repairs the existing workflow rather than adding a new onboarding system. The product form will accept blank optional URL fields, expose accessible labels, and describe check intervals in hours. Dashboard, Alerts, and Opportunities will distinguish no-product cold start from no-downstream-data states and route users toward Products or data collection actions. Chat tools and prompts will be constrained to supported product platforms and current UI action names.

## Boundaries

The change does not add a full wizard, alert-rule UI, Chat action cards, Lazada support, provider acquisition changes, opportunity score changes, or database migrations. It stays inside existing capabilities: product list UI, dashboard overview, alert center UI, opportunity research workspace, and Chat agent tools.

## Verification

Verification requires OpenSpec strict validation, frontend unit tests, backend Chat tool tests, frontend build/lint, and targeted Playwright regression for cold-start and product add/edit/manual-reading/delete behavior.
