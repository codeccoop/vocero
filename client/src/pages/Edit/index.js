import React, { useState, useEffect } from "react";
// import { marked } from "marked";
import { useStore } from "colmado";

import Editor from "../../components/Editor";
import Preview from "../../components/Preview";
import AssetViewer from "../../components/AssetViewer";
import YamlForm from "../../components/YamlForm";

import { getBlob } from "../../services/api";
import { renderBlocks, hydrateBlocks } from "../../lib/blocks";
import useMarked from "../../hooks/useMarked";

import "./style.scss";

function getEditMode(queryPath) {
  let path;
  try {
    path = atob(queryPath);
  } catch (err) {
    return "editor";
  }
  if (path.match(/^\_data/)) {
    return "data";
  } else if (path.match(/^assets/)) {
    return "asset";
  } else {
    return "editor";
  }
}

function EditorPage() {
  const defaultContent = "# Loading file contents...";

  const marked = useMarked();

  const [blob, setBlob] = useState({
    content: null,
    sha: null,
    frontmatter: null,
    path: null,
    encoding: null,
  });

  const [editorContent, setEditorContent] = useState(defaultContent);

  const [{ query, changes, blocks }, dispatch] = useStore();

  const [hasChanged, setHasChanged] = useState(false);

  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setBlob({ ...blob, content: null });
    setEditorContent(defaultContent);
    if (query.sha) retriveBlob();
  }, [query.sha]);

  useEffect(() => {
    setHasChanged(editorContent !== blob.content && editorContent !== defaultContent);
  }, [editorContent]);

  useEffect(() => {
    if (hasChanged && changes.length) {
      // Update after a 'save' a.k.a store changes. We have to reconciliate our editor content
      // and blob content because the second has been updated on the localStorage.
      retriveBlob();
      // setHasChanged(false);
    }
    // Case when changes were wipped after a commit.
    setHasChanged(false);

    return () => {
      // If changes will change, the view is 'saving' some content. HasChanged has to be true.
      setHasChanged(true);
    };
  }, [changes]);

  function storeEdit() {
    const { sha, path } = Object.fromEntries(
      new URLSearchParams(location.search).entries()
    );
    dispatch({
      action: "ADD_CHANGE",
      payload: {
        // content: btoa(renderBlocks(editorContent, blocks).replace(/\n/g, "\n")),
        content: btoa(renderBlocks(editorContent, marked).replace(/\n/g, "\n")),
        frontmatter: blob.frontmatter,
        sha,
        path,
      },
    });
  }

  async function retriveBlob() {
    let blob = changes.find((d) => d.sha === query.sha);
    if (!blob) {
      blob = await getBlob(query);
    } else {
      blob = JSON.parse(JSON.stringify(blob));
      blob.content = atob(blob.content);
    }

    blob.content = hydrateBlocks(blob.content);
    setBlob(blob);
    if (getEditMode(query.path) === "editor") {
      setEditorContent(blob.content || "");
    }
  }

  function toTheClippBoard() {
    navigator.clipboard.writeText("/" + blob.path.replace(/\.md$/, ".html"));
  }

  return (
    <>
      <div
        className={[
          "edit__content",
          getEditMode(query.path),
          preview ? " preview" : "edit",
        ].join(" ")}
      >
        {!preview ? (
          getEditMode(query.path) === "editor" ? (
            <Editor
              onUpdate={setEditorContent}
              content={editorContent}
              defaultContent={defaultContent}
            />
          ) : getEditMode(query.path) === "data" ? (
            <YamlForm content={editorContent} />
          ) : (
            <AssetViewer
              content={blob.content}
              encoding={blob.encoding}
              path={blob.path}
            />
          )
        ) : (
          <Preview text={editorContent} />
        )}
      </div>
      <div className="edit__controls">
        <a className="btn" onClick={toTheClippBoard}>
          Get URL
        </a>
        <a className="btn" onClick={() => setPreview(!preview)}>
          {preview ? "Edit" : "Preview"}
        </a>
        <a className={"btn" + (hasChanged ? "" : " disabled")} onClick={storeEdit}>
          Save
        </a>
      </div>
    </>
  );
}

export default EditorPage;
