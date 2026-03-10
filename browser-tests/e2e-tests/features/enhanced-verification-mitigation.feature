Feature: Enhanced Verification Mitigation
  As a user who receives an enhanced verification CI
  I want to mitigate it with another document and complete identity verification
  So that I can prove my identity

  Background: User starts web journey
    Given the user starts a new journey
    And the user is from the UK
    And the user has valid photo ID for the app
    And the user is on a computer or tablet
    And the user does not have an appropriate device for the app
    And the user needs another way to prove their identity from the app
    And the user has a passport for the web journey
    And the user submits 'kenneth-decerqueira-valid' 'passport' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user does not get PIP
    And the user moves on to answer security questions with Experian KBV
    And the user submits 'kenneth-decerqueira-valid' 'experian-kbv' details to the CRI with a 'NEEDS-ENHANCED-VERIFICATION' CI

  @Build @QualityGateRegressionTest @PYIC-3612 @PYIC-3607 @PYIC-3847
  Scenario: Same session enhanced-verification mitigation
    When the user re-attempts identity proving with the app
    # On the second app triage attempt, they have a suitable device for the app
    And the user is on a computer or tablet
    And the user has an iphone
    And the user submits 'failed' 'kenneth-decerqueira-valid' details and continues from the 'DAD' journey
    And the user re-attempts identity proving via the post office
    And the user submits 'kenneth-decerqueira-valid' 'f2f' details to the CRI to mitigate the 'NEEDS-ENHANCED-VERIFICATION' CI
    Then the user should see the 'page-face-to-face-handoff' page

    When the user starts a new journey until they get a 'page-ipv-reuse' page
    And the user chooses to continue
    Then the user should have a 'P2' identity
