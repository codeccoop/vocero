import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useStore } from "colmado";

import "./style.scss";
// import sendIcon from "../../assets/icons/send-icon.png";
// import settingsIcon from "../../assets/icons/settings-icon.png";
// import visitIcon from "../../assets/icons/visit-icon.png";
import Directory from "../Directory";
import { commit, observeWorkflow, getArtifact } from "../../services/api";

function Sidebar({ toggleVisibility }) {
  const navigate = useNavigate();
  const [{ branch, project, changes }, dispatch] = useStore();
  const [isBuilding, setIsBuilding] = useState(false);

  function goSettings() {
    navigate("/settings");
  }

  function openSite() {
    if (project.GH_DOMAIN === "repo") {
      window.open(`https://${project.GH_USER}.github.io/${project.GH_REPO}`);
    } else {
      window.open("https://" + project.GH_DOMAIN);
    }
  }

  function downloadBuild() {
    getArtifact()
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "latest.zip";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch(console.error);
  }

  function commitChanges() {
    commit(changes).then((commit) => {
      const changeMap = changes.reduce((acum, from) => {
        return acum.concat([
          [from.sha, commit.changes.find((to) => to.path === atob(from.path)).sha],
        ]);
      }, []);
      dispatch({
        action: "CLEAR_CHANGES",
      });
      dispatch({
        action: "REFRESH_SHA",
        payload: changeMap,
      });
      setIsBuilding(true);
      observeWorkflow().finally(() => {
        setIsBuilding(false);
      });
    });
  }

  return (
    <div className="sidebar">
      <div className="sidebar__head">
        <h2>
          {branch["repo"] || "REPO NAME"}
          <span onClick={toggleVisibility}>&laquo;</span>
        </h2>
      </div>
      <Directory />
      <div className="sidebar__bottom">
        <div className="sidebar__controls">
          <a
            className="icon settings"
            disabled={branch.ahead_by > 0 ? "" : " disabled"}
            onClick={goSettings}
          >
            <abbr title="Settings"></abbr>
          </a>
          <a className="icon visit" onClick={openSite}>
            <abbr title="Visit"></abbr>
          </a>
          <a className="icon send" onClick={downloadBuild}>
            <abbr title="Publish"></abbr>
          </a>
        </div>
        <a
          className="btn"
          disabled={isBuilding}
          data-changes={(changes || []).length}
          onClick={commitChanges}
        >
          Commit
        </a>
      </div>
    </div>
  );
}

export default Sidebar;
