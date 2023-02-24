# Day Planner

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/replete/obsidian-day-planner?style=for-the-badge)



> ## Forked in 2023
> I like this plugin so I've forked it and merged a few of the [open PRs](https://github.com/lynchjames/obsidian-day-planner/pulls) as the original author has abandoned it. I may or may not make changes to this plugin, but this should be useful.
> ### Added features
> - [Daily Mode](https://github.com/lynchjames/obsidian-day-planner/pull/179)
> - [Break/end CSS classes](https://github.com/lynchjames/obsidian-day-planner/pull/113)
> - [Sort PlanSummaryData items by time](https://github.com/lynchjames/obsidian-day-planner/pull/163)
> - [Fix missing await](https://github.com/lynchjames/obsidian-day-planner/pull/135)
> - [Add Ability to Specify Start and End Times for Task](https://github.com/lynchjames/obsidian-day-planner/pull/130)
>
> I've also written a [custom CSS snippet](https://github.com/replete/obsidian-minimal-theme-css-snippets/blob/main/%5Bplugin%5D%20Day%20Planner%20tweaks.css) to suit the minimal theme for this plugin.
> ### To use this repo in your vault
>
> [Unzip the latest release](https://github.com/replete/obsidian-day-planner/releases/download/v0.60/obsidian-day-planner.v0.60.zip) into your plugins folder OR:
> 1) Clone/fork this repo
> 2) Run `npm i` or `yarn install` to install project
> 3) Run `npm run build` or `yarn build`
> 4) Copy `./test-vault/.obsidian/plugins/obsidian-day-planner` folder to `<your vault location>/.obsidian/plugins`
> 
> ### TODOs
> - [ ] Update styles with from my CSS snippet (see Issues)
> - [ ] Fix the track time button (see Issues)
> - [ ] Add built-in pomodoro timer feature (see Issues)

This repository contains a plugin for [Obsidian](https://obsidian.md/) for day planning and managing pomodoro timers from a task list in a Markdown note. 

> This is an early alpha of version of the plugin and it will be running constantly in the background while Obsidian is open and the plugin is enabled. **Please try the plugin in a test vault first, and, most importantly, make sure you have your notes backed up in cloud storage or Git.**
    
## Features

- Generate a day planner for you each day or create a day planner in any note you choose.
- Status bar updates on progress with information on your current and next tasks. You can click on the status bar to access the note for today's day planner.
- Mermaid Gantt chart automatically generated from your tasks and included in you day planner note.
- Timeline view showing your tasks laid out on a vertical timeline.

![Day Planner Demo Image](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/day-planner-note-preview.png)

## Usage

Once installed, the plugin will create a folder called Day Planners in the root of your vault. A note for today will automatically be created with the file name format `Day Planners/Day Planner-YYYYMMDD.md`.

You can choose to use the [Command Mode](#day-planner-mode) instead to add a Day Planner for the current day to any note.

### Day Planner Note

Within the note, you can create a check list with times and tasks which will be automatically be tracked during the day. You can now include headings and other content between tasks. Here is an example:

```markdown
## Day Planner

This is my plan for the day broken into 3 main sections:
1. Morning Prep
2. Reading
3. Afternoon Review

### Morning Prep

This is where I get ready for work and do my usual prep.

- [ ] 09:30 Setup for work
- [ ] 09:45 Review notes from yesterday
- [ ] 10:30 Create new notes for #article review
- [ ] 11:30 BREAK

### Reading

A section of the day dedicated to reading:

1. Articles.
2. Book chapters assigned for the day.
3. Re-reading past notes.
   
- [ ] 12:00 Reading
  - [ ] Article 1
  - [ ] Article 2
  - [ ] Article notes review
- [ ] 12:25 BREAK
- [ ] 12:30 Reading
- [ ] 14:00 BREAK

### Afternoon Review

I use this time to review what I have done earlier in the day and complete any tasks to prepare for the next day.

- [ ] 15:00 Review notes and update daily note [[20201103]]
- [ ] 15:45 Walk
- [ ] 16:30 Reading
- [ ] 17:20 Prep for tomorrow's meetings
- [ ] 18:00 END
```

This is also provided as a file in [day-planner-example.md](https://github.com/lynchjames/obsidian-day-planner/blob/main/examples/day-planner-example.md).

The Day Planner heading and `---` rule are used to identify the extent of the Day Planner. A heading must be used but can be `#`, `##`, `###` or `####`.

The format of the task list items is important as this is what is used to calculate the times of each task and the intervals between tasks. The format used should be:

 `- [ ] HH:mm Task text` 
 
 **24 hour times should be used.** 

 Nested checklist items or bullets are now also supported to capture sub-tasks of a timed task. Timed tasks must be at the top level of the checkbox list.

 `BREAK` and `END` are keywords that define breaks and the end to the time tracking for the tasks. They are not case sensitive so `break` and `end` can also be used. Both `BREAK` and `END` keywords are configurable and can be customized in Day Planner settings tab.

 `END` is used as an item with a time to give an accurate time interval for the last task, *"Prep for tomorrow's meetings"* at 17:00 in this example.

 The note will update automatically: tasks in the past will be checked and marked as complete.

Using the example above, at 14:30 the note would have automatically updated to:

```markdown
## Day Planner

This is my plan for the day broken into 3 main sections:
1. Morning Prep
2. Reading
3. Afternoon Review

### Morning Prep

This is where I get ready for work and do my usual prep.

- [x] 09:30 Setup for work
- [x] 09:45 Review notes from yesterday
- [x] 10:30 Create new notes for #article review
- [x] 11:30 BREAK

### Reading

A section of the day dedicated to reading:

1. Articles.
2. Book chapters assigned for the day.
3. Re-reading past notes.
   
- [x] 12:00 Reading
  - [ ] Article 1
  - [ ] Article 2
  - [ ] Article notes review
- [x] 12:25 BREAK
- [x] 12:30 Reading
- [ ] 14:00 BREAK

### Afternoon Review

I use this time to review what I have done earlier in the day and complete any tasks to prepare for the next day.

- [ ] 15:00 Review notes and update daily note [[20201103]]
- [ ] 15:45 Walk
- [ ] 16:30 Reading
- [ ] 17:20 Prep for tomorrow's meetings
- [ ] 18:00 END
```

### Timeline View

The `Show the Day Planner Timeline` command can be used to add a vertical timeline view display the tasks for today's Day Planner with a line showing the current time.

![Day Planner Timeline](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/day-planner-timeline.png)

### Status Bar

The status bar in Obsidian will also show the current progress on the task or break with the time remaining. Clicking on the status bar item will take you to the Day Planner note.

#### Task Status

The status displayed when there is an active task:

![Task Status](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/task-status.png)

#### Break Status

The status displayed during a break:

![Break Status](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/break-status.png)

#### End Status

The status displayed when the end of the tasks is reached:

![End Status](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/end-status.png)

## Configuration

### Day Planner Mode

There are 2 modes to use the Day Planner plugin:

**File mode**

The plugin automatically generates day planner notes for each day within a Day Planners folder.

**Command mode**

Commands are used to insert a Day Planner for today within any note as well as unlinking the Day Planner for today from its current note.

>Note: To add the Day Planner to the current note you first need to Link the Day Planner to the current note by running either one of the commands "Day Planner: Link today's Day Planner to the current Note" or "Day Planner: Add a Day Planner template for today to the current note" from the command palette.

The Day Planner can be placed anywhere within a note as long as the format provided is used. Only the Day Planner section of the note will be updated as time progresses.

**Daily mode**
The plugin automatically looks for the day planner in daily notes. The Daily notes plugin must be enabled.

### Complete Past Planner Items

You can choose whether the plugin will automatically mark planner items in the past as complete or allow you to tick them off yourself.

### Mermaid Gantt

You can choose to include a dynamically generated [Mermaid Gantt chart](https://mermaid-js.github.io/mermaid/#/gantt) in your Day Planner.

Tasks and breaks will be displayed in separate sections to help visualise your plan for the day.

![Mermaid Gantt Chart Example](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/mermaid-gantt.png)

Colors for the gantt chart can be overridden with custom CSS and there is [Mermaid documentation](https://mermaid-js.github.io/mermaid/#/gantt?id=styling) on the classes. A CSS file with examples for the task and breaks sections is provided:

[mermaid-gantt-example.css](examples/mermaid-gantt-example.css)

### Status Bar - Circular Progress

You can choose to display progress in the status bar with a circular pie chart progress bar to save horizontal space.

![Circular Progress Bar](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/circular-progress.png)

### Status Bar - Now and Next

You can choose to display the time and start of the text for the current and next task.

![Now and Next](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/now-and-next.png)

### Task Notification

You can choose to have an in-app notification display when a new task starts.

### Timeline Zoom Level

This is the zoom level to dispaly the timeline. The higher the number, the more vertical space each task will take up.

## Commands

Using the plugin in command mode, 2 commands are available to link and unlink a Day Planner.

![Plugin Commands](https://raw.githubusercontent.com/lynchjames/obsidian-day-planner/main/images/commands.png)

## Compatibility

Custom plugins are only available for Obsidian v0.9.7+.

The current API of this repo targets Obsidian **v0.9.10**. 

## Installing

As of version [0.9.7 of Obsidian](https://forum.obsidian.md/t/obsidian-release-v0-9-7-insider-build/7628), this plugin is available to be installed directly from within the app. The plugin can be found in the Community Plugins directory which can be accessed from the Settings pane under Third Party Plugins.

## Manual installation

1. Download the [latest release](https://github.com/lynchjames/obsidian-day-planner/releases/latest)
1. Extract the obsidian-day-planner folder from the zip to your vault's plugins folder: `<vault>/.obsidian/plugins/`  
Note: On some machines the `.obsidian` folder may be hidden. On MacOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.
1. Reload Obsidian
1. If prompted about Safe Mode, you can disable safe mode and enable the plugin.

## For developers
Pull requests are both welcome and appreciated. 😀

If you would like to contribute to the development of this plugin, please follow the guidelines provided in [CONTRIBUTING.md](CONTRIBUTING.md).

## Donating

This plugin is provided free of charge. If you would like to donate something to me, you can via [PayPal](https://paypal.me/lynchjames2020). Thank you!
