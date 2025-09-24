// The generated function is for use with the frontend-ui spinner component
function generatePollApiFunction(url) {
  return async function pollApiFunction(abortSignal) {
    await fetch(url, { signal: abortSignal })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "COMPLETED" || data.status === "INTERVENTION") {
          return 0; // Success
        } else if (data.status === "ERROR") {
          return 1; // Failure
        } else {
          return 2; // Pending
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error in pollFunction:", error);
        }
        return 1; // Failure
      });
  }
}
