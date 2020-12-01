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
      return "--quiet --fast";
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
    title: "Formatters for format command",
    type: "array",
    default: [],
    description: "Comma separated, in order",
    order: 1,
    items: { type: "string" },
  },
  busySignal: {
    title: "Show formatting status in busy signal",
    type: "boolean",
    default: true,
    order: 2,
  },
  statusBar: {
    title: "Show formatter info & format on save toggle in status bar",
    type: "boolean",
    default: true,
    order: 3,
  },
  onSave: {
    title: "Format on save",
    type: "object",
    order: 4,
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
    title: "Errors",
    type: "string",
    default: "show",
    order: formatters.length + 5,
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
    title: `${formatter} options`,
    type: "object",
    order: i + 5,
    properties: {
      binPath: {
        title: "Binary path",
        type: "string",
        default: "",
        description: `Run *pip install ${formatter}* & then *which ${formatter}*`,
        order: 1,
      },
      cmdArgs: {
        title: "Command line arguments",
        type: "array",
        default: [],
        description: "Command line arguments, which will always be passed",
        order: 2,
      },
      localConfigs: {
        title: "Local config files",
        type: "array",
        default: [],
        description:
          "Config files to look for in parent directories, which will be explicitly passed if present (Comma separated, in order)",
        order: 3,
        items: { type: "string" },
      },
      globalConfig: {
        title: "Global config file",
        type: "string",
        default: "",
        description:
          "Global config file, which will be explicitly passed if none of the local config files are present",
        order: 4,
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

function toggle(key) {
  return set(key, !get(key));
}

function observe(key, callback) {
  return atom.config.observe(`formatters-python.${key}`, callback);
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
