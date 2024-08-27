# Frogger

**Frogger** is a VSCode extension that allows you to leap your cursor using single character search, similar to the 'f' command in Vim.

## Usage

Use the `cmd+l` keybinding to open the frogger input box.
press any character to leap the cursor to the next occurence of that character in the text.
settings can be toggled by pressing the buttons in the input box or using the keybindings.

### Features

- **Leap to a Specific Character**
- **Leap Backwards or Forwards**
- **Cursor Position**: Choose to insert the cursor to the left or right of the matched character.
- **Selection**: Select all text from the current cursor position to the matched character.

### Keybindings

The following keybindings are available:

- `cmd+l`: Leap to a character.
- `cmd+u`: Toggle search direction (when the Frogger input box is open).
- `cmd+i`: Toggle cursor insert position (when the Frogger input box is open).
- `cmd+o`: Toggle selecting text (when the Frogger input box is open).
- `cmd+l`: Repeat the previous leap, searching forwards.
- `cmd+j`: Repeat the previous leap, searching backwards.

the repeat command calls the exact same leap again. It will search the direction of the command you press, but all other settings remain the same.
It does NOT use the current leap settings even if the input box is open.
If you would like to leap using the previous character but change one of the settings, press `enter` instead.

### Commands

### `frogger.leap`

Leap the cursor to the next occurrence of the specified character. This command can be invoked through the command palette or keybindings, when using a keybinding, arguments may be supplied.

### `frogger.repeatLeapForward`

Repeat the previous leap! searching forward.

### `frogger.repeatLeapBack`

Repeat the previous leap! searching backwards.

### `frogger.toggleInsertCursor`

Toggles the `insertCursorLeft` setting, which controls whether the cursor is inserted to the left or right of the matched character.

### `frogger.toggleSelectToMatch`

Toggles the `selectToMatch` setting, which controls whether text is selected from the current cursor position to the matched character.

### `frogger.toggleSearchBackwards`

Toggles the `searchBackwards` setting, which controls the direction of the search.

## Settings

Frogger includes several customizable settings:

### `frogger.copyOnSelect`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: When enabled, the selected value is automatically copied to the clipboard when `selectToMatch` is used.

### `frogger.revealRange`
- **Type**: `string`
- **Default**: `Default`
- **Enum**: ["Default", "AtTop", "InCenter", "InCenterIfOutsideViewport"]
- **Description**: Determines how the editor reveals the match when leaping.

### `frogger.repeatSearchTimeout`
- **Type**: `integer`
- **Default**: `900`
- **Description**: Sets the length of time (in milliseconds) the `FroggerJustLeaped` context is active after a leap.


## defining custom keybindings
    arguments may be passed to the leap command when defining a custom keybinding.

**Arguments:**
all arguments are **optional**
  - `searchTerm`: (string) The character to search for.
  - `insertCursorLeft`: (boolean) If true, the cursor is placed to the left of the match. Default is `false`.
  - `selectToMatch`: (boolean) If true, selects the text from the current cursor position to the match. Default is `false`.
  - `searchBackwards`: (boolean) If true, searches backwards from the cursor position. Default is `false`.
  - `revealRange`: (string) The reveal type for the match, can be "Default", "AtTop", "InCenter", "InCenterIfOutsideViewport". Default is `"Default"`.
  - `copyOnSelect`: (boolean) If true, automatically copies the selected text to the clipboard. Default is `false`.
  - `useRegex`: (boolean) If true, treats the search term as a regular expression. Default is `false`.

### a note on arguments:


if the searchTerm argument is provided, the leap command will be called WITHOUT opening the input box.

if the searchTerm argument is not provided, the selected arguments will be applied and the input box will open.
this allows you to customize the behavior of leap to your liking! if you want to select all text while leaping by default, just set the argument in the keybinding.

arguments are a very powerful tool. The possibilities are endless. especially when using this extensions in conjuction with another tool like "Commands" which allows you to run a sequence of commands with one key press.
here is a snippet of how you can create a keybinding to copy the function parameters in the declaration line

```

// settings.json

"commands.commands":{
        "frogger.selectParams": {
            "sequence": [
                {
                    "command": "frogger.leap",
                    "args": {
                        "searchTerm": ")",
                        "insertCursorLeft": true,
                    }
                },
                {
                    "command": "frogger.leap",
                    "args": {
                        "searchTerm": "(",
                        "searchBackwards": true,
                        "insertCursorLeft": false,
                        "selectToMatch": true,
                        "copyOnSelect": true,
                    }
                }
            ]
        }
    }

// keybindings.json
[
    {
        "key": "cmd+shift+9",
        "command": "frogger.selectParams"
    },
    ...
]
```

`useRegex` is a special argument that is only available when using leap through a keybinding.
- if useRegex is set to true, the searchTerm will be treated as a regular expression
- to write a regular expression token inside json, the backslash must be escaped in the json, so `"\d"` becomes `"\\d"`
