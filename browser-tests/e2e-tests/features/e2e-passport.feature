Feature: E2E Passport Journey

  @Build @Lamdatesta @PYIC-5477 @PYIC-6863 @PYIC-7016
  Scenario: Passport details page happy path
    When user starts a fresh full journey in 'build'
    And user selects they are from the UK
    And confirms they have a valid document
    And the user drops out of the app due to an incompatible device
    And the user selects 'ukPassport' radio option and continues
    And user enters the data in Passport stub as a PassportSubject
    When user enters data in address stub and clicks on submit data and generate auth code
    Then user should be on Fraud Check (Stub)
    When user enters data in fraud build stub and clicks on submit data and generate auth code
    And the user should land onto the PIP page and select 'no' and continue
    Then User should be on KBV page and click continue
    When user enters data in kbv stub and clicks on submit data and generate auth code
    Then user should be successful in proving identity
    And User should be able to see the json response page
    Then 'vot' should be set to '"P2"' in the raw user info object
    When user starts a new full journey with the same userId in 'build'
    Then the user should be taken to the IPV Reuse Screen with One login changes
    And Relevant changes for VOT displayed in JSONResponse
