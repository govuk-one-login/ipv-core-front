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
        } else if (data.status === "ERROR") {
          return 3; // Backoff
        }
        throw new Error(`Unexpected status: ${data.status}`);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Unexpected error in pollFunction, backing off: ", error);
          return 3; // Backoff
        }
        return 1; // Failure
      });
  }
}
