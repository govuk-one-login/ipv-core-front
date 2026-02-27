Feature: E2E Passport Journey

  @Build @Lamdatesta @PYIC-5477 @PYIC-6863 @PYIC-7016
  Scenario: Passport details page happy path
    When the user starts a new journey in 'build'
    And the user selects they are from the UK
    And the user confirms they have suitable photo ID
    And the user drops out of the app due to an incompatible device
    Then the user should see the 'page-multiple-doc-check' page
    When the user selects 'ukPassport' radio option and continues
    And the user submits 'kenneth-decerqueira-valid' details to the 'passport' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'address' CRI stub
    And the user submits 'kenneth-decerqueira-valid' details to the 'fraud' CRI stub
    Then the user should see the 'personal-independence-payment' page
    When the user selects 'end' radio option and continues
    Then the user should see the 'page-pre-experian-kbv-transition' page
    When the user chooses to continue
    And the user submits 'kenneth-decerqueira-valid' details to the 'experian-kbv' CRI stub
    Then the user should see the 'page-ipv-success' page
    When the user chooses to continue
    Then the user should have a 'P2' identity

    When the user starts a new journey in 'build'
    Then the user should see the 'page-ipv-reuse' page
    And Kenneth Decerqueira's information is displayed on the reuse screen
    When the user chooses to continue
    Then the user should have a 'P2' identity
