import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { useQueryParams } from "../../store/queryParams";
import { useBranch } from "../../store/branch";
import { getTree } from "../../services/api";

import "./style.scss";

function renderItemContent({ item, selected }) {
  if (item.is_file) {
    return (
      <Link
        id={item.sha}
        to={
          "/edit?sha=" +
          encodeURIComponent(item.sha) +
          "&path=" +
          encodeURIComponent(btoa(item.path))
        }
      >
        {item.name}
      </Link>
    );
  } else {
    return (
      <>
        <span id={item.sha}>{item.name}</span>
        {renderList({ items: item.children, selected })}
      </>
    );
  }
}

function renderItem({ item, selected }) {
  const className =
    "item" +
    (item.sha === selected ? " open" : "") +
    (item.is_file ? " file" : " directory");

  return (
    <li key={item.sha} className={className}>
      {renderItemContent({ item, selected })}
    </li>
  );
}

function renderList({ items, selected }) {
  return <ul>{items.map(item => renderItem({ item, selected }))}</ul>;
}

function Directory() {
  const [tree, setTree] = useState({
    isBoilerplate: true,
    children: [
      { name: "index.md", children: [], sha: 1 },
      { name: "posts", children: [], sha: 2 },
      { name: "drafts", children: [], sha: 3 },
    ],
  });
  const [branch, setBranch] = useBranch();
  const [queryParams, setQueryParams] = useQueryParams();

  useEffect(() => {
    if (branch.sha) getTree(branch["sha"]).then(setTree);
  }, [branch.ahead_by]);

  return (
    <nav className={"directory" + (tree.isBoilerplate ? " loading" : "")}>
      <h3 className="title">Directory Tree</h3>
      {renderList({
        items: tree.children,
        selected: queryParams.sha,
      })}
    </nav>
  );
}

export default Directory;