const KEY = "me_encontra_admin";

export function isAdminLoggedIn() {
  return sessionStorage.getItem(KEY) === "1";
}

export function setAdminSession() {
  sessionStorage.setItem(KEY, "1");
}

export function clearAdminSession() {
  sessionStorage.removeItem(KEY);
}
