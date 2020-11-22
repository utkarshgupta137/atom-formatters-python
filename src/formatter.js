const _ = require("lodash");
const fs = require("fs");
const untildify = require("untildify");
const validFilename = require("valid-filename");

const { CompositeDisposable } = require("atom");

const config = require("./config.js");
const helpers = require("./helpers.js");
const services = require("./services.js");

class Formatter {
  constructor(name) {
    this.name = name;
    this.localConfigPathCache = new Map();
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      config.observe(`${name}.binPath`, (value) => {
        helpers.callWithTimeout.call(
          this,
          `${name}:binPath`,
          this.setBinPath,
          value
        );
      }),
      config.observe(`${name}.cmdArgs`, (value) => {
        helpers.callWithTimeout.call(
          this,
          `${name}:cmdArgs`,
          this.setCmdArgs,
          value
        );
      }),
      config.observe(`${name}.localConfigs`, (value) => {
        helpers.callWithTimeout.call(
          this,
          `${name}:localConfigs`,
          this.setLocalConfigs,
          value
        );
      }),
      config.observe(`${name}.globalConfig`, (value) => {
        helpers.callWithTimeout.call(
          this,
          `${name}:globalConfig`,
          this.setGlobalConfig,
          value
        );
      }),
      config.addCommand(name, () => {
        this.format(atom.workspace.getActiveTextEditor());
      })
    );
  }

  setBinPath = (value) => {
    const binPath = untildify(value.trim());
    if (binPath === this.binPath) {
      return;
    }
    if (!binPath) {
      this.binPath = "";
      return;
    }

    if (fs.existsSync(binPath, fs.X_OK)) {
      this.binPath = binPath;
    } else {
      helpers.handleError(
        `'${binPath}' not found or not executable.`,
        `Invalid binary path for ${this.name}`
      );
      this.binPath = "";
    }
  };

  setCmdArgs = (value) => {
    this.cmdArgs = value;
  };

  setLocalConfigs = (value) => {
    const localConfigs = _.compact(value);
    if (_.isEqual(localConfigs, this.localConfigs)) {
      return;
    }
    this.localConfigPathCache.clear();
    if (_.isEmpty(localConfigs)) {
      this.localConfigs = [];
      return;
    }

    if (
      localConfigs.some((name) => {
        if (validFilename(name)) {
          return false;
        }
        helpers.handleError(
          `'${name}' is not a valid file name.`,
          `Invalid local configs for ${this.name}`
        );
        return true;
      })
    ) {
      this.localConfigs = [];
    } else {
      this.localConfigs = localConfigs;
    }
  };

  setGlobalConfig = (value) => {
    const globalConfig = untildify(value.trim());
    if (globalConfig === this.globalConfig) {
      return;
    }
    if (!globalConfig) {
      this.globalConfig = "";
      return;
    }

    if (fs.existsSync(globalConfig, fs.R_OK)) {
      this.globalConfig = globalConfig;
    } else {
      helpers.handleError(
        `'${globalConfig}' not found or not readable.`,
        `Invalid global config path for ${this.name}`
      );
      this.globalConfig = "";
    }
  };

  getLocalConfigPath(filePath) {
    if (_.isEmpty(this.localConfigs)) {
      return "";
    }
    if (this.localConfigPathCache.has(filePath)) {
      return this.localConfigPathCache.get(filePath);
    }

    let configPath;
    this.localConfigs.some((configFileName) => {
      configPath = helpers.findProjectFile(filePath, configFileName);
      if (configPath) {
        return true;
      }
      return false;
    });
    this.localConfigPathCache.set(filePath, configPath);
    return configPath;
  }

  getCmdArgs(filePath, buffer) {
    const args = [...this.cmdArgs];
    args.push(config.getDefaultArgs(this.name, buffer));

    const configPath = this.getLocalConfigPath(filePath) || this.globalConfig;
    if (configPath) {
      args.push(config.getConfigArgs(this.name), configPath);
    }

    if (buffer) {
      args.push("-");
    } else {
      args.push(filePath);
    }
    return args;
  }

  format(editor, buffer = true, next = () => {}) {
    if (this.binPath) {
      services.updateBusySignal(`${this.name} on ${editor.getTitle()}`);
      helpers.spawn(
        editor,
        this.binPath,
        this.getCmdArgs(editor.getPath(), buffer),
        buffer,
        next
      );
    } else {
      helpers.handleError(null, `Invalid binary path for ${this.name}`);
      next();
    }
  }
}

module.exports = { Formatter };
