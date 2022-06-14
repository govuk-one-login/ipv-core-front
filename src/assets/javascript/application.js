const feedback = document.querySelector('.govuk-phase-banner a');
feedback.addEventListener("click", event => { // eslint-disable-line no-unused-vars
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
