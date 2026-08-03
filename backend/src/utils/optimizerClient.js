import { config } from "../config/env.js";

export async function optimize(payload) {
  const response = await fetch(`${config.FASTAPI_URL}/optimize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Optimization service failed.";

    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      // Ignore JSON parsing errors and use the default message
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}