const helpers = require("./helpers.js");

const formatters = ["autopep8", "black", "isort", "yapf"];

function getDefaultArgs(name, buffer) {
  switch (name) {
    case "autopep8":
    case "yapf":
      if (!buffer) {
        return "--in-place";
      }
      return "";
    case "black":
    case "isort":
      return "--quiet";
    default:
      return "";
  }
}

function getConfigArgs(name) {
  switch (name) {
    case "autopep8":
      return "--ignore-local-config --global-config";
    case "black":
      return "--config";
    case "isort":
      return "--settings-path";
    case "yapf":
      return "--no-local-style --style";
    default:
      return "";
  }
}

const schema = {
  formatOrder: {
    order: 1,
    type: "array",
    items: { type: "string" },
    default: [],
    title: "Formatters for format command",
    description: "Comma separated, in order",
  },
  busySignal: {
    order: 2,
    type: "boolean",
    default: true,
    title: "Show formatting status in busy signal",
  },
  statusBar: {
    order: 3,
    type: "boolean",
    default: true,
    title: "Show formatter info & format on save toggle in status bar",
  },
  onSave: {
    order: 4,
    type: "object",
    title: "Format on save",
    properties: {
      enabled: {
        title: "Format files on save",
        type: "boolean",
        default: false,
        order: 1,
      },
      saveOrder: {
        title: "Formatters to run on save",
        type: "array",
        default: [],
        description: "Comma separated, in order",
        order: 2,
        items: { type: "string" },
      },
    },
  },
  errorHandling: {
    order: formatters.length + 5,
    type: "string",
    default: "show",
    title: "Errors",
    enum: [
      {
        value: "show",
        description: "Show until dismissed",
      },
      {
        value: "flash",
        description: "Dismiss after 5 seconds",
      },
      {
        value: "hide",
        description: "Don't show",
      },
    ],
  },
};

formatters.forEach((formatter, i) => {
  schema[formatter] = {
    order: i + 5,
    type: "object",
    title: `${formatter} options`,
    properties: {
      local: {
        order: 1,
        type: "object",
        title: "Local formatters (relative to file)",
        properties: {
          bins: {
            order: 1,
            type: "array",
            items: { type: "string" },
            default: [],
            title: "Binary paths",
            description:
              "Binaries to look for in parent directories (Comma separated, in order). Eg: for `~/example/repo/.venv/bin/python`, where the repo folder contains the file to be formatted, use `.venv/bin/python` ",
          },
          cmdArgs: {
            order: 2,
            type: "array",
            items: { type: "string" },
            default: [],
            title: "Command line arguments",
            description: "Command line arguments, which will always be passed",
          },
          configs: {
            order: 3,
            type: "array",
            items: { type: "string" },
            default: [],
            title: "Config files",
            description:
              "Config files to look for in parent directories or global paths (Comma separated, in order)",
          },
        },
      },
      global: {
        order: 2,
        type: "object",
        title: "Global formatter (if none of the local formatters are found)",
        properties: {
          binPath: {
            order: 1,
            type: "string",
            default: "",
            title: "Binary path",
            description: `Run \`pip install ${formatter}\` & then \`which ${formatter}\``,
          },
          cmdArgs: {
            order: 2,
            type: "array",
            items: { type: "string" },
            default: [],
            title: "Command line arguments",
            description: "Command line arguments, which will always be passed",
          },
          configs: {
            order: 3,
            type: "array",
            items: { type: "string" },
            default: [],
            title: "Config files",
            description:
              "Config files to look for in parent directories or global paths (Comma separated, in order)",
          },
        },
      },
    },
  };
});

function get(key) {
  return atom.config.get(`formatters-python.${key}`);
}

function set(key, value) {
  return atom.config.set(`formatters-python.${key}`, value);
}

formatters.forEach((name) => {
  const binPath = get(`${name}.binPath`);
  if (binPath) {
    const cmdArgs = get(`${name}.cmdArgs`);
    const configs = get(`${name}.localConfigs`) || [];
    const globalConfig = get(`${name}.globalConfig`);
    if (globalConfig) {
      configs.push(globalConfig);
    }

    atom.config.unset(`formatters-python.${name}`);
    set(`${name}.global.binPath`, binPath);
    if (cmdArgs) {
      set(`${name}.global.cmdArgs`, cmdArgs);
    }
    if (configs.length > 0) {
      set(`${name}.global.configs`, configs);
    }
  }
});

function toggle(key) {
  return set(key, !get(key));
}

function observe(key, callback, timeout = 1000) {
  return atom.config.observe(`formatters-python.${key}`, (value) => {
    helpers.callWithTimeout.call(this, timeout, key, callback, value);
  });
}

function inScope(editor) {
  return editor.getGrammar().scopeName === "source.python";
}

function addCommand(key, callback) {
  return atom.commands.add(
    "atom-text-editor[data-grammar='source python']",
    `formatters-python:${key}`,
    callback
  );
}

module.exports = {
  formatters,
  getDefaultArgs,
  getConfigArgs,
  schema,
  get,
  set,
  toggle,
  observe,
  inScope,
  addCommand,
};
