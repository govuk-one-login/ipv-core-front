class Spinner {
  container;
  spinnerContainer;
  ariaLiveContainer;
  content;
  domRequirementsMet;
  spinnerState;
  timers = {};
  initTime;
  button;
  config = {
    apiUrl: "/app-vc-receipt-status",
    msBeforeInformingOfLongWait: 5000,
    msBeforeAbort: 25000,
    msBetweenRequests: 1000,
  };

  reflectCompletion = () => {
    sessionStorage.removeItem('spinnerInitTime');
    this.spinnerState = "complete";
  };

  reflectError = () => {
    sessionStorage.removeItem('spinnerInitTime');
    window.location.href = "/ipv/page/pyi-technical";
  };

  reflectLongWait = () => {
    this.spinnerState = "longWait";
  };

  updateAccordingToTimeElapsed = () => {
    const elapsedMilliseconds = new Date().getTime() - this.initTime;
    if (elapsedMilliseconds >= this.config.msBeforeAbort) {
      this.reflectError();
    } else if (elapsedMilliseconds >= this.config.msBeforeInformingOfLongWait) {
      this.reflectLongWait();
    }
  };

  initialiseState = () => {
    if (this.domRequirementsMet) {
      this.spinnerState = "pending";
      this.button.setAttribute("disabled", true);

      let spinnerInitTime = sessionStorage.getItem('spinnerInitTime')
      if(spinnerInitTime === null) {
        spinnerInitTime = new Date().getTime();
        sessionStorage.setItem('spinnerInitTime', spinnerInitTime.toString());
      } else {
        spinnerInitTime = parseInt(spinnerInitTime, 10);
      }
      this.initTime = spinnerInitTime;
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
        ariaButtonEnabledMessage: element.dataset.ariaButtonEnabledMessage,
      };

      this.domRequirementsMet = true;
    } catch (e) {
      this.domRequirementsMet = false;
    }
  };

  createSpinnerVirtualDomElements = () => {
    const stateContent = this.content[this.spinnerState];
    let elements = [
      {
        nodeName: "div",
        id: "spinner",
        classes: ["spinner", "centre", stateContent.className ?? ""],
      },
    ];

    const paragraphs = (stateContent.text ?? "").split("\n");
    paragraphs.forEach((t) =>
      elements.push({
        nodeName: "p",
        text: t,
        classes: [
          "centre",
          "spinner-state-text",
          "govuk-body",
          "govuk-!-font-weight-bold",
        ],
      }),
    );

    return elements;
  };

  updateAriaAlert = (messageText) => {
    while (this.ariaLiveContainer.firstChild) {
      this.ariaLiveContainer.removeChild(this.ariaLiveContainer.firstChild);
    }

    /* Create new message and append it to the live region */
    const messageNode = document.createTextNode(messageText);
    this.ariaLiveContainer.appendChild(messageNode);
  };

  convertToElement = (node) => {
    const el = document.createElement(node.nodeName);
    if (node.text) el.textContent = node.text;
    if (node.id) el.id = node.id;
    if (node.classes) el.classList.add(...node.classes);
    return el;
  };

  updateDom = () => {
    const spinnerStateChanged =
      this.displayedSpinnerState !== this.spinnerState;
    if (spinnerStateChanged) {
      const elements = this.createSpinnerVirtualDomElements(
        this.spinnerState,
      ).map(this.convertToElement);
      this.spinnerContainer.replaceChildren(...elements);
      this.displayedSpinnerState = this.spinnerState;
    }

    if (this.spinnerState === "complete") {
      this.button.removeAttribute("disabled");
      this.updateAriaAlert(this.config.ariaButtonEnabledMessage);
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
        this.updateAccordingToTimeElapsed();
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

  // For the Aria alert to work reliably we need to create its container once and then update the contents
  // https://tetralogical.com/blog/2024/05/01/why-are-my-live-regions-not-working/
  // So here we create a separate DOM element for the Aria live text that won't be touched when the spinner updates.
  initialiseContainers = () => {
    this.spinnerContainer = document.createElement("div");
    this.ariaLiveContainer = document.createElement("div");
    this.ariaLiveContainer.setAttribute("aria-live", "assertive");
    this.ariaLiveContainer.classList.add("govuk-visually-hidden");
    this.container.replaceChildren(
      this.spinnerContainer,
      this.ariaLiveContainer,
    );
  };

  init = () => {
    this.initialiseContainers();
    this.updateDom();
    this.requestAppVcReceiptStatus();
  };

  constructor(domContainer) {
    this.container = domContainer;
    this.button = document.getElementById("submitButton");
    this.initialiseContent(domContainer);
    this.initialiseState();
  }
}

const element = document.getElementById("dad-spinner-container");
if (element) {
  const spinner = new Spinner(element);
  spinner.init();
}
