# E-Waste Platform - Database Architecture Specification

## Normalized Schema Entity Dictionary (24 Tables)

1. **`profiles`**: User identities extending `auth.users(id)`
2. **`roles`**: System roles (`USER`, `INFORMAL_AGGREGATOR`, `COLLECTION_COLLECTOR`, `AUTHORIZED_RECYCLER`, `GOVERNMENT_ADMIN`)
3. **`user_roles`**: Many-to-many role binding mapping table
4. **`aggregators`**: Scrap godown & consolidation yard metadata
5. **`collectors`**: Field kabadiwala vehicle & operating radius info
6. **`recyclers`**: CPCB authorized formal dismantler / recycling facilities
7. **`material_categories`**: CPCB Schedule I high-level e-waste categories
8. **`materials`**: Specific component / device subcategories with base pricing
9. **`material_lots`**: Central tracking entity with server-generated `EW-YYYY-XXXXXX` lot codes
10. **`lot_images`**: S3/Supabase storage verification proofs
11. **`price_records`**: Micro-transaction market price feed
12. **`collector_assignments`**: Job dispatch & route progression
13. **`recycler_quotes`**: Wholesale B2B buy-offers from recyclers
14. **`transactions`**: Escrow and financial settlements
15. **`payments`**: Reconciled cash-on-delivery & instant UPI vouchers
16. **`earnings_ledger`**: Double-entry balance sheet for collectors & aggregators
17. **`traceability_events`**: Cryptographically chained lifecycle audit trail
18. **`notifications`**: Multichannel notification dispatch queue
19. **`safety_guidance`**: Material hazard directives & multilingual audio
20. **`complaints`**: Dispute resolution & grievance management
21. **`reviews`**: Peer reputation & trust scores
22. **`ai_predictions`**: Computer vision & ML inference logs
23. **`anomaly_alerts`**: Fraud, price outlier, & hazardous diversion alerts
24. **`audit_logs`**: Non-repudiation system audit logs
