# Time Block Planner

This is an ideological successor to [obsidian-day-planner](https://github.com/lynchjames/obsidian-day-planner), which
got abandoned by the author.

## Contributing

🪲 [Create issues](https://github.com/ivan-lednev/obsidian-day-planner/issues)

🪛 Pull-requests are welcome! If you don't know where to start, feel free to create an issue, and I'll provide some
guidance. Also, please check out [CONTRIBUTING](./CONTRIBUTING.md).

You can also support the development of this plugin directly:

<a href="https://www.buymeacoffee.com/machineelf" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## About Obsidian Day Planner

The author of Obsidian Day Planner disappeared a while ago, leaving one of the most popular plugins in a mess. I
initially forked it, but ended up rewriting almost all of it.

### What's the difference?

- The UI has been rewritten
- There is only one mode now: daily notes
- I've removed Mermaid-related functionality to make the scope of the plugin more focused
- You can specify an end time for a task
- The plugin 'understands' timestamps in almost any format:

## Features

TODO

### Write a plan using a simple human-readable format and see it rendered in a side panel

### The progress bar is also in place

## Usage

1. **Either the core 'Daily Notes' or the 'Periodic Notes' plugins should be enabled**
1. Install the plugin
1. Configure the heading you want the plugin to look at (see 'Planner heading')
1. Write a plan under the heading in your daily note

## Configuration

### Status Bar - Circular Progress

Show a progress pie instead of a bar.

### Status Bar - Now and Next

You can choose to display the time and start of the text for the current and next task.

### Task Notification

You can choose to have an in-app notification display when a new task starts.

### Timeline Zoom Level

This is the zoom level to display the timeline. The higher the number, the more vertical space each task will take up.

## Commands

### Show the Day Planner Timeline

This reveals the timeline for today.

### Open today's Day Planner

This opens your daily note.

### Insert Planner Heading at Cursor

Insert the planner heading you've configured in the plugin settings.

## Acknowledgements

- Thanks to [James Lynch](https://github.com/lynchjames) for the original plugin
- Thanks to [replete](https://github.com/replete), whose fork I initially forked
