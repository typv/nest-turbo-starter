# Nuclei Templates Catalog

Reference for quality-gates wizard when configuring DAST scanning.

## Available Profiles

- `recommended` — safe, low-noise starting point
- `misconfigurations` — server/infra misconfig detection
- `pentest` — comprehensive pentest templates
- `cves` — known CVE checks
- `compliance` — compliance checks
- `k8s-cluster-security` — Kubernetes cluster security
- `wordpress` — WordPress-specific checks
- `default-login` — default credential checks
- `osint` — OSINT templates
- `privilege-escalation` — privilege escalation checks

## Common Tags

`rce`, `sqli`, `xss`, `ssrf`, `lfi`, `rfi`, `xxe`, `jwt`, `oauth`, `upload`,
`graphql`, `misconfig`, `exposure`, `login`, `token`, `secret`, `injection`,
`traversal`, `bypass`, `privilege`, `takeover`, `cors`, `ssti`, `deserialization`,
`log4j`, `panel`, `default-login`, `k8s`, `docker`, `git`, `jenkins`, `gitlab`,
`wordpress`, `spring`, `php`, `java`, `python`, `node`

## Docs-Signal → Nuclei Config Mapping

| Signal from docs | Tags | Profile/Path |
|-----------------|------|-------------|
| Authentication/login | `auth,default-login,bypass` | — |
| REST API | `api,misconfig,exposure` | — |
| File upload | `upload,lfi` | — |
| JWT/OAuth | `jwt,oauth,token` | — |
| GraphQL | `graphql` | — |
| Admin panel/dashboard | `panel` | `http/exposed-panels/` |
| WordPress/CMS | — | `wordpress` |
| Kubernetes/k8s | — | `k8s-cluster-security` |
| AWS cloud | — | `aws-cloud-config` |
| GCP cloud | — | `gcp-cloud-config` |
| Azure cloud | — | `azure-cloud-config` |
| CI/CD (Jenkins/GitLab) | `jenkins,gitlab,cicd` | — |
| Database exposed | `exposure,db` | `network/` |
| Default (always) | `cve,misconfig,exposure` | `recommended` |

## Safety Exclusions (always apply)

```yaml
exclude-tags: dos,fuzz
```

Never DoS or fuzz-test a target via quality gates.

## Rate Limiting

Default: 50 req/s. Reduce for shared staging environments:
```yaml
dast:
  rate_limit: 10  # shared staging
```
