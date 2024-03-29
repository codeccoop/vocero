/* VENDOR */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "colmado";

/* SOURCE */
import ProjectTree from "components/ProjectTree";
import { commit, observeWorkflowRun, getArtifact } from "services/api";
import { b64d } from "utils";

/* STYLE */
import "./style.scss";

function Sidebar({ toggleVisibility }) {
  const navigate = useNavigate();
  const [{ branch, project, changes }, dispatch] = useStore();
  const [isBuilding, setIsBuilding] = useState(false);

  function goSettings() {
    navigate("/settings");
  }

  function openSite() {
    if (/github\.io/.test(project.GH_DOMAIN)) {
      if (/github\io$/.test(project.GH_REPO)) {
        window.open(`https://${project.GH_DOMAIN}`);
      } else {
        window.open(`https://${project.GH_USER}.github.io/${project.GH_REPO}`);
      }
    } else {
      window.open("https://" + project.GH_DOMAIN);
    }
  }

  function downloadBuild() {
    getArtifact()
      .then((blob) => {
        debugger;
        if (blob.type === "application/json") throw new Error(blob);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "vocero.zip";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch(console.error);
  }

  function commitChanges(changes) {
    commit(changes).then((commit) => {
      localStorage.removeItem("_VOCERO_TREE");
      const changeMap = changes.reduce((acum, from) => {
        return acum.concat([
          [
            from.sha,
            commit.changes.find((to) => to.path === b64d(from.path)).sha,
          ],
        ]);
      }, []);
      dispatch({
        action: "CLEAR_CHANGES",
      });
      dispatch({
        action: "FETCH_BRANCH",
      });
      setIsBuilding(true);
      observeWorkflowRun().finally(() => {
        setIsBuilding(false);
      });
    });
  }

  return (
    <div className="sidebar">
      <div className="sidebar__head">
        <span onClick={toggleVisibility}>&laquo;</span>
      </div>
      <ProjectTree />
      <div className="sidebar__bottom">
        <div className="sidebar__controls">
          <a
            className="icon settings"
            disabled={branch?.ahead_by > 0 ? "" : " disabled"}
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
        <button
          className="btn"
          disabled={isBuilding}
          data-changes={(changes || []).length}
          onClick={() => commitChanges(changes)}
        >
          {isBuilding ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
