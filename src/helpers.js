const findUp = require("find-up");
const fs = require("fs");
const path = require("path");

const { BufferedProcess } = require("atom");

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

function findFileInRepo(dirPath, fileName) {
  return findUp.sync(
    (dir) => {
      if (fs.existsSync(path.resolve(dir, fileName), fs.R_OK)) {
        return path.resolve(dir, fileName);
      }
      if (fs.existsSync(path.resolve(dir, ".git"), fs.F_OK)) {
        return findUp.stop;
      }
      return null;
    },
    { cwd: path.dirname(dirPath) }
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
  callWithTimeout,
  getEditorPath,
  findFileInRepo,
  handleError,
  spawn,
};
