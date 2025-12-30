Feature: COI Fraud Check - Given Name Change
  As a user with an identity verification
  I want to update my name details
  So that I can verify my new identity details through the fraud check process

  Background:
    Given I navigate to Orchestrator Stub and start journey
    And I enable Feature Flags
    And I configure TICF Management API

  Scenario: Pass successfully for a given name change and show reuse screen
    Given I complete initial P2 identity journey
    When I start reuse journey for name change
    Then I should see the verify final reuse screen after name change
