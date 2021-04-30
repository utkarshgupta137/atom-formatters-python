const fs = require("fs");
const path = require("path");

const { BufferedProcess } = require("atom");
const findUp = require("find-up");

function isPathAbsolute(filePath) {
  return (
    path.normalize(`${filePath}/`) ===
    path.normalize(`${path.resolve(filePath)}/`)
  );
}

function isPathF(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function isPathR(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function isPathW(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function isPathX(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function handleError(err, msg) {
  const errorHandling = atom.config.get("formatters-python.errorHandling");
  if (errorHandling !== "hide") {
    atom.notifications.addError(`formatters-python: ${msg}`, {
      detail: err,
      dismissable: errorHandling === "show",
    });
  }
}

const timers = new Map();
function callWithTimeout(timeout, key, func, ...args) {
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      func(...args);
    }, timeout)
  );
}

function getEditorPath(editor) {
  return atom.project.relativize(editor.getPath());
}

function findFileInRepo(dirPath, filePath, executable = false) {
  return findUp.sync(
    (dir) => {
      if (executable) {
        if (isPathX(path.resolve(dir, filePath))) {
          return path.resolve(dir, filePath);
        }
      } else if (isPathR(path.resolve(dir, filePath))) {
        return path.resolve(dir, filePath);
      }
      if (isPathF(path.resolve(dir, ".git"))) {
        return findUp.stop;
      }
      return null;
    },
    { cwd: path.dirname(dirPath) }
  );
}

function spawn(editor, command, args, buffer, next) {
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
        editor.setCursorBufferPosition(curpos);
      }
      next();
    },
  });
  if (buffer) {
    bp.process.stdin.write(editor.getText());
    bp.process.stdin.end();
  }
}

module.exports = {
  isPathAbsolute,
  isPathF,
  isPathR,
  isPathW,
  isPathX,
  callWithTimeout,
  getEditorPath,
  findFileInRepo,
  handleError,
  spawn,
};
