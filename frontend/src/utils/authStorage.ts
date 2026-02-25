export const AUTH_CHANGED_EVENT = "naijatalk:auth-changed";
const AUTH_COOKIE = "nt_auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

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
  document.cookie = `${AUTH_COOKIE}=1; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const syncAuthCookie = () => {
  if (typeof window === "undefined") return;
  const { token } = getStoredAuth();
  if (token) {
    document.cookie = `${AUTH_COOKIE}=1; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
};
