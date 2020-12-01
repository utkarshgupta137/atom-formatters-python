const config = require("./config.js");

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
statusBarElement.addEventListener("click", () => {
  config.toggle("onSave.enabled");
});

let statusBarTile;
let statusBarTooltip;

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

function updateStatusBar(status) {
  if (statusBarTooltip) {
    statusBarTooltip.dispose();
    statusBarTooltip = null;
  }

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

  let title = "";
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
  statusBarTooltip = atom.tooltips.add(statusBarElement, {
    title,
  });
}

module.exports = {
  consumeBusySignal,
  addBusySignal,
  removeBusySignal,
  consumeStatusBar,
  updateStatusBar,
};
