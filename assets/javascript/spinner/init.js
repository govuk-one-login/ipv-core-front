class Spinner {
  container;
  content;
  domRequirementsMet;
  spinnerState;
  timers = {};
  button;
  config = {
    apiUrl: "/app-vc-receipt-status",
    msBeforeAbort: 25000,
    msBetweenRequests: 1000,
  };

  reflectCompletion = () => {
    this.spinnerState = "complete";
  };

  reflectError = () => {
    window.location.href = "/ipv/page/pyi-technical";
  };


  initialiseTimers = () => {
    if (this.domRequirementsMet) {
      this.timers.abortUnresponsiveRequest = setTimeout(() => {
        this.reflectError();
      }, this.config.msBeforeAbort);
    }
  };

  initialiseState = () => {
    if (this.domRequirementsMet) {
      this.spinnerState = "pending";
      this.button.setAttribute("disabled", true);
    }
  };

  initialiseContent = (element) => {
    try {
      this.content = {
        pending: {
          text: element.dataset.initialSpinnerstatetext,
          className: element.dataset.initialSpinnerstate,
        },
        complete: {
          text: element.dataset.completeSpinnerstatetext || "",
          className: element.dataset.completeSpinnerstate,
        },
      };

      this.config = {
        apiUrl: element.dataset.apiUrl || this.config.apiUrl,
        msBeforeAbort:
          parseInt(element.dataset.msBeforeAbort) || this.config.msBeforeAbort,
        msBetweenRequests:
          parseInt(element.dataset.msBetweenRequests) ||
          this.config.msBetweenRequests,
      };

      this.domRequirementsMet = true;
    } catch (e) {
      this.domRequirementsMet = false;
    }
  };

  createVirtualDom = () => {
    const stateContent = this.content[this.spinnerState];
    return [
      {
        nodeName: "div",
        id: "spinner",
        classes: ["spinner", "centre", stateContent.className ?? ""],
      },
      {
        nodeName: "p",
        text: stateContent.text ?? "",
        classes: ["centre", "spinner-state-text", "govuk-body"],
      },
    ];
  };

  convert = (node) => {
    const el = document.createElement(node.nodeName);
    if (node.text) el.textContent = node.text;
    if (node.id) el.id = node.id;
    if (node.classes) el.classList.add(...node.classes);
    return el;
  };

  updateDom = () => {
    const spinnerStateChanged = this.displayedSpinnerState !== this.spinnerState;
    if (spinnerStateChanged) {
      const elements = this
        .createVirtualDom(this.spinnerState)
        .map(this.convert);
      this.container
        .replaceChildren(...elements);
      this.displayedSpinnerState = this.spinnerState;
    }

    if (this.spinnerState === "complete") {
      this.button.removeAttribute("disabled");
    }
  };

  requestAppVcReceiptStatus = async () => {
    try {
      const response = await fetch(this.config.apiUrl);
      const data = await response.json();

      if (data.status === "COMPLETED") {
        this.reflectCompletion();
      } else if (data.status === "ERROR") {
        this.reflectError();
      } else if (data.status === "PROCESSING") {
        setTimeout(async () => {
          await this.requestAppVcReceiptStatus();
        }, this.config.msBetweenRequests);
      } else {
        throw new Error(`Unsupported status ${data.status}`);
      }
    } catch (e) {
      this.reflectError();
    } finally {
      this.updateDom();
    }
  };

  init = () => {
    this.initialiseTimers();
    this.updateDom();
    this.requestAppVcReceiptStatus();
  };

  constructor(domContainer) {
    this.container = domContainer;
    this.button = document.getElementById("submitButton");
    this.initialiseContent(this.container);
    this.initialiseState();
  }
}

const element = document.getElementById("dad-spinner-container");
if (element) {
  const spinner = new Spinner(element);
  spinner.init();
}
