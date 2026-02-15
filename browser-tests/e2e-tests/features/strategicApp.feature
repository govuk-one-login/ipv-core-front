@QualityGateStackTest
Feature: StrategicApp

  @Build @QualityGateRegressionTest
  Scenario: Happy MAM iPhone journey
    Given user starts a fresh full journey in 'build'
    And the 'strategicApp' feature set is enabled
    And the user should see a page with heading 'Where do you live?'
    When clicks 'UK, Channel Islands or Isle of Man' radio, then continue
    Then the user should see a page with heading 'Tell us if you have one of the following types of photo ID'
    When clicks 'Yes' radio, then continue
    Then the user should see a page with heading 'Are you on a computer or a tablet right now?'
    When clicks 'No - I am on a smartphone' radio, then continue
    Then the user should see a page with heading 'Tell us what smartphone you are using now'
    When clicks "Yes - I'm on an iPhone" radio, then continue
    And the DCMAW CRI produces a 'kennethD' 'ukChippedPassport' 'success' VC
    And user returns from the app to core-front
    Then the user should see a page with heading "We're checking your details"
    Then the continue button should be enabled within 15 seconds
    When the user clicks on the Continue button
    Then the user should see a page with heading "We've successfully matched you to the photo on your ID"
    When the user clicks on the Continue button
    Then the user should see a page with heading 'Address (Stub)'
    When submits 'Kenneth Decerqueira (Valid Experian) Address' evidence
    Then the user should see a page with heading 'Fraud Check (Stub)'
    When submits 'Kenneth Decerqueira (Valid Experian) Fraud' evidence with scores
      | Attribute                  | Values |
      | fraud                      | 1      |
      | activity                   | 0      |
    Then user should have a '"P2"' identity

  @Build @PYIC-7471 @QualityGateRegressionTest
  Scenario: Happy DAD journey
    Given user starts a fresh full journey in 'build'
    And the 'strategicApp' feature set is enabled
    And the user should see a page with heading 'Where do you live?'
    When clicks 'UK, Channel Islands or Isle of Man' radio, then continue
    Then the user should see a page with heading 'Tell us if you have one of the following types of photo ID'
    When clicks 'Yes' radio, then continue
    Then the user should see a page with heading 'Are you on a computer or a tablet right now?'
    When clicks 'Yes - I am on a computer or tablet' radio, then continue
    Then the user should see a page with heading 'Tell us if you have access to an iPhone or Android phone'
    When clicks 'Yes - I have access to an iPhone' radio, then continue
    Then the user should see a page with heading "Use the GOV.UK One Login app to prove your identity"
    And the user should see text "Waiting for you to open the app" by 5 seconds
    When the DCMAW CRI produces a 'kennethD' 'ukChippedPassport' 'success' VC
    Then the continue button should be enabled within 15 seconds
    When the user clicks on the Continue button
    Then the user should see a page with heading "We've successfully matched you to the photo on your ID"
    When the user clicks on the Continue button
    Then the user should see a page with heading 'Address (Stub)'
    When submits 'Kenneth Decerqueira (Valid Experian) Address' evidence
    Then the user should see a page with heading 'Fraud Check (Stub)'
    When submits 'Kenneth Decerqueira (Valid Experian) Fraud' evidence with scores
      | Attribute                  | Values |
      | fraud                      | 1      |
      | activity                   | 0      |
    Then user should have a '"P2"' identity
