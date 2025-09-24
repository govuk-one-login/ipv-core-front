export const CONFIG = {
  URLS: {
    ORCHESTRATOR_STUB: 'https://orchstub:348tuj!hsDd@orch.stubs.account.gov.uk/',
    IDENTITY_BUILD: 'https://identity.build.account.gov.uk',
    TICF_MANAGEMENT_API: 'https://ticf.stubs.account.gov.uk/management/user',
  },
  API: {
    TICF_API_KEY: 'cDM2Qi3IrS5MC5f4W5ZmxNMxYvwJj2b4BGI4xCc4',
  },
  FEATURE_FLAGS: {
    ENABLE_URL: 'https://identity.build.account.gov.uk/ipv/usefeatureset?featureSet=ticfCriBeta,disableStrategicApp',
  },
} as const;