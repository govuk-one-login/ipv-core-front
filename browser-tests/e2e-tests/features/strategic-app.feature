@QualityGateStackTest
Feature: StrategicApp
  As a user with suitable device and documents
  I want to complete identity verification with the app
  So that I can prove my identity

  @Build @QualityGateRegressionTest
  Scenario: Happy MAM iPhone journey
    Given the user starts a new journey
    And the user 'is from the UK'
    And the user 'has valid photo ID for the app'
    And the user 'is on a smartphone'
    And the user 'has an iphone'
    When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
    And the user returns from the app to core-front
    Then the user should see the 'check-mobile-app-result' page
    And the continue button should be enabled within 15 seconds
    When the user chooses to continue
    And the user 'acknowledges they have successfully completed the app'
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user 'continues to the RP after successfully proving their identity'
    Then the user should have a 'P2' identity

  @Build @PYIC-7471 @QualityGateRegressionTest
  Scenario: Happy DAD journey
    Given the user starts a new journey
    And the user 'is from the UK'
    And the user 'has valid photo ID for the app'
    And the user 'is on a computer or tablet'
    And the user 'has an android'
    Then the user should see the 'pyi-triage-desktop-download-app' page
    And the user should see text "Waiting for you to open the app" by 5 seconds
    When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
    Then the continue button should be enabled within 15 seconds
    When the user chooses to continue
    And the user 'acknowledges they have successfully completed the app'
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user 'continues to the RP after successfully proving their identity'
    Then the user should have a 'P2' identity
