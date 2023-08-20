# Contributing

When contributing to this repository, please first discuss the change you wish to make via
an [issue](https://github.com/ivan-lednev/obsidian-day-planner/issues).

## Development Process

1. Fork the repo: https://github.com/ivan-lednev/obsidian-day-planner
1. Create a test vault and go to the plugins directory: `cd <your-vault>/.obsidian/plugins`
1. Clone your fork with submodules. For my fork the command looks like this: `git clone --recurse-submodules https://github.com/ivan-lednev/obsidian-day-planner
`
1. Move to the folder: `cd obsidian-day-planner`
1. Install dependencies: `npm install`
1. Watch the changes: `npm run dev`
1. Now when you change anything, reload Obsidian to see the updates
   - You can use https://github.com/pjeby/hot-reload to make this process faster
1. Once you're ready to commit, make sure your commit message conforms to the conventional commits spec (pre-commit hook is going to fail otherwise)

## Pull Request Process

2. Where appropriate, update the README.md with details of changes to the plugin, this includes additions and changes to configuration settings, plugin commands, useful file locations and additional installation instructions.
3. If you can, please include tests in your Pull Request, particularly if you are making significant changes or additions to the behavior of the plugin.
4. The repository maintainer will be responsible for increasing the version numbers in files and the README.md to the new version that this Pull Request would represent once it has been completed and merged.

## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and our community a harassment-free
experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of
experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or electronic address, without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take
appropriate and fair corrective action in response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits,
issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any
contributor for other behaviors that they deem inappropriate,
threatening, offensive, or harmful.

### Attribution

This Code of Conduct is based on and adapted from the [Contributor Covenant][homepage], version 1.4,
available at [http://contributor-covenant.org/version/1/4][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4/
