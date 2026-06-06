@QualityGateStackTest
Feature: Expired DL

  @Build @PYIC-8830 @QualityGateRegressionTest
  Scenario: DL Expired User - Happy Path relogin to OL Identity reuse successfully
    Given the user starts a new journey
    And the user is from the UK
    And the user has valid photo ID for the app
    And the user is on a computer or tablet
    And the user has an iphone
    When the user submits 'kennethD' 'drivingPermit' 'success' details to the app
    Then the continue button should be enabled within 15 seconds
    When the user chooses to continue
    And the user submits 'kenneth-decerqueira-dl-auth-check' 'driving-licence' details to the CRI
    # DL Auth Check navigates to page-dcmaw-success; acknowledge it
    And the user acknowledges they have successfully completed the app
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user continues to the RP after successfully proving their identity
    Then the user should have a 'P2' identity
    When the user starts a new journey with VTR 'P2'
    Then the user should see the 'page-ipv-reuse' page
    And the user should see a page with heading 'Confirm your details'

  @Build @PYIC-8830 @QualityGateRegressionTest
  Scenario: DL Expired User - Reprove Their Identity upon relogin to OL
    Given the user starts a new journey
    And the user is from the UK
    And the user has valid photo ID for the app
    And the user is on a computer or tablet
    And the user has an iphone
    When the DCMAW CRI produces a 'kennethD' 'drivingPermit' 'success' VC for expired DL
    Then the continue button should be enabled within 15 seconds
    When the user chooses to continue
    And the user submits 'kenneth-decerqueira-dl-auth-check' 'driving-licence' details to the CRI
    # DL Auth Check navigates to page-dcmaw-success; acknowledge it
    And the user acknowledges they have successfully completed the app
    And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
    And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
    And the user continues to the RP after successfully proving their identity
    Then the user should have a 'P2' identity
    When the user starts a new journey with VTR 'P2'
    Then the user should see a page with heading 'You need to prove your identity'
