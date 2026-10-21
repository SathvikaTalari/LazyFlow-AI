# Incident Postmortem: Database Connection Pool Exhaustion (INC-4091)

**Severity:** P1 - High  
**Date of Incident:** October 19, 2026  
**Incident Commander:** David Vance (Site Reliability Engineering)  
**Lead SRE:** Elena Rostova  

## Impact
- Customer API error rates surged to 42% between 14:15 UTC and 14:48 UTC (33 minutes duration).
- Approximately 1,200 asynchronous document processing jobs stalled in pending queues.
- Zero customer data was lost or corrupted.

## Root Cause Analysis
At 14:10 UTC, a batch re-indexing script executed simultaneously with a sudden spike in document uploads. The connection pool ceiling was capped at 20 concurrent connections without dynamic backoff or connection pooling recycle timeouts. As worker threads waited indefinitely on locked transactions, incoming requests exhausted the pool, triggering HTTP 500 timeouts.

## Remediation & Recovery
- At 14:35 UTC, SRE recycled the background worker pool and killed lingering zombie transactions.
- At 14:42 UTC, database max pool size was temporarily adjusted to 60 connections.
- Services returned to baseline latency (< 85ms) at 14:48 UTC.

## Action Items & Preventative Measures
- [ ] Elena Rostova: Implement SQLAlchemy connection pool health checks with 30s timeout and automatic pool recycling by October 23, 2026. (Priority: High)
- [ ] David Vance: Configure Prometheus alerts for DB connection pool utilization exceeding 80% capacity by October 25, 2026. (Priority: High)
- [ ] Jordan Miller: Audit all background batch jobs to run only during off-peak maintenance windows (02:00-04:00 UTC) by October 28, 2026. (Priority: Medium)
- [ ] Elena Rostova: Publish updated incident runbook to the team wiki for fast triage of connection lockups by October 31, 2026. (Priority: Low)
