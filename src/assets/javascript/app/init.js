// Globally disable second clicks on the continue button for radio button pages,
// But allow onSubmit scripts to overwrite this global behaviour
let disableSubmit = false;

const manageFormClicks = document.querySelectorAll("form");

manageFormClicks.forEach((form) => {
  form.addEventListener("submit", () => {
    if (!disableSubmit) {
      disableSubmit = true;
      document.getElementById("submitButton").disabled = true;
      return true;
    }
    return false;
  });
});
