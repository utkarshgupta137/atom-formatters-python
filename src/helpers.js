const findUp = require("find-up");
const fs = require("fs");
const path = require("path");

const { BufferedProcess } = require("atom");

const config = require("./config.js");
const services = require("./services.js");

function handleError(err, msg) {
  const errorHandling = config.get("errorHandling");
  if (errorHandling !== "hide") {
    atom.notifications.addError(`formatters-python: ${msg}`, {
      detail: err,
      dismissable: errorHandling === "show",
    });
  }
}

const timers = new Map();
function callWithTimeout(key, func, ...args) {
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      func(...args);
    }, 1000)
  );
}

function findProjectFile(filePath, configName) {
  return findUp.sync(
    (dir) => {
      if (fs.existsSync(path.join(dir, configName), fs.R_OK)) {
        return path.join(dir, configName);
      }
      if (fs.existsSync(path.join(dir, ".git"), fs.F_OK)) {
        return findUp.stop;
      }
      return null;
    },
    { cwd: path.dirname(filePath) }
  );
}

function spawn(editor, command, args, buffer, next) {
  console.log(command, args);

  let text = "";
  const curpos = editor.getCursorBufferPosition();
  const bp = new BufferedProcess({
    command,
    args,
    options: { shell: true },
    stdout: (out) => {
      text += out;
    },
    stderr: (err) => {
      handleError(err, [command, args]);
    },
    exit: () => {
      if (buffer) {
        editor.setText(text);
      }
      editor.setCursorBufferPosition(curpos);
      services.updateBusySignal();
      next();
    },
  });
  if (buffer) {
    bp.process.stdin.write(editor.getText());
    bp.process.stdin.end();
  }
}

module.exports = { callWithTimeout, findProjectFile, handleError, spawn };
