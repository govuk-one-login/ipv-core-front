Feature: F2F Passport Journey
  As a user without suitable photo ID for app journey
  I want to complete identity verification at a Post Office
  So that I can prove my identity and claim my passport

  @Build @PYIC-8131 @QualityGateRegressionTest
  Scenario: F2F Passport claim is returned in the user identity response
    Given I navigate to Orchestrator Stub and start journey
    When I select I am from the UK
    And I confirm I do not have photo ID suitable for an app journey
    Then I should see page with heading 'Prove your identity at a Post Office with one of the following types of photo ID'
    When I select Yes radio and continue
    And I enter CIC stub data as Kenneth Decerqueira
    When I enter address stub data and submit
    When I enter fraud build stub data and submit
    And I enter Face to Face Stub data for valid passport and submit
    Then I should see go to post office page without VC
    Then After User relogin should see passport and identity claim data in Raw User Info Object
