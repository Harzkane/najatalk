import { isAxiosError } from "axios";

const STATUS_MESSAGE: Record<number, string> = {
  400: "Please check your input and try again.",
  401: "Invalid credentials. Try again.",
  403: "This action is not allowed for this account right now.",
  404: "We could not find that resource.",
  409: "This account already exists. Try signing in instead.",
  422: "Some fields are invalid. Please review and retry.",
  429: "Too many attempts. Please wait a minute and try again.",
  500: "Server error. Please try again shortly.",
  502: "Service is temporarily unavailable. Please try again shortly.",
  503: "Service is temporarily unavailable. Please try again shortly.",
};

export const getAuthErrorMessage = (err: unknown, fallback: string) => {
  if (!isAxiosError<{ message?: string }>(err)) return fallback;

  if (!err.response) {
    return "Network error. Check your connection and retry.";
  }

  const backendMessage = err.response.data?.message?.trim();
  if (backendMessage) return backendMessage;

  return STATUS_MESSAGE[err.response.status] || fallback;
};

export const getAuthErrorStatus = (err: unknown) => {
  if (!isAxiosError(err)) return 0;
  return err.response?.status || 0;
};
