const config = require("./config.js");

function consumeBusySignal(busySignal) {
  if (this.busySignal) {
    this.busySignal.clear();
  }
  this.busySignal = busySignal;
}

function updateBusySignal(signal) {
  if (this.busySignal) {
    this.busySignal.clear();
    if (signal) {
      this.busySignal.add(signal);
    }
  }
}

function createStatusBarElement() {
  const element = document.createElement("div");
  element.classList.add("formatters-python-status-bar-tile");
  element.appendChild(document.createTextNode("Formatter"));
  element.addEventListener("click", () => {
    config.toggle("onSave.enabled");
  });
  return element;
}

function consumeStatusBar(statusBar) {
  if (this.statusBarTooltip) {
    this.statusBarTooltip.dispose();
    this.statusBarTooltip = null;
  }
  if (this.statusBarTile) {
    this.statusBarTile.destroy();
    this.statusBarTile = null;
  }

  if (!this.statusBarElement) {
    this.statusBarElement = createStatusBarElement();
  }
  if (statusBar) {
    this.statusBarTile = statusBar.addLeftTile({
      item: this.statusBarElement,
      priority: 1001,
    });
  }
}

function updateStatusBar(status) {
  if (this.statusBarTooltip) {
    this.statusBarTooltip.dispose();
    this.statusBarTooltip = null;
  }

  if (status.showTile) {
    this.statusBarElement.classList.add("inline-block");
  } else {
    this.statusBarElement.classList.remove("inline-block");
  }
  if (status.showTick) {
    this.statusBarElement.classList.add("text-success");
  } else {
    this.statusBarElement.classList.remove("text-success");
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
  this.statusBarTooltip = atom.tooltips.add(this.statusBarElement, {
    title,
  });
}

module.exports = {
  consumeBusySignal,
  consumeStatusBar,
  updateBusySignal,
  updateStatusBar,
};
