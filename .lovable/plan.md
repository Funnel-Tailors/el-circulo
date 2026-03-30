

## Plan: Redeploy submit-lead-to-ghl edge function

The deployed version has a stale `hasMoney` duplicate declaration causing a boot crash. The current source code is clean — just needs a fresh deploy.

### Action

1. **Redeploy `submit-lead-to-ghl`** — Force a fresh deployment of the edge function from the current clean source code. No code changes needed.

