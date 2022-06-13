console.log('GTM test active. Click the feedback link in the phase banner to test.');
const feedback = document.querySelector('.govuk-phase-banner a');
feedback.addEventListener("click", event => {
  console.log('Feedback link clicked');
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "gaEvent",
    "component":{
    'category':'navigation',
    'section':'phase banner',
    'main_type':'link',
    'action':'click',
    'text':'feedback',
    'url':'https://signin.account.gov.uk/contact-us?supportType=PUBLIC'}
  });
});
