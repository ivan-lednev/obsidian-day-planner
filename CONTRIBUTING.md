# Contributing

This document describes how to make a code contribution to the repo.

## Before development

1. When contributing, please first discuss the change via an [issue](https://github.com/ivan-lednev/obsidian-day-planner/issues).
2. Read the [ARCHITECTURE.md](./ARCHITECTURE.md). It contains an overview of the code, as well as some useful guidelines.

## How to set up a development environment

1. Fork the repo: https://github.com/ivan-lednev/obsidian-day-planner
1. Create a test vault and go to the plugins directory: `cd <your-vault>/.obsidian/plugins`
1. Clone your fork: `git clone https://github.com/ivan-lednev/obsidian-day-planner`
1. Move to the folder: `cd obsidian-day-planner`
1. Install dependencies: `npm install`
1. Watch the changes: `npm run dev`
1. Now when you change anything, reload Obsidian to see the updates
   - You can use https://github.com/pjeby/hot-reload to make this process faster
1. We don't want the repo to turn into a mess, so...
   1. Before committing, format your code with `npm run format`. If you don't, the PR pipeline is going to mark the PR as failed once the maintainer triggers the PR workflow
   1. Once you're ready to commit, make sure your commit message conforms to the [conventional commits spec](https://www.conventionalcommits.org/en/v1.0.0/) (pre-commit hook is going to fail otherwise)

## Submitting a pull-request

1. Avoid noisy changes like formatting or refactoring that's unrelated to your change. It makes review harder
1. Where appropriate, update the README.md with details of changes to the plugin, this includes additions and changes to configuration settings, plugin commands, useful file locations and additional installation instructions.
1. If you can, please include tests in your Pull Request, particularly if you are making significant changes or additions to the behavior of the plugin.
1. The repository maintainer will be responsible for increasing the version numbers in files and the README.md to the new version that this Pull Request would represent once it has been completed and merged.
