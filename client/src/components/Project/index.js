import React, { useEffect, useRef, useState } from "react";
import { useStore } from "colmado";

import "./style.scss";

import TemplateSelector from "./TemplateSelector";
import ProjectField from "./ProjectField";
import { getAuthenticatedUser, getRepo, getUser } from "../../services/api";

function validated() {
  return Promise.resolve({});
}

function validateTemplate(slug) {
  if (!slug) return validated();

  return getRepo(slug).then((res) => {
    if (res.message === "Not Found") throw new Error();
  });
}

function validateUser(slug) {
  if (!slug) return validated();

  return getUser(slug).then((res) => {
    if (res.message === "Not Found") throw new Error();
  });
}

function validateNewRepo(user, slug) {
  if (!slug || !user) return validated();

  return new Promise((res, rej) => {
    getRepo(`${user}/${slug}`)
      .then((resp) => {
        if (resp.message === "Not Found") res();
        else rej();
      })
      .catch((_) => res());
  });
}

function validateExistingRepo(user, slug) {
  if (!slug || !user) return validated();

  return getRepo(`${user}/${slug}`).then((res) => {
    if (res.message === "Not Found") throw new Error();
  });
}

function validateToken(token) {
  if (!token) return validated();

  return getAuthenticatedUser(token).then((res) => {
    if (res.message === "Bad credentials") throw new Error();
  });
}

function validateDomain(domain) {
  if (!domain) return validated();

  return new Promise((res, rej) => {
    if (
      /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$)/.test(domain)
    ) {
      res();
    } else rej();
  });
}

function validateEmail(email) {
  if (!email) return validated();

  return new Promise((res, rej) => {
    if (/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/.test(email)) {
      res();
    } else rej();
  });
}

function Project({ mode }) {
  const [{ project }, dispatch] = useStore();
  const [state, setState] = useState({
    GH_TEMPLATE: "codeccoop/vocero-minima",
    GH_BRANCH: "vocero",
    GH_DOMAIN: "username.github.io",
  });

  useEffect(() => {
    dispatch({
      action: "PATCH_PROJECT",
      payload: { ...state, ...project },
    });
  }, []);

  useEffect(() => {
    setState({ ...state, ...project });
  }, [project]);

  const lastState = useRef(state);
  useEffect(() => {
    if (lastState.current.GH_USER !== state.GH_USER) {
      if (/\.github\.io$/.test(state.GH_DOMAIN)) {
        dispatch({
          action: "PATCH_PROJECT",
          payload: { GH_DOMAIN: state.GH_USER + ".github.io" },
        });
      }
    }

    return () => {
      lastState.current = state;
    };
  }, [state]);

  return (
    <div className="vocero-project">
      <form className="vocero-project__form">
        {mode === "new" && (
          <TemplateSelector
            validation={validateTemplate}
            defaultValue={state.GH_TEMPLATE}
          />
        )}
        <ProjectField
          field="GH_EMAIL"
          type="email"
          label="User email"
          validation={validateEmail}
        />
        <ProjectField field="GH_USER" label="Github User" validation={validateUser} />
        <ProjectField
          field="GH_ACCESS_TOKEN"
          label="Github Token"
          type="password"
          validation={validateToken}
        />
        {mode === "new" ? (
          <ProjectField
            field="GH_REPO"
            label="Github Repository"
            validation={(slug) => validateNewRepo(project.GH_USER, slug)}
          />
        ) : (
          <ProjectField
            field="GH_REPO"
            label="Github Repository"
            validation={(slug) => validateExistingRepo(project.GH_USER, slug)}
          />
        )}
        <ProjectField
          field="GH_BRANCH"
          label="Git Branch"
          validation={validated}
          defaultValue={state.GH_BRANCH}
        />
        <ProjectField
          field="GH_DOMAIN"
          label="Public domain"
          validation={validateDomain}
          defaultValue={state.GH_DOMAIN}
        />
      </form>
    </div>
  );
}

export default Project;
