const { CompositeDisposable } = require("atom");

const { Formatter } = require("./formatter.js");
const config = require("./config.js");
const helpers = require("./helpers.js");
const services = require("./services.js");

class Formatters {
  config = config.schema;

  activate() {
    this.status = {
      formatOrder: [],
      saveOrder: [],
      showTick: false,
      showTile: false,
    };
    this.formatters = new Map();
    this.subscriptions = new CompositeDisposable();

    config.formatters.forEach((name) => {
      this.formatters.set(name, new Formatter(name));
    });

    this.subscriptions.add(
      config.observe("formatOrder", (value) => {
        helpers.callWithTimeout.call(
          this,
          "formatOrder",
          this.setFormatOrder,
          value
        );
      }),
      config.observe("onSave.saveOrder", (value) => {
        helpers.callWithTimeout.call(
          this,
          "saveOrder",
          this.setSaveOrder,
          value
        );
      }),
      config.observe("busySignal", (value) => {
        services.consumeBusySignal(value ? this.busySignal : null);
      }),
      config.observe("statusBar", (value) => {
        services.consumeStatusBar(value ? this.statusBar : null);
      }),
      config.observe("onSave.enabled", (value) => {
        this.status.showTick = value;
        services.updateStatusBar(this.status);
      }),
      config.addCommand("toggle-format-on-save", () => {
        config.toggle("onSave.enabled");
      }),
      config.addCommand("format", () => {
        if (this.formatOrder) {
          this.format(atom.workspace.getActiveTextEditor(), this.formatOrder);
        } else {
          helpers.handleError(null, "Format order not defined");
        }
      }),
      atom.workspace.observeTextEditors((editor) => {
        if (config.inScope(editor)) {
          this.subscriptions.add(
            editor.buffer.onDidSave(() => {
              if (config.get("onSave.enabled")) {
                if (this.saveOrder) {
                  this.format(editor, this.saveOrder, { buffer: false });
                } else {
                  helpers.handleError(null, "Format on save order not defined");
                }
              }
            })
          );
        }
      }),
      atom.workspace.observeActiveTextEditor((editor) => {
        this.status.showTile = editor && config.inScope(editor);
        services.updateStatusBar(this.status);
      })
    );
  }

  deactivate() {
    services.consumeBusySignal(null);
    services.consumeStatusBar(null);
    this.formatters.forEach((formatter) => {
      formatter.subscriptions.dispose();
    });
    this.subscriptions.dispose();
  }

  consumeBusySignal(registry) {
    this.busySignal = registry.create();
    this.subscriptions.add(this.busySignal);
    if (config.get("busySignal")) {
      services.consumeBusySignal(this.busySignal);
    }
  }

  consumeStatusBar(provider) {
    this.statusBar = provider;
    if (config.get("statusBar")) {
      services.consumeStatusBar(this.statusBar);
    }
  }

  setFormatOrder = (value) => {
    const formatOrder = value.filter(Boolean);
    if (formatOrder === this.formatOrder) {
      return;
    }
    if (!formatOrder) {
      this.formatOrder = [];
      return;
    }

    if (
      formatOrder.some((name) => {
        if (this.formatters.has(name)) {
          return false;
        }
        helpers.handleError(
          `'${name}' is not a valid formatter name.`,
          `Invalid format order`
        );
        return true;
      })
    ) {
      this.formatOrder = [];
    } else {
      this.formatOrder = formatOrder;
    }
    this.status.formatOrder = this.formatOrder;
    services.updateStatusBar(this.status);
  };

  setSaveOrder = (value) => {
    const saveOrder = value.filter(Boolean);
    if (saveOrder === this.saveOrder) {
      return;
    }
    if (!saveOrder) {
      this.saveOrder = [];
      return;
    }

    if (
      saveOrder.some((name) => {
        if (this.formatters.has(name)) {
          return false;
        }
        helpers.handleError(
          `'${name}' is not a valid formatter name.`,
          `Invalid format on save order`
        );
        return true;
      })
    ) {
      this.saveOrder = [];
    } else {
      this.saveOrder = saveOrder;
    }
    this.status.saveOrder = this.saveOrder;
    services.updateStatusBar(this.status);
  };

  format(editor, formatters, { buffer = true } = {}) {
    if (formatters.length > 0) {
      this.formatters.get(formatters[0]).format(editor, buffer, () => {
        this.format(editor, formatters.slice(1), { buffer });
      });
    }
  }
}

module.exports = new Formatters();
