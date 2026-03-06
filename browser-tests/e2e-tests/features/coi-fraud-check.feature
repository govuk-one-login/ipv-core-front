Feature: COI Repeat Fraud Check - Given Name Change
  As a user with an existing identity and expired fraud details
  I want to update my name details
  So that I can verify my new identity details through the fraud check process

  Background: Initial identity proving journey
    Given the user starts a new journey
    And the user completes an initial P2 identity journey with expired Alice Parker details

  @Build @QualityGateRegressionTest
  Scenario: Successful given name change during repeat fraud check and show reuse screen on return
    When the user starts a new journey
    And the user 'chooses to update their given names when confirming their details'
    And the user 'has valid photo ID to update their name with the app'
    And the user 'is on a computer or tablet'
    And the user 'has an android'
    And the user submits 'successful' 'alice-parker-changed-first-name' details and continues from the 'DAD' journey
    And the user submits 'alice-parker-changed-first-name' 'driving-licence' details to the CRI
    And the user 'acknowledges they have successfully completed the app'
    And the user submits 'alice-parker-changed-first-name' 'fraud' details to the CRI
    And the user 'continues to the RP after successfully proving their identity'
    Then the user should have a 'P2' identity
    And Alison Parker's credentials should be passed to the orch stub

    When the user starts a new journey
    Then the user should see the 'page-ipv-reuse' page
    And Alison Parker's information is displayed on the reuse screen
