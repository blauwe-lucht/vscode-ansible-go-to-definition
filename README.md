# Visual Studio Code Ansible Go to Definition

This vscode extension enhances the [RedHat Ansible extension](https://marketplace.visualstudio.com/items?itemName=redhat.ansible)
with some extra 'Go to Definition' functionality.

> **IMPORTANT:** This extension uses heuristics and will therefore be wrong in a lot of cases!
> Use at your own risk and don't use it when it doesn't work with your project.
> Don't say I didn't warn you. :)

## Requirements

The extension will only work when the RedHat Ansible extension has been
installed and the current file is actually recognized as Ansible file (it should say 'Ansible' in the bottom right of the IDE).

## How to use

Right-click on a word and select 'Go to Definition' or press F12 (or whatever shortcut key you have assigned).

## (Partially) supported definitions

- variables,
- import_tasks,
- include_tasks,
- files,
- templates,
- roles
