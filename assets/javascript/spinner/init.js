class Spinner {
  container;
  content;
  domRequirementsMet;
  spinnerState;
  timers = {};
  button;
  config = {
    apiUrl: "/app-vc-receipt-status",
    msBeforeInformingOfLongWait: 5000,
    msBeforeAbort: 25000,
    msBetweenRequests: 1000,
  };

  reflectCompletion = () => {
    this.spinnerState = "complete";
  };

  reflectError = () => {
    window.location.href = "/ipv/page/pyi-technical";
  };

  reflectLongWait = () => {
    this.spinnerState = "longWait";
  };

  initialiseTimers = () => {
    if (this.domRequirementsMet) {
      this.timers.informUserWhereWaitIsLong = setTimeout(() => {
        this.reflectLongWait();
      }, this.config.msBeforeInformingOfLongWait);

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
        longWait: {
          text: element.dataset.longwaitSpinnerstatetext,
          className: "spinner__long-wait",
        },
      };

      this.config = {
        apiUrl: element.dataset.apiUrl || this.config.apiUrl,
        msBeforeInformingOfLongWait:
          parseInt(element.dataset.msBeforeInformingOfLongWait) ||
          this.config.msBeforeInformingOfLongWait,
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
    let elements = [
      {
        nodeName: "div",
        id: "spinner",
        classes: ["spinner", "centre", stateContent.className ?? ""],
      },
    ];

    const paragraphs = (stateContent.text ?? "").split("\n");
    paragraphs.forEach(t => elements.push(
    {
      nodeName: "p",
      text: t,
      classes: ["centre", "spinner-state-text", "govuk-body", "govuk-!-font-weight-bold"],
    }));

    return elements;
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
