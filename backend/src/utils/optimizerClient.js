import { config } from "../config/env.js";

export async function optimize(payload) {
  let response;
  const baseUrl = (config.FASTAPI_URL || "http://localhost:8000").replace(/\/+$/, "");
  const targetUrl = `${baseUrl}/optimize`;

  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error("Optimization service is offline or unreachable.");
  }

  if (!response.ok) {
    let errorMessage = "Optimization service failed.";

    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}