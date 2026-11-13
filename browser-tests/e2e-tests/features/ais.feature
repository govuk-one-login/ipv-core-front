@accountInterventions @PYIC-8342 @QualityGateStackTest
Feature: Account Interventions IPV core E2E Tests
  As a user going through an identity journey
  I want the Account Intervention Service to gate my journey appropriately
  So that my account is protected when interventions apply

  Background:
    Given the user starts a new journey

  @Build @QualityGateRegressionTest
  Scenario: AIS states - with no interventions the journey completes successfully
    Given the AIS API will return an 'AIS_NO_INTERVENTION' result
    And the user is from the UK
    And the user has valid photo ID for the app
    And the user is on a smartphone
    And the user has an iphone
    When the user completes the app journey successfully
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user continues to the RP after successfully proving their identity
    Then the user should have a 'P2' identity

  @Build @QualityGateRegressionTest
  Scenario: AIS states - error returned to orchestration when account is suspended
    # Configure after journey start to exercise the subsequent AIS check.
    Given the AIS API will return an 'AIS_ACCOUNT_SUSPENDED' result
    And the user is from the UK
    And the user has valid photo ID for the app
    And the user is on a smartphone
    And the user has an iphone
    When the user completes the app journey successfully
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    Then the error response is sent to orchestration
    And the error 'session_invalidated' with description 'Account intervention detected' is shown

  @Build @PYIC-4048 @QualityGateRegressionTest
  Scenario: AIS states - reprove identity is requested for a completed web journey
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
    And the user submits 'kenneth-decerqueira-valid' 'experian-kbv' details to the CRI
    And the user continues to the RP after successfully proving their identity
    Then the user should have a 'P2' identity
    Given the AIS API will return an 'AIS_FORCED_USER_IDENTITY_VERIFY' result
    When the user starts a reprove identity journey
    Then the user should see the 'reprove-identity-start' page
    When the user chooses to continue
