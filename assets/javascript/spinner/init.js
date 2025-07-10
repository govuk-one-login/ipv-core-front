class Spinner {
  container;
  spinnerContainer;
  ariaLiveContainer;
  content;
  domRequirementsMet;
  spinnerState;
  initTime;
  updateDomTimer;
  abortController;
  button;
  config = {
    apiUrl: "/app-vc-receipt-status",
    msBeforeInformingOfLongWait: 5000,
    msBeforeAbort: 25000,
    msBetweenRequests: 1000,
  };

  reflectCompletion = () => {
    sessionStorage.removeItem('spinnerInitTime');
    clearInterval(this.updateDomTimer);
    this.spinnerState = "complete";
  };

  reflectError = () => {
    sessionStorage.removeItem('spinnerInitTime');
    clearInterval(this.updateDomTimer);
    this.abortController.abort();
    window.location.href = "/ipv/page/pyi-technical";
  };

  reflectLongWait = () => {
    this.spinnerState = "longWait";
  };

  updateAccordingToTimeElapsed = () => {
    const elapsedMilliseconds = Date.now() - this.initTime;
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
        msBetweenDomUpdate:
          parseInt(element.dataset.msBetweenDomUpdate) ||
          this.config.msBetweenDomUpdate,
        ariaButtonEnabledMessage: element.dataset.ariaButtonEnabledMessage,
      };

      this.domRequirementsMet = true;
    } catch (e) {
      this.domRequirementsMet = false;
    }
  };

  handleAbort = () => {
    this.abortController.abort();
  }

  initialiseAbortController = () => {
    this.abortController = new AbortController();
    window.removeEventListener('beforeunload', this.handleAbort);
    window.addEventListener('beforeunload', this.handleAbort);
  }

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
    paragraphs.forEach(t => elements.push(
    {
      nodeName: "p",
      text: t,
      classes: ["centre", "spinner-state-text", "govuk-body", "govuk-!-font-weight-bold"],
    }));

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
    const spinnerStateChanged = this.displayedSpinnerState !== this.spinnerState;
    if (spinnerStateChanged) {
      const elements = this
        .createSpinnerVirtualDomElements(this.spinnerState)
        .map(this.convertToElement);
      this.spinnerContainer
        .replaceChildren(...elements);
      this.displayedSpinnerState = this.spinnerState;
    }

    if (this.spinnerState === "complete") {
      this.button.removeAttribute("disabled");
      this.updateAriaAlert(this.config.ariaButtonEnabledMessage);
      clearInterval(this.updateDomTimer);
    }
  };

  requestAppVcReceiptStatus = async () => {
    const signal = this.abortController.signal;
    await fetch(this.config.apiUrl, { signal })
      .then(response => response.json())
      .then(data => {
        if (data.status === "COMPLETED") {
          this.reflectCompletion();
        } else if (data.status === "ERROR") {
          this.reflectError();
        } else if (data.status === "PROCESSING") {
          setTimeout(async () => {
            if ((Date.now() - this.initTime) >= this.config.msBeforeAbort) {
              this.reflectError();
              return;
            }
            await this.requestAppVcReceiptStatus();
          }, this.config.msBetweenRequests);
        } else {
          throw new Error(`Unsupported status ${data.status}`);
        }
      })
      .catch(error => {
        if (error.name !== "AbortError") {
          this.reflectError();
        }
      })
  };

  // For the Aria alert to work reliably we need to create its container once and then update the contents
  // https://tetralogical.com/blog/2024/05/01/why-are-my-live-regions-not-working/
  // So here we create a separate DOM element for the Aria live text that won't be touched when the spinner updates.
  initialiseContainers = () => {
    this.spinnerContainer = document.createElement("div");
    this.ariaLiveContainer = document.createElement("div");
    this.ariaLiveContainer.setAttribute("aria-live","assertive");
    this.ariaLiveContainer.classList.add("govuk-visually-hidden");
    this.container.replaceChildren(this.spinnerContainer, this.ariaLiveContainer);
  };

  initTimer = () => {
    let spinnerInitTime = sessionStorage.getItem('spinnerInitTime')
    if(spinnerInitTime === null) {
      spinnerInitTime = Date.now();
      sessionStorage.setItem('spinnerInitTime', spinnerInitTime.toString());
    } else {
      spinnerInitTime = parseInt(spinnerInitTime, 10);
    }
    this.initTime = spinnerInitTime;
    this.updateAccordingToTimeElapsed();

    this.updateDomTimer = setInterval(() => {
      this.updateAccordingToTimeElapsed();
      this.updateDom();
    }, this.config.msBetweenDomUpdate)
  }

  init = () => {
    this.initTimer()
    this.initialiseContainers();
    this.updateDom();
    this.requestAppVcReceiptStatus()
      .then(() => this.updateDom);
  };

  constructor(domContainer) {
    this.container = domContainer;
    this.button = document.getElementById("submitButton");
    this.initialiseContent(domContainer);
    this.initialiseState();
    this.initialiseAbortController();
  }
}

const element = document.getElementById("dad-spinner-container");
if (element) {
  const spinner = new Spinner(element);
  spinner.init();
}
