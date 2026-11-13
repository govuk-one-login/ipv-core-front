@accountInterventions @PYIC-8342 @QualityGateStackTest
Feature: Account Interventions IPV core E2E Tests
  As a user going through an identity journey
  I want the Account Intervention Service to gate my journey appropriately
  So that my account is protected when interventions apply

  # ─────────────────────────────────────────────────────────────────────────────
  # Rule: Check AIS descriptions
  #   These scenarios exercise the AIS description field without enabling the
  #   aisStateCheck feature set.
  # ─────────────────────────────────────────────────────────────────────────────
  Rule: Check AIS descriptions

    Background:
      Given the user starts a new journey

    @Build @QualityGateRegressionTest
    Scenario: AIS descriptions - with no interventions the journey completes successfully
      # AIS must be configured AFTER the journey start so that scenarioContext.userId is set
      Given the AIS API will return an 'AIS_NO_INTERVENTION' result
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a smartphone
      And the user has an iphone
      # MAM: enqueue VC via DCMAW stub → app callback → check-mobile-app-result → continue
      When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
      And the user returns from the app to core-front
      Then the user should see the 'check-mobile-app-result' page
      And the continue button should be enabled within 15 seconds
      When the user chooses to continue
      # Acknowledge the DCMAW success page before proceeding to address CRI
      And the user acknowledges they have successfully completed the app
      And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
      And the user continues to the RP after successfully proving their identity
      Then the user should have a 'P2' identity

    @Build @QualityGateRegressionTest
    Scenario: AIS descriptions - error returned to orchestration when account is suspended
      Given the AIS API will return an 'AIS_ACCOUNT_SUSPENDED' result
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a smartphone
      And the user has an iphone
      When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
      And the user returns from the app to core-front
      Then the user should see the 'check-mobile-app-result' page
      And the continue button should be enabled within 15 seconds
      When the user chooses to continue
      And the user acknowledges they have successfully completed the app
      And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
      Then the error response is sent to orchestration
      And the error 'session_invalidated' with description 'Account intervention detected' is shown

    @Build @PYIC-4048 @QualityGateRegressionTest
    Scenario: AIS descriptions - re-approve identity is requested for a completed web journey
      And the user is from the UK
      And the user has valid photo ID for the app
      # Drop out of app: pyi-triage-select-device (computer/tablet) →
      #   pyi-triage-select-smartphone (neither) → pyi-triage-buffer (try another way)
      And the user is on a computer or tablet
      And the user does not have an appropriate device for the app
      And the user needs another way to prove their identity from the app
      # page-multiple-doc-check: select passport (radio value "ukPassport")
      And the user has a passport for the web journey
      And the user submits 'kenneth-decerqueira-valid' 'passport' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
      And the user does not get PIP
      # page-pre-experian-kbv-transition: continue to Experian KBV
      And the user moves on to answer security questions with Experian KBV
      And the user submits 'kenneth-decerqueira-valid' 'experian-kbv' details to the CRI
      And the user continues to the RP after successfully proving their identity
      Then the user should have a 'P2' identity
      # Reprove identity: configure AIS_FORCED_USER_IDENTITY_VERIFY then restart journey
      When the user starts a reprove identity journey
      And the user lands on the reprove identity start page and continues
      Then the page heading should be 'Prove your identity using the GOV.UK One Login app'

  # ─────────────────────────────────────────────────────────────────────────────
  # Rule: Check AIS states
  #   Same three scenarios but with the 'aisStateCheck' feature set enabled.
  #   The extra Background step activates the feature set after the journey start
  #   so that scenarioContext.userId is available for AIS configuration steps.
  # ─────────────────────────────────────────────────────────────────────────────
  Rule: Check AIS states

    Background:
      Given the user starts a new journey
      And the AIS feature set 'aisStateCheck' is enabled

    @Build @QualityGateRegressionTest
    Scenario: AIS states - with no interventions the journey completes successfully
      Given the AIS API will return an 'AIS_NO_INTERVENTION' result
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a smartphone
      And the user has an iphone
      When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
      And the user returns from the app to core-front
      Then the user should see the 'check-mobile-app-result' page
      And the continue button should be enabled within 15 seconds
      When the user chooses to continue
      And the user acknowledges they have successfully completed the app
      And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
      And the user continues to the RP after successfully proving their identity
      Then the user should have a 'P2' identity

    @Build @QualityGateRegressionTest
    Scenario: AIS states - error returned to orchestration when account is suspended
      Given the AIS API will return an 'AIS_ACCOUNT_SUSPENDED' result
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a smartphone
      And the user has an iphone
      When the user submits 'kennethD' 'ukChippedPassport' 'success' details to the app
      And the user returns from the app to core-front
      Then the user should see the 'check-mobile-app-result' page
      And the continue button should be enabled within 15 seconds
      When the user chooses to continue
      And the user acknowledges they have successfully completed the app
      And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
      Then the error response is sent to orchestration
      And the error 'session_invalidated' with description 'Account intervention detected' is shown

    @Build @PYIC-4048 @QualityGateRegressionTest
    Scenario: AIS states - re-approve identity is requested for a completed web journey
      And the user is from the UK
      And the user has valid photo ID for the app
      And the user is on a computer or tablet
      And the user does not have an appropriate device for the app
      And the user needs another way to prove their identity from the app
      And the user has a passport for the web journey
      And the user submits 'kenneth-decerqueira-valid' 'passport' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'address' details to the CRI
      And the user submits 'kenneth-decerqueira-valid' 'fraud' details to the CRI
      And the user does not get PIP
      And the user moves on to answer security questions with Experian KBV
      And the user submits 'kenneth-decerqueira-valid' 'experian-kbv' details to the CRI
      And the user continues to the RP after successfully proving their identity
      Then the user should have a 'P2' identity
      When the user starts a reprove identity journey
      And the user lands on the reprove identity start page and continues
      Then the page heading should be 'Prove your identity using the GOV.UK One Login app'
