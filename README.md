## Python Formatters for Atom Editor

[![apm](https://img.shields.io/apm/v/formatters-python.svg?style=flat-square)](https://atom.io/packages/formatters-python)
[![apm](https://img.shields.io/apm/dm/formatters-python.svg?style=flat-square)](https://atom.io/packages/formatters-python)
[![apm](https://img.shields.io/apm/l/formatters-python.svg?style=flat-square)](https://github.com/utkarshgupta137/atom-formatters-python/blob/master/LICENSE)

[![badge](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![badge](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)

Supports [autopep8](https://github.com/hhatto/autopep8), [black](https://github.com/psf/black), [isort](https://github.com/PyCQA/isort), [yapf](https://github.com/google/yapf) for formatting Python code.

### Features

- Format-in-buffer/Format-on-save using any of these 4 formatters, in any combination provided in settings
- Can look for formatters & config files relative to the file path
- Can specify command line arguments or specify local or global config files to look for
- Quick toggle for format-on-save along with format order info in status bar
- Show busy signal while formatting (if installed)

### Usage

- Make sure you have installed the required formatters.

  Eg. If you want to use isort & black, run `pip install isort black`.

- After installing in system/pyenv/venv/conda, run `which <formatter>` & add the binary path to package settings.

  Eg. Running `which black` gives `/usr/local/bin/black`. Then add this path in the "black" section.

- Formatter path can also be specified related to the file path.

  Eg. If the path of the formatter relative to the repo folder is `.venv/bin/black` & file is inside the folder containing .venv or any of it's subfolders, then add this path in the "local formatter" section of the "black" section

- Define format order for :format command and/or save order for auto-format on save, if required.

If the path for any formatter is not provided, it will not be used.

### Configuration

Any of the formatters can be configured in 3 ways:

- You can provide command line arguments which are always passed.
- You can provide a list of local config file names which will be explicitly passed to the formatter. Files will be looked for in parent directories in the repo (i.e. until a ".git" folder is found). If any of the paths is an absolute path, then it will be used directly
- Don't specify any of them & let the formatter auto determine the config settings to use.

All of these options can be individually adjusted for local (relative to file path) or global cases. The config in global options section of a formatter will be used if none of the local formatters is found.

Please note that command line arguments may or may not override the config files, explicitly passed or otherwise. Please consult formatter documentation for the exact behaviour.

### Commands

- `formatters-python:autopep8`
- `formatters-python:black`
- `formatters-python:isort`
- `formatters-python:yapf`
- `formatters-python:format`
- `formatters-python:toggle-format-on-save`

### Thanks

Influenced by [atom-python-black](https://github.com/mikehoyio/atom-python-black), [prettier-atom](https://github.com/prettier/prettier-atom).
