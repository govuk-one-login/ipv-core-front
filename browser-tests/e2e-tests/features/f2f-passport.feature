Feature: F2F Passport Journey
  As a user without suitable photo ID for app journey
  I want to complete identity verification at a Post Office
  So that I can prove my identity and claim my passport

  @Build @PYIC-8131 @QualityGateRegressionTest
  Scenario: F2F Passport claim is returned in the user identity response
    Given the user starts a new journey
    And the user selects they are from the UK
    And the user confirms they don't have suitable photo ID
    Then the user should see the 'page-ipv-identity-postoffice-start' page
    When the user selects 'next' radio option and continues
    And the user submits 'kenneth-decerqueira-valid' details to the 'claimed-identity' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'address' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'fraud' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'f2f' CRI stub
    Then the user should see the 'page-face-to-face-handoff' page

    When the user starts a new journey until they get a 'page-ipv-reuse' page
    Then Kenneth Decerqueira's information is displayed on the reuse screen
    When the user chooses to continue
    Then the user should have a 'P2' identity
    And Kenneth Decerqueira's credentials should be passed to the orch stub
