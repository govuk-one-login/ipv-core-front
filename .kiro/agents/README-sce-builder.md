# Kiro Jira Feature Agent - Prerequisites

## Required

- Kiro CLI
- macOS/Linux with Bash, `curl`, `python3`, and `grep`
- Node.js and npm
- Access to the Jira Cloud project/issues you need to read

## Files

```text
.kiro/agents/
├── KiroJiraFeatureAgent.md
└── scripts/
    ├── get-jira-ticket.sh
    └── browser-helper.sh
```

## 1. Make scripts executable

From the project root:

```bash
chmod +x .kiro/agents/scripts/get-jira-ticket.sh
chmod +x .kiro/agents/scripts/browser-helper.sh
```

## 2. Jira API token

Create an Atlassian **API token with scopes** at:

https://id.atlassian.com/manage-profile/security/api-tokens

For this read-only workflow, use the Jira read scope `read:jira-work` where available.

## 3. Jira Cloud ID

Run once, replacing the Jira hostname:

```bash
curl -s "https://YOUR-COMPANY.atlassian.net/_edge/tenant_info"
```

Copy the returned `cloudId` value.

## 4. Jira environment variables

```bash
export JIRA_USER="your-atlassian-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_CLOUD_ID="your-cloud-id"
```

Do not commit `JIRA_API_TOKEN` to Git.

Test:

```bash
./.kiro/agents/scripts/get-jira-ticket.sh ABC-123
```

## 5. Browser helper setup

Run once per developer machine:

```bash
./.kiro/agents/scripts/browser-helper.sh setup
```

This installs Playwright CLI if needed and installs the browser.

## 6. Optional HTTP Basic Auth

If the test environment requires HTTP Basic Authentication, configure these environment variables outside the repository:

- `BROWSER_BASIC_AUTH_USER`
- `BROWSER_BASIC_AUTH_PASSWORD`

Do not store their values in Git.

Do not put credentials in the website URL.

## 7. Git ignore

Add:

```gitignore
.kiro/browser-artifacts/
.playwright-cli/
```

## Ready

Start Kiro CLI from the project root, select `test-scenario-builder`, and provide a Jira ticket key.
