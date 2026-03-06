Feature: F2F Passport Journey
  As a user without suitable photo ID for app journey
  I want to complete identity verification at a Post Office
  So that I can prove my identity and claim my passport

  @Build @PYIC-8131 @QualityGateRegressionTest
  Scenario: F2F Passport claim is returned in the user identity response
    Given the user starts a new journey
    And the user is from the UK
    And the user doesn't have valid photo ID for the app
    And the user has valid photo ID for the Post Office
    And the user submits 'kenneth-decerqueira-valid' 'claimed-identity' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'f2f' details to the CRI
    Then the user should see the 'page-face-to-face-handoff' page

    When the user starts a new journey until they get a 'page-ipv-reuse' page
    Then Kenneth Decerqueira's information is displayed on the reuse screen
    When the user chooses to continue
    Then the user should have a 'P2' identity
    And Kenneth Decerqueira's credentials should be passed to the orch stub
