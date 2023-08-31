- [Time Block Planner](#time-block-planner)
  - [Purpose](#purpose)
  - [Contributing](#contributing)
  - [About Obsidian Day Planner](#about-obsidian-day-planner)
    - [What's the difference?](#whats-the-difference)
  - [Features](#features)
    - [Write a plan using a human-readable format or drag-and-drop and see it rendered in a side panel](#write-a-plan-using-a-human-readable-format-or-drag-and-drop-and-see-it-rendered-in-a-side-panel)
    - [Observe your progress in the status bar](#observe-your-progress-in-the-status-bar)
    - [Navigate to plans from past/future notes](#navigate-to-plans-from-pastfuture-notes)
    - [Use drag-and-drop to create and update tasks](#use-drag-and-drop-to-create-and-update-tasks)
    - [Overlapping tasks push each other](#overlapping-tasks-push-each-other)
  - [Usage](#usage)
  - [Configuration](#configuration)
    - [Status Bar - Circular Progress](#status-bar---circular-progress)
    - [Status Bar - Now and Next](#status-bar---now-and-next)
    - [Task Notification](#task-notification)
    - [Timeline Zoom Level](#timeline-zoom-level)
  - [Commands](#commands)
    - [Show the Day Planner Timeline](#show-the-day-planner-timeline)
    - [Open today's Day Planner](#open-todays-day-planner)
    - [Insert Planner Heading at Cursor](#insert-planner-heading-at-cursor)
  - [Acknowledgements](#acknowledgements)

# Time Block Planner

## Contributing

🪲 [Create issues](https://github.com/ivan-lednev/obsidian-day-planner/issues)

🪛 Pull-requests are welcome! If you don't know where to start, feel free to create an issue, and I'll provide some
guidance. Also, please check out [CONTRIBUTING](./CONTRIBUTING.md).

You can also support the development of this plugin directly:

<a href="https://www.buymeacoffee.com/machineelf" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Features

### Write a plan using a human-readable format or drag-and-drop and see it rendered in a side panel

![image](./assets/main-demo.png)

### Observe your progress in the status bar

![image](https://github.com/ivan-lednev/obsidian-day-planner/assets/41428836/0acf9def-6225-4174-9070-4450ae17fa79)

### Navigate to plans from past/future notes

![](./assets/navigation-demo.png)

### Use the weekly view to plan out the whole week

![2023-08-31_10h16_58](https://github.com/ivan-lednev/obsidian-day-planner/assets/41428836/af402baa-01e7-46fe-9b32-3831e127ee28)

### Use drag-and-drop to create and update tasks

![](assets/dnd-demo.gif)

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
