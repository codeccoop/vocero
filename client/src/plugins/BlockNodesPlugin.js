/* VENDOR */
import { useEffect, useRef, useState } from "react";
import {
  createCommand,
  COMMAND_PRIORITY_EDITOR,
  $getSelection,
  $getRoot,
  $isTextNode,
  $isRootNode,
  $getNodeByKey,
} from "lexical";
import { mergeRegister } from "@lexical/utils";

/* SOURCE */
import BlockNode, { $createBlockNode, $isBlockNode } from "nodes/BlockNode.js";
import { useEditorFocus } from "context/EditorFocus.js";

export const INSERT_BLOCK_NODE = createCommand();

function isFamily(hierarchy, ancestors) {
  return (
    hierarchy.filter((nodeKey) =>
      ancestors.find((ancestor) => ancestor === nodeKey)
    ).length == ancestors.length
  );
}

let _focusDebounce;

function BlockNodesPlugin({ editor, parentEditor, hierarchy = [] }) {
  const nodeKey = hierarchy[hierarchy.length - 1];

  const exitDecorators = useRef({});
  const [decorators, setDecorators] = useState();
  const [, setFocus] = useEditorFocus();

  useEffect(() => {
    if (!decorators) return;

    Object.keys(decorators)
      .filter((k) => !exitDecorators.current[k])
      .forEach((k, i, decorators) => {
        editor.getEditorState().read(() => {
          const node = $getNodeByKey(k);
          // TODO: Initial focus
        });
      });
    return () => (exitDecorators.current = decorators);
  }, [decorators]);

  function insertBlock(defn, ancestors) {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const blockNode = $createBlockNode({ defn, ancestors });
        let anchor = selection.anchor.getNode();

        if ($isTextNode(anchor)) {
          anchor = anchor.getParent();
        }

        if ($isRootNode(anchor)) {
          anchor.append(blockNode);
        } else if (anchor.isEmpty()) {
          anchor.replace(blockNode);
        } else {
          const parent = anchor.getParent();
          parent.append(blockNode);
        }
      } else {
        const root = $getRoot();
        root.getChildren().forEach((node) => {
          if ($isBlockNode(node)) {
            node.editor.dispatchCommand(INSERT_BLOCK_NODE, {
              defn,
              ancestors: node.ancestors.concat(node.getKey()),
            });
          }
        });
      }
    });
  }

  function handleOnFocus() {
    if (!parentEditor) return;
    clearTimeout(_focusDebounce);
    _focusDebounce = setTimeout(() => {
      parentEditor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        if (node.defn.selfClosed) return;
        setFocus(node);
      });
    }, 100);
  }

  useEffect(() => {
    if (!editor) return;

    if (!editor.hasNodes([BlockNode])) {
      throw new Error(
        "VoceroBlocks: BlockNode is not registered on editor (initialConfig.nodes)"
      );
    }

    return mergeRegister(
      editor.registerRootListener((el, prev) => {
        if (prev) prev.removeEventListener("focus", handleOnFocus);
        if (el) el.addEventListener("focus", handleOnFocus);
      }),
      editor.registerDecoratorListener((decorators) =>
        setDecorators(decorators)
      ),
      editor.registerCommand(
        INSERT_BLOCK_NODE,
        ({ defn, ancestors = [] }) => {
          if (isFamily(hierarchy, ancestors)) {
            insertBlock(defn, []);
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}

export default BlockNodesPlugin;
