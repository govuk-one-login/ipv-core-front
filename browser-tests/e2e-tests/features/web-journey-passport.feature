Feature: E2E Passport Journey
  As a user without a suitable device for app journey
  I want to complete identity verification in another way via the web
  So that I can prove my identity

  @Build @QualityGateRegressionTest @PYIC-5477 @PYIC-6863 @PYIC-7016
  Scenario: Passport details page happy path
    Given the user starts a new journey
    And the user is from the UK
    And the user has valid photo ID for the app
    And the user is on a computer or tablet
    And the user does not have an appropriate device for the app
    And the user needs another way to prove their identity from the app
    And the user has a passport for the web journey
    When the user submits 'kenneth-decerqueira-valid' 'passport' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user does not get PIP
    And the user moves on to answer security questions with Experian KBV
    And the user submits 'kenneth-decerqueira-valid' 'experian-kbv' details to the CRI
    And the user continues to the RP after successfully proving their identity
    Then the user should have a 'P2' identity

    When the user starts a new journey
    Then the user should see the 'page-ipv-reuse' page
    And Kenneth Decerqueira's information is displayed on the reuse screen
    When the user chooses to continue
    And the user should have a 'P2' identity
