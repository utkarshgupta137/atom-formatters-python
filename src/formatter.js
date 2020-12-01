const _ = require("lodash");
const fs = require("fs");
const untildify = require("untildify");
const validFilename = require("valid-filename");

const { CompositeDisposable } = require("atom");

const config = require("./config.js");
const helpers = require("./helpers.js");

class Formatter {
  constructor(name) {
    this.name = name;
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      config.observe.call(this, `${name}.binPath`, this.setBinPath),
      config.observe.call(this, `${name}.cmdArgs`, this.setCmdArgs),
      config.observe.call(this, `${name}.localConfigs`, this.setLocalConfigs),
      config.observe.call(this, `${name}.globalConfig`, this.setGlobalConfig),
      config.addCommand(name, () => {
        this.format(atom.workspace.getActiveTextEditor(), true);
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

  getCmdArgs = _.memoize(
    (filePath, buffer) => {
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
    },
    (...args) => _.values(args).join(",")
  );

  setCmdArgs = (value) => {
    this.getCmdArgs.cache.clear();
    this.cmdArgs = value || [];
  };

  getLocalConfigPath = _.memoize(
    (filePath) => {
      let configPath;
      this.localConfigs.some((configFileName) => {
        configPath = helpers.findFileInRepo(filePath, configFileName);
        if (configPath) {
          return true;
        }
        return false;
      });
      return configPath || "";
    },
    (...args) => _.values(args).join(",")
  );

  setLocalConfigs = (value) => {
    const localConfigs = _.compact(value);
    if (_.isEqual(localConfigs, this.localConfigs)) {
      return;
    }

    this.getCmdArgs.cache.clear();
    this.getLocalConfigPath.cache.clear();
    this.localConfigs = localConfigs;
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

    this.getCmdArgs.cache.clear();
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

  format(editor, buffer, next = () => {}) {
    if (this.binPath) {
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
