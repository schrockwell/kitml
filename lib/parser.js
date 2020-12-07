const TOML = require("@iarna/toml");

function parse(doc) {
  const tokens = [];
  const lines = doc.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("[")) {
      i = parseToml(lines, i, tokens);
    } else if (line.startsWith("-[]")) {
      i = parseChecklist(lines, i, tokens);
    } else if (line.startsWith("-")) {
      i = parseUnorderedList(lines, i, tokens);
    } else {
      i = parseParagraph(lines, i, tokens);
    }
  }

  return tokens;
}

function parseToml(lines, i, tokens) {
  let tomlLines = [];

  for (; lines[i] !== ""; i++) {
    tomlLines.push(lines[i]);
  }

  tokens.push(TOML.parse(tomlLines.join("\n")));
  return i;
}

function parseChecklist(lines, i, tokens) {
  let items = [];

  for (; lines[i] !== ""; i++) {
    items.push(lines[i].substring(3).trim());
  }

  tokens.push({ checklist: { items } });
  return i;
}

function parseUnorderedList(lines, i, tokens) {
  let items = [];

  for (; lines[i] !== ""; i++) {
    items.push(lines[i].substring(1));
  }

  tokens.push({ list: { items } });
  return i;
}

function parseParagraph(lines, i, tokens) {
  let contentLines = [];

  for (; lines[i] !== ""; i++) {
    contentLines.push(lines[i]);
  }

  const text = contentLines.join("\n").trim();

  if (text.length > 0) {
    tokens.push({ paragraph: { text } });
  }

  return i;
}

function isNested(prevNode, thisNode) {
  const prevIsContent = isContent(prevNode);
  const thisIsContent = isContent(thisNode);

  if (prevIsContent && thisIsContent) {
    return false;
  } else if (!prevIsContent && thisIsContent) {
    return true;
  } else if (prevNode.doc) {
    return true;
  } else if (thisNode.preface) {
    return false;
  } else if (thisNode.part) {
    return false;
  } else if (thisNode.section) {
    return isNodeType(prevNode, "part");
  } else if (thisNode.subsection) {
    return isNodeType(prevNode, "part", "section");
  } else if (thisNode.step) {
    return isNodeType(prevNode, "part", "section", "subsection");
  } else {
    return false;
  }
}

function isContent(node) {
  return isNodeType(node, "paragraph", "list", "checklist", "note", "figure");
}

function isNodeType(node, ...types) {
  return !!types.find((type) => {
    if (Object.keys(node).indexOf(type) !== -1) {
      return true;
    }
  });
}

function nest(tokens) {
  const root = { doc: {} };

  doNest([root], root, tokens);

  return root;
}

function doNest(path, prevNode, nextNodes) {
  if (nextNodes.length === 0) {
    return;
  }

  const parentNode = path[path.length - 1];
  const thisNode = nextNodes[0];

  if (isNested(prevNode, thisNode)) {
    // N+1 level
    path.push(prevNode);
    prevNode.contents = prevNode.contents || [];
    prevNode.contents.push(thisNode);
    doNest(path, thisNode, nextNodes.slice(1));
  } else if (isNested(parentNode, thisNode)) {
    // Same level
    parentNode.contents = parentNode.contents || [];
    parentNode.contents.push(thisNode);
    doNest(path, thisNode, nextNodes.slice(1));
  } else {
    // N-1 level
    path.pop();
    doNest(path, prevNode, nextNodes);
  }
}

module.exports = { parse, nest };
