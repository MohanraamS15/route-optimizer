export function parseError(err, fallbackMessage = "An unexpected error occurred.") {
  // If we don't have a response object from Axios, it might be a network error or client-side error
  if (!err.response) {
    return err.message || fallbackMessage;
  }

  const data = err.response.data;

  // If the backend sent an explicit error message string
  if (data && data.error && typeof data.error === "string") {
    return data.error;
  }

  // If the backend sent an array of validation errors (e.g. from Zod or Prisma)
  if (data && data.error && Array.isArray(data.error)) {
    // Format Zod errors nicely: "field_name: Error message"
    const messages = data.error.map((errObj) => {
      if (errObj.path && errObj.message) {
        return `${errObj.path.join(".")}: ${errObj.message}`;
      }
      return JSON.stringify(errObj);
    });
    return messages.join("\n");
  }

  // If the backend sent an object with a generic message
  if (data && data.message && typeof data.message === "string") {
    return data.message;
  }

  // Fallback for unhandled structured errors
  if (data && typeof data === "object") {
    try {
      return "Error details:\n" + JSON.stringify(data, null, 2);
    } catch {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
}
