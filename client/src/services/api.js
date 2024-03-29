const BASE_URL = process.env.VOCERO_BASE_URL.replace(/\/+$/, "");
const API_URL = process.env.VOCERO_API_URL;

function request(
  endpoint,
  { method = "GET", data = null, headers = { Accept: "application/json" } }
) {
  let path = `${BASE_URL}${API_URL}/${endpoint}`;
  if (method === "GET" || method === "DELETE") {
    const query = Object.entries(data || {})
      .filter(([k, v]) => v !== null && v !== void 0)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    if (query.length) {
      path += "?" + query;
    }

    data = null;
  } else {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    method: method,
    headers: headers,
    mode: "no-cors",
    cache: "no-cache",
    referrerPolicy: "no-referrer",
    credentials: "same-origin",
  };

  if (process.env.NODE_ENV === "development") {
    config.mode = "cors";
    config.credentials = "omit";
  }

  if (data) config.body = JSON.stringify(data);

  const req = fetch(path, config);
  if (headers["Accept"] === "application/json") {
    return req.then((res) => res.json());
  }

  return req;
}

export function getProject() {
  return request("project", {});
}

export function postProject(project) {
  return request("project", {
    method: "POST",
    data: project,
  });
}

export function getConfig(tree_sha) {
  return request("config", { data: { tree_sha } });
}

export function getStyle(tree_sha) {
  return request("style", { data: { tree_sha } });
}

export function getBlocks(tree_sha) {
  return request("blocks", {
    data: { tree_sha },
    headers: { Accept: "text/javascript" },
  });
}

export function init() {
  return request("init", {});
}

export function getBranch(branch_name) {
  return request("branch", { data: { name: branch_name } });
}

export function getTree(sha) {
  return request("tree", { data: { sha: sha } });
}

export function getBlob({ sha, path }) {
  return request("blob", { data: { sha, path } });
}

export function commit(changes) {
  const data = changes.map(({ path, content, frontmatter, encoding }) => ({
    path,
    content,
    frontmatter,
    encoding,
  }));
  return request("commit", { method: "POST", data });
}

export function dropBlob({ sha, path }) {
  return request("commit", { method: "DELETE", data: { sha, path } });
}

export function postPull() {
  return request("pull", { method: "POST" });
}

export function getWorkflowRun() {
  return request("workflow_run", { method: "GET" });
}

export function observeWorkflowRun(interval = 10e3, timeout = 3e2) {
  const start = Date.now();
  let time_delta = 0;

  return new Promise((res, rej) => {
    function abort(msg = "Timeout error") {
      rej(new Error(msg));
    }

    function observe() {
      time_delta = (start - Date.now()) / 1e3;
      if (time_delta <= timeout) {
        getWorkflowRun()
          .then((data) => {
            if (data.status === "completed") {
              if (data.conclusion === "success") res(data);
              else abort(data);
            } else if (data.status === "error") {
              abort(data);
            } else {
              setTimeout(observe, interval);
            }
          })
          .catch(() => setTimeout(observe, interval));
      } else abort();
    }

    observe();
  });
}

export function getArtifact() {
  return request("artifact", {
    headers: { Accept: "application/zip" },
  }).then((res) => res.blob());
}

export function getRepo(slug) {
  return fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  }).then((res) => res.json());
}

export function getUser(slug) {
  return fetch(`https://api.github.com/users/${slug}`, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  }).then((res) => res.json());
}

export function getAuthenticatedUser(token) {
  return fetch("https://api.github.com/users", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());
}
