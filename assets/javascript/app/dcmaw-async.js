// The generated function is for use with the frontend-ui spinner component
function generatePollApiFunction(url) {
  return async function pollApiFunction(abortSignal) {
    return fetch(url, { signal: abortSignal })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "COMPLETED") {
          return 0; // Success
        } else if (data.status === "PROCESSING") {
          return 2; // Pending
        } else if (data.status === "SERVER_ERROR") {
          return 3; // Backoff
        } else if (data.status === "CLIENT_ERROR") {
          return 3; // Backoff
        }
        throw new Error(`Unexpected status: ${data.status}`);
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          // If the error is an AbortError then the user is navigating away from the page (probably a refresh) so we
          // don't want to trigger success or failure methods.
          return 2; // Pending
        }

        console.error("Unexpected error in pollFunction, backing off: ", error);
        return 3; // Backoff
      });
  }
}
