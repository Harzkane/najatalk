export const AUTH_CHANGED_EVENT = "naijatalk:auth-changed";

export type StoredAuth = {
  token: string | null;
  userId: string | null;
};

export const getStoredAuth = (): StoredAuth => {
  if (typeof window === "undefined") {
    return { token: null, userId: null };
  }
  return {
    token: localStorage.getItem("token"),
    userId: localStorage.getItem("userId"),
  };
};

export const setStoredAuth = (token: string, userId: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};
