const config = require("./config.js");
const helpers = require("./helpers.js");

let busySignal;
function consumeBusySignal(value) {
  if (busySignal) {
    busySignal.dispose();
  }
  busySignal = value;
}

function addBusySignal(signal) {
  if (busySignal) {
    busySignal.add(signal);
  }
}

function removeBusySignal(signal) {
  if (busySignal) {
    busySignal.remove(signal);
  }
}

const statusBarElement = document.createElement("div");
statusBarElement.appendChild(document.createTextNode("Formatter"));
statusBarElement.classList.add("formatters-python-status-bar-tile");

let status;
function setStatusObject(value) {
  status = value;
}

function getTooltipTitle() {
  let title = "";
  if (!status.editor) {
    return title;
  }

  title += `CLI arguments for ${status.editor.getTitle()}: <br>`;
  status.formatters.forEach((formatter, name) => {
    if (formatter.binPath) {
      title += `${name}: `;
      title += formatter
        .getCmdArgs(status.editor.getPath(), true)
        .slice(0, -1)
        .join(" ");
      title += "<br>";
    }
  });
  title += "<br>";
  status.formatOrder.forEach((name, i) => {
    if (i === 0) {
      title += "Format order: ";
    }
    title += name;
    if (i < status.formatOrder.length - 1) {
      title += " > ";
    } else {
      title += "<br>";
    }
  });
  status.saveOrder.forEach((name, i) => {
    if (i === 0) {
      title += "Format on save order: ";
    }
    title += name;
    if (i < status.saveOrder.length - 1) {
      title += " > ";
    } else {
      title += "<br>";
    }
  });
  title += "Format on save: ";
  title += status.showTick ? "Enabled" : "Disabled";
  title += " (Click to toggle)";
  return title;
}

let statusBarTooltip;
function addTooltipPerm() {
  if (statusBarTooltip) {
    statusBarTooltip.dispose();
  }

  statusBarTooltip = atom.tooltips.add(statusBarElement, {
    title: getTooltipTitle(),
  });
}

function addTooltipTemp() {
  if (statusBarTooltip) {
    statusBarTooltip.dispose();
  }

  statusBarTooltip = atom.tooltips.add(statusBarElement, {
    title: getTooltipTitle(),
    trigger: "manual",
    delay: { show: 0, hide: 3000 },
  });
  helpers.callWithTimeout(3000, "tooltip", addTooltipPerm);
}

statusBarElement.addEventListener("click", () => {
  config.toggle("onSave.enabled");
  addTooltipTemp();
});

let statusBarTile;
function consumeStatusBar(statusBar) {
  if (statusBarTile) {
    statusBarTile.destroy();
    statusBarTile = null;
  }

  if (statusBar) {
    statusBarTile = statusBar.addLeftTile({
      item: statusBarElement,
      priority: 1001,
    });
  }
}

function updateStatusBarElement() {
  if (status.showTile) {
    statusBarElement.classList.add("inline-block");
  } else {
    statusBarElement.classList.remove("inline-block");
  }
  if (status.showTick) {
    statusBarElement.classList.add("text-success");
  } else {
    statusBarElement.classList.remove("text-success");
  }
}

function updateStatusBarTooltip() {
  addTooltipPerm();
}

function dispose() {
  busySignal.dispose();
  statusBarTile.destroy();
  statusBarTooltip.dispose();
}

module.exports = {
  consumeBusySignal,
  addBusySignal,
  removeBusySignal,
  setStatusObject,
  consumeStatusBar,
  updateStatusBarElement,
  updateStatusBarTooltip,
  dispose,
};
