@QualityGateStackTest
Feature: StrategicApp

  @Build @QualityGateRegressionTest
  Scenario: Happy MAM iPhone journey
    Given the user starts a new journey in 'build'
    And the user selects they are not from the UK
    And the user confirms they have suitable photo ID
    Then the user should see the 'pyi-triage-select-device' page
    When the user selects 'smartphone' radio option and continues
    Then the user should see the 'pyi-triage-select-smartphone' page
    When the user selects 'iphone' radio option and continues
    Then the user should see the 'pyi-triage-mobile-download-app' page
    When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
    And user returns from the app to core-front
    Then the user should see the 'check-mobile-app-result' page
    And the continue button should be enabled within 15 seconds
    When the user chooses to continue
    Then the user should see the 'page-dcmaw-success' page
    When the user chooses to continue
    And the user submits 'kenneth-decerqueira-valid' details to the 'address' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'fraud' CRI stub
    Then the user should see the 'page-ipv-success' page
    And the user should have a '"P2"' identity

  @Build @PYIC-7471 @QualityGateRegressionTest
  Scenario: Happy DAD journey
    Given the user starts a new journey in 'build'
    And the user selects they are not from the UK
    And the user confirms they have suitable photo ID
    Then the user should see the 'pyi-triage-select-device' page
    When the user selects 'computer-or-tablet' radio option and continues
    Then the user should see the 'pyi-triage-select-smartphone' page
    When the user selects 'iphone' radio option and continues
    Then the user should see the 'pyi-triage-desktop-download-app' page
    And the user should see text "Waiting for you to open the app" by 5 seconds
    When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
    Then the continue button should be enabled within 15 seconds
    When the user chooses to continue
    Then the user should see the 'page-dcmaw-success' page
    When the user chooses to continue
    And the user submits 'kenneth-decerqueira-valid' details to the 'address' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'fraud' CRI stub
    Then the user should see the 'page-ipv-success' page
    And the user should have a '"P2"' identity
