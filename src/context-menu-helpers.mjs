let Nodes
let initialized = false;
export async function initialize(version) {
  if (initialized)
    return;
  Nodes = await import(`./nodes.mjs?v=${version()}`).then(
    async m => { await m.initialize(version); return m });
  initialized = true;
}

class Menus {
  editLabel(callback) {
    return {
      text: "Edit label",
      shortcut: "e",
      callback: callback
    };
  }

  editUrl(callback) {
    return {
      text: "Edit URL",
      shortcut: "",
      callback: callback
    };
  }

  convertTo(from, callback) {
    const result = {
      text: "Convert to",
      submenu: [],
      callback: callback
    };
    const choices = Nodes.similarTypes(from);
    for (let i = 0; i < choices.length; ++i) {
      result.submenu.push({
        text: Nodes.prettyName(choices[i]),
        choice: choices[i]
      });
    }
    return result;
  }

  selfStyle(callback) {
    return {
      text: "Self style",
      submenu: [
        { text: "Edit", choice: "edit" },
        { text: "Copy", choice: "copy" },
        { text: "Paste", choice: "paste" }
      ],
      callback: callback
    }
  }
};

export const menus = new Menus;

function selectionHandler(menus, item, position) {
  const choice = item.getAttribute("choice");
  let result = choice.match(/choice([0-9]*)_(.*)/);
  console.assert(result[0] == choice);
  console.assert(result.length == 3);

  menus[result[1]].callback(result[2], position);
}

function createItem(index, menu) {
  // TODO(vmpstr): Generalize or refactor?
  //
  const result = document.createElement("mm-context-menu-item");
  const text = document.createElement("div");
  text.setAttribute("slot", "text");
  text.innerText = menu.text;
  result.appendChild(text);
  if (!menu.submenu || !menu.submenu.length) {
    if ("shortcut" in menu) {
      const shortcut = document.createElement("div");
      shortcut.setAttribute("slot", "shortcut");
      shortcut.innerText = menu.shortcut;
      result.appendChild(shortcut);
    }
    result.setAttribute("choice", `choice${index}_`);
  } else {
    const shortcut = document.createElement("div");
    shortcut.setAttribute("slot", "shortcut");
    shortcut.innerHTML = "&#x27a4;";
    result.appendChild(shortcut);

    const submenu = document.createElement("mm-context-menu");
    submenu.setAttribute("slot", "submenu");
    for (let i = 0; i < menu.submenu.length; ++i) {
      const item = document.createElement("mm-context-menu-item");
      item.setAttribute("choice", `choice${index}_${menu.submenu[i].choice}`);
      const text = document.createElement("div");
      text.setAttribute("slot", "text");
      text.innerText = menu.submenu[i].text;
      item.appendChild(text);
      if ("shortcut" in menu.submenu[i]) {
        const sub_shortcut = document.createElement("div");
        sub_shortcut.setAttribute("slot", "shortcut");
        sub_shortcut.innerText = menu.submenu[i].shortcut;
        item.appendChild(sub_shortcut);
      }
      submenu.appendChild(item);
    }
    result.appendChild(submenu);
  }
  return result;
}

export function createMenu(menus) {
  const menu = document.createElement("mm-context-menu");
  menu.handler = (item, position) => selectionHandler(menus, item, position);
  for (let i = 0; i < menus.length; ++i)
    menu.appendChild(createItem(i, menus[i]));
  return menu;
}
