## 0.19.1

### 🐞 Fixed issues

- Fix displaying hover preview

## 0.19.0

### ✨ New Feature: Internet Calendar Sync (Google, Outlook, iCloud)

- This lets you display events from calendars like Google Calendar, iCloud Calendar, Outlook Calendar
- You only need to add a link in the plugin settings to start displaying events from that calendar

See [README](https://github.com/ivan-lednev/obsidian-day-planner?tab=readme-ov-file#showing-internet-calendars) for details.

## 0.18.0

### ✨ New features

- Now hovering over a task with `Control` pressed will trigger a preview pop-up. This works great with the awesome [Hover Editor plugin](https://github.com/nothingislost/obsidian-hover-editor)
- Now when you click on a task, if there is an open tab for that file, the plugin is going to reuse it

## 0.17.2

### 🐞 Fixed issues

- Fix creating tasks with drag-and-drop

## 0.17.0

### 💥 Breaking changes

- Now by default, if your Dataview souce filter is empty, tasks are pulled only from visible daily notes
  - Most people never touch this field, so the plugin is going to be lightning-fast by default
  - If you want to add other folders or tags as task sources, you can still do so by adding them explicitly

### ✨ New features

- When dragging tasks from daily notes across days in the weekly view, they now get moved across files
- There is now an option to hide completed tasks from timeline
- There is now an option to hide subtasks from task blocks in the timeline

### 🐞 Fixed issues

- New drag-and-drop operations can now be started immediately after previous ones
- The plugin is much faster in the default use case (daily notes only)
- You can use plain list items in daily notes again
- Notifications work again
- Unscheduled tasks now fit their contents

### Acknowledgements

- Big thanks to @weph for helping me figure out a good performance solution
