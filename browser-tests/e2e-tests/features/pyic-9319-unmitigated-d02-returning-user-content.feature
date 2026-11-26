Feature: Content for a returning user with an unmitigated D02
  As a returning user who abandoned a journey after a D02 from a UK passport or UK photocard driving licence check
  I want to see clear content telling me which document I need to continue
  So that I can choose how to continue proving my identity

  Rule: Returning user with an unmitigated driving licence D02

    Background: User abandons the web journey after receiving a D02
      Given the user starts a new journey
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a computer or tablet
      And the user does not have an appropriate device for the app
      And the user needs another way to prove their identity from the app
      And the user has a driving licence for the web journey
      And the user submits 'kenneth-decerqueira-valid' 'driving-licence' details to the CRI with a 'D02' CI
      And the user abandons the journey
      And the user starts a new journey

    @PYIC-9319
    Scenario: User chooses to continue with the required document
      Then the user should see the 'pyi-continue-with-passport' page
      And the user should see the heading 'You need a UK passport to continue'
      And the user should see the text 'You can use a UK passport up to 18 months after its expiry date.'
      And the user should see the details 'Why you need a UK passport' containing 'There was a problem when you last tried to prove your identity.'
      And the user should see the radio option 'Continue with a UK passport' with the hint 'We’ll need to check some details to prove your identity'
      And the user should see the radio option 'Go to the service you need to use' with the hint 'Find out if there are other ways to access the service'
      When the user selects the radio option 'Continue with a UK passport'
      And the user chooses to continue
      Then the user should not see a validation error
      And the user should not see the 'pyi-continue-with-passport' page

    @PYIC-9319
    Scenario: User chooses to return to their service
      Then the user should see the 'pyi-continue-with-passport' page
      When the user selects the radio option 'Go to the service you need to use'
      And the user chooses to continue
      Then the user should not see a validation error

    @PYIC-9319
    Scenario: User continues without selecting an option
      Then the user should see the 'pyi-continue-with-passport' page
      When the user chooses to continue
      Then the user should see the 'There is a problem' error summary with the message 'Select what you would like to do'
      And the user should see the inline error message 'Select what you would like to do'
      And the user should see the 'pyi-continue-with-passport' page

    @PYIC-9319
    Scenario: Welsh content is displayed
      Then the user should see the 'pyi-continue-with-passport' page
      When the user switches the page language to Welsh
      Then the user should see the heading 'Rydych angen pasbort y DU i barhau'
      And the user should see the text 'Gallwch ddefnyddio pasbort y DU hyd at 18 mis ar ôl iddo ddod i ben.'
      And the user should see the details 'Pam ydych chi angen pasbort y DU' containing 'Roedd problem pan wnaethoch chi geisio profi eich hunaniaeth ddiwethaf.'
      And the user should see the text 'Beth hoffech chi ei wneud?'
      And the user should see the radio option 'Parhau gyda phasbort y DU' with the hint 'Bydd angen i ni wirio rhai manylion i brofi eich hunaniaeth'
      And the user should see the radio option 'Mynd i’r gwasanaeth rydych angen ei ddefnyddio' with the hint 'Darganfyddwch a oes ffyrdd eraill o gael mynediad i’r gwasanaeth'

    @PYIC-9319
    Scenario: User opens the contact link
      Then the user should see the 'pyi-continue-with-passport' page
      When the user selects the 'Contact the One Login team' link
      Then the contact page is opened in a new tab

  Rule: Returning user with an unmitigated passport D02

    Background: User abandons the web journey after receiving a D02
      Given the user starts a new journey
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a computer or tablet
      And the user does not have an appropriate device for the app
      And the user needs another way to prove their identity from the app
      And the user has a passport for the web journey
      And the user submits 'kenneth-decerqueira-valid' 'passport' details to the CRI with a 'D02' CI
      And the user abandons the journey
      And the user starts a new journey

    @PYIC-9319
    Scenario: User chooses to continue with the required document
      Then the user should see the 'pyi-continue-with-driving-licence' page
      And the user should see the heading 'You need a UK photocard driving licence to continue'
      And the user should see the text 'It can be a full or provisional licence'
      And the user should see the details 'Why you need a UK driving licence' containing 'There was a problem when you last tried to prove your identity.'
      And the user should see the radio option 'Continue with UK photocard driving licence' with the hint 'We’ll need to check some details to prove your identity'
      And the user should see the radio option 'Go to the service you need to use' with the hint 'Find out if there are other ways to access the service'
      When the user selects the radio option 'Continue with UK photocard driving licence'
      And the user chooses to continue
      Then the user should not see a validation error
      And the user should not see the 'pyi-continue-with-driving-licence' page

    @PYIC-9319
    Scenario: User chooses to return to their service
      Then the user should see the 'pyi-continue-with-driving-licence' page
      When the user selects the radio option 'Go to the service you need to use'
      And the user chooses to continue
      Then the user should not see a validation error

    @PYIC-9319
    Scenario: User continues without selecting an option
      Then the user should see the 'pyi-continue-with-driving-licence' page
      When the user chooses to continue
      Then the user should see the 'There is a problem' error summary with the message 'Select what you would like to do'
      And the user should see the inline error message 'Select what you would like to do'
      And the user should see the 'pyi-continue-with-driving-licence' page

    @PYIC-9319
    Scenario: Welsh content is displayed
      Then the user should see the 'pyi-continue-with-driving-licence' page
      When the user switches the page language to Welsh
      Then the user should see the heading 'Rydych angen trwydded yrru cerdyn-llun y DU i barhau'
      And the user should see the text 'Gall fod yn drwydded lawn neu dros dro'
      And the user should see the details 'Pam ydych chi angen trwydded yrru’r DU' containing 'Roedd problem pan wnaethoch chi geisio profi eich hunaniaeth ddiwethaf.'
      And the user should see the text 'Beth hoffech chi ei wneud?'
      And the user should see the radio option 'Parhau gyda thrwydded yrru cerdyn-llun y DU' with the hint 'Bydd angen i ni wirio rhai manylion i brofi eich hunaniaeth'
      And the user should see the radio option 'Mynd i’r gwasanaeth rydych angen ei ddefnyddio' with the hint 'Darganfyddwch a oes ffyrdd eraill o gael mynediad i’r gwasanaeth'

    @PYIC-9319
    Scenario: User opens the contact link
      Then the user should see the 'pyi-continue-with-driving-licence' page
      When the user selects the 'Contact the One Login team' link
      Then the contact page is opened in a new tab
