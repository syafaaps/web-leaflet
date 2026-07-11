export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("geoagri_token");
}

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("geoagri_token");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return res.json();
}

export function apiGet(url) {
  return apiFetch(url);
}

export function apiPost(url, body) {
  return apiFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut(url, body) {
  return apiFetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete(url) {
  return apiFetch(url, { method: "DELETE" });
}
