class Spinner {
  container;
  content;
  domRequirementsMet;
  state;
  timers;
  config = {
    apiUrl: "/app-vc-receipt-status",
    msBeforeInformingOfLongWait: 5000,
    msBeforeAbort: 25000,
    msBetweenRequests: 1000,
  };

  reflectCompletion = () => {
    this.state.spinnerState = "complete";
    this.state.done = true;
  };

  reflectError = () => {
    window.location.href = "/ipv/page/pyi-technical";
  };

  reflectLongWait = () => {
    this.state.spinnerState = "longWait";
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
      this.state = {
        spinnerState: "pending",
        done: false,
        error: false,
        virtualDom: [],
      };
      const button = document.getElementById("submitButton");
      button.setAttribute("disabled", true);
      this.timers = {};
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
    const stateContent = this.content[this.state.spinnerState];
    const className = stateContent.className || "";
    return [
      {
        nodeName: "div",
        id: "spinner",
        classes: ["spinner", "centre", className],
      },
      {
        nodeName: "p",
        text: stateContent.text || "",
        classes: ["centre", "spinner-state-text", "govuk-body"],
      },
    ];
  };

  ifSpinnerStateChanged = (currentVDom, nextVDom) => {
    return JSON.stringify(currentVDom) !== JSON.stringify(nextVDom);
  };

  convert = (node) => {
    const el = document.createElement(node.nodeName);
    if (node.text) el.textContent = node.text;
    if (node.id) el.id = node.id;
    if (node.classes) el.classList.add(...node.classes);
    return el;
  };

  updateDom = () => {
    const vDomChanged = this.ifSpinnerStateChanged(
      this.state.virtualDom,
      this.createVirtualDom()
    );
    const container = document.getElementById("dad-spinner-container");

    if (vDomChanged) {
      this.state.virtualDom = this.createVirtualDom();
      const elements = this.state.virtualDom.map(this.convert);
      container.replaceChildren(...elements);
    }

    if (this.state.done) {
      const button = document.getElementById("submitButton");
      button.removeAttribute("disabled");
      clearInterval(this.timers.updateDomTimer);
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
    this.initialiseContent(this.container);
    this.initialiseState();
  }
}

const element = document.getElementById("dad-spinner-container");
if (element) {
  const spinner = new Spinner(element);
  spinner.init();
}
