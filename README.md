# Frogger

**Frogger** is a VSCode extension that allows you to leap your cursor using single character search, similar to the 'f' command in Vim. This extension provides quick and efficient navigation through your code by jumping directly to a specific character.



## Usage

### Keybindings

The following keybindings are available:

- `cmd+l`: Leap to a character (default keybinding).
- `cmd+l`: Leap with the last search character (when the Frogger input box is viewable).
- `cmd+j`: Leap back with the last search character (when the Frogger input box is viewable).
- `cmd+u`: Toggle Search Backwards (when the Frogger input box is viewable).
- `cmd+i`: Toggle Insert Cursor position (when the Frogger input box is viewable).
- `cmd+o`: Toggle Select to Match (when the Frogger input box is viewable).

### Features

- **Leap to a Specific Character**
- **Leap Backwards or Forwards**
- **Cursor Position**: Choose to insert the cursor to the left or right of the matched character.
- **Selection**: Select all text from the current cursor position to the matched character.

### Commands

### `frogger.leap`

Leap the cursor to the next occurrence of the specified character. This command can be invoked through the command palette or keybindings, when using a keybinding, arguments may be supplied.

- **Arguments**:
all arguments are **optional**
  - `searchTerm`: (string) The character to search for.
  - `insertCursorLeft`: (boolean) If true, the cursor is placed to the left of the match. Default is `false`.
  - `selectToMatch`: (boolean) If true, selects the text from the current cursor position to the match. Default is `false`.
  - `searchBackwards`: (boolean) If true, searches backwards from the cursor position. Default is `false`.
  - `revealRange`: (string) The reveal type for the match, can be "Default", "AtTop", "InCenter", "InCenterIfOutsideViewport". Default is `"Default"`.
  - `copyOnSelect`: (boolean) If true, automatically copies the selected text to the clipboard. Default is `false`.
  - `useRegex`: (boolean) If true, treats the search term as a regular expression. Default is `false`.

### a note on arguments:

arguments are a very powerful tool. The possibilities are endless. especially when using this extensions in conjuction with another tool like "Commands" which allows you to run a sequence of cmmands with arguments with one key press.

if the searchTerm argument is provided, the leap command will be called WITHOUT opening the input box.

if the searchTerm argument is not provided, the selected arguments will be applied and the input box will open arking for a searchTerm,
this allows you to customize the behavior of leap to your liking! if you want to select all text while leaping by default, just set the argument in the keybinding.

useRegex is a special feature that is only available when using leap through a keybinding. this allows you to provide a regular expression as the searchTerm.
- all searchTerm special characters will be escaped unless this flag is true
- to write a regular expression token inside json, the backslash must be escaped in the json, so `"\d"` becomes `"\\d"`


### `frogger.leapWithLastSearch`

Leaps the cursor using the previously used search term.

### `frogger.leapBackWithLastSearch`

Leaps the cursor backwards using the previously used search term.

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
- **Default**: `3000`
- **Description**: Sets the length of time (in milliseconds) the `CanLeapAgain` context is active after a leap.

## License

This extension is licensed under the [MIT License](LICENSE).
