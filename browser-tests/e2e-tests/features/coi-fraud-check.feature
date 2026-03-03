Feature: COI Fraud Check - Given Name Change
  As a user with an existing identity and expired fraud details
  I want to update my name details
  So that I can verify my new identity details through the fraud check process

  Background: Initial identity proving journey
    Given the user starts a new journey
    And the user completes an initial P2 identity journey with expired Alice Parker details

  @Environment:Build @QualityGateRegressionTest
  Scenario: Pass successfully for a given name change and show reuse screen
    When the user starts a new journey
    Then the user should see the 'confirm-your-details' page
    When the user chooses to update their given name via the app
    And the user goes through 'DAD' 'iphone' triage
    And the user submits 'alice-parker-changed-first-name-dvla' details and continues from the 'DAD' journey
    And the user submits 'alice-parker-changed-first-name' details to the 'driving-licence' CRI stub
    Then the user should see the 'page-dcmaw-success' page
    When the user chooses to continue
    And the user submits 'alice-parker-changed-first-name' details to the 'fraud' CRI stub
    Then the user should see the 'page-ipv-success' page
    When the user chooses to continue
    Then Alison Parker's credentials should be passed to the orch stub

    When the user starts a new journey
    Then the user should see the 'page-ipv-reuse' page
    And Alison Parker's information is displayed on the reuse screen
