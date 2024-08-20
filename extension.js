const vscode = require("vscode");

function activate(context) {

	// |-------------------------|
	// |        Settings         |
	// |-------------------------|

	// insertCursor setting
  const insertCursorBeforeDefault = vscode.workspace
    .getConfiguration()
    .get("frogger.insertCursorBeforeByDefault", false);

  context.globalState.update("insertCursorBefore", insertCursorBeforeDefault);

  // context.globalState.update('setting', newState);
  // context.globalState.get('setting', false);

  // create variables for the following

  /*
		highlightToMatch     		cmd+l
		insertCursorBeforeMatch   	cmd+i
		searchBackwards      		cmd+k
		searchFromTop				cmd+t
		searchFromBottom			cmd+b
	*/

  /*
	 settings

		searchBackwardsIfNoMatch
		insertCursorBeforeMatchByDefault
		wrapSearch

	*/

	// |-------------------------|
	// |        create UI        |
	// |-------------------------|

  const inputBox = vscode.window.createInputBox();
  inputBox.placeholder = "jump to ...";
  inputBox.prompt = "jumping";
  inputBox.title = "🐸";

  inputBox.buttons = createButtons();

  /*
		add commands to start these functions with specific settings, regardless of state or defaults

		- command to jump to the typed letter
			- "frogger.jump"
		- command to jump to the next occurence of the prev search
			- "frogger.jumpToNext"
		- command to jump to the prev occurence of the prev search
			- "frogger.jumpToPrev"
		- command to jump with highlighting already selected
			- "frogger.jumpSelect"
		- command to jump with backwards already selected
			- "frogger.jumpBackwards"
		- command to jump with insertCursorBeforeMatch set to true
			- "frogger.jumpTo"
		- command to jump with insertCursorBeforeMatch set to false
			- "frogger.jumpAfter"
		- command to jump to first occurence from top of file
			- "frogger.jumpFromTop"
		- command to jump to first occurence from bottom of file
			- "frogger.jumpFromBottom"
		- command to toggle all variables
	*/


	// |---------------------------|
	// |        UI Commands        |
	// |---------------------------|


  const toggleInsertCursor = vscode.commands.registerCommand(
    "frogger.toggleInsertCursor",
    () => {
		vscode.window.showInformationMessage('toggling insert cursor');
      // get the current global state
      const insertCursorBefore = !context.globalState.get(
        "insertCursorBefore",
        insertCursorBeforeDefault
      );
      // update the state to the toggled value
      context.globalState.update("insertCursorBefore", insertCursorBefore);
      // update the ui to reflect the new state
      inputBox.buttons = createButtons({
        id: "insert",
        iconPath: new vscode.ThemeIcon(
          insertCursorBefore ? "chevron-left" : "chevron-right"
        ),
        tooltip: `Insert Cursor ${insertCursorBefore ? "Before" : "After"}`,
      });
    }
  );


  	// |-------------------------------|
	// |        Search Commands        |
	// |-------------------------------|

  const standardJump = vscode.commands.registerCommand("frogger.jump", () => {
	vscode.commands.executeCommand('setContext', 'froggerFocused', true)
    const insertCursorBefore = context.globalState.get(
      "insertCursorBefore",
      insertCursorBeforeDefault
    );

    jump(inputBox, insertCursorBefore);
  });

  context.subscriptions.push(inputBox, standardJump, toggleInsertCursor);



  // |----------------------------|
  // |        Helper Funcs        |
  // |----------------------------|

  function createButtons(button) {
		/*
			returns the interface buttons
			accepts a button object as a parameter that will replace the default button with the matching id
		*/
    const defaultButtons = [
      {
        id: "insert",
        iconPath: new vscode.ThemeIcon(
          insertCursorBeforeDefault ? "chevron-left" : "chevron-right"
        ),
        tooltip: `Insert Cursor ${
          insertCursorBeforeDefault ? "Before" : "After"
        }`,
      },
      {
        id: "close",
        iconPath: new vscode.ThemeIcon("close"),
        tooltip: "Close",
      },
    ];
    return defaultButtons.map((defButton) =>
      defButton.id === button?.id ? button : defButton
    );
  }

} // end of activate()



function jump(inputBox, insertCursorBefore) {
  inputBox.show();

  // Handle when the user types in the input box
  inputBox.onDidChangeValue((value) => {
    if (value.length > 0) {
      vscode.window.showInformationMessage(`froggering to: ${value}`);
      searchInEditor(value, insertCursorBefore);
      inputBox.value = "";
      inputBox.hide();
    }
    inputBox.hide();
  });
  inputBox.onDidTriggerButton((button) => {
    switch (button.id) {
      case "insert":
        // Call a command when the "Trigger Command" button is clicked
        vscode.commands.executeCommand("frogger.toggleInsertCursor");
        break;
      case "close":
        inputBox.hide();
        break;
      default:
        // Handle any other cases if necessary
        break;
    }
  });

  inputBox.onDidAccept(() => {
    inputBox.hide();
  });

  inputBox.onDidHide(() => {
	vscode.window.showInformationMessage("hiding window")
	vscode.commands.executeCommand('setContext', 'froggerFocused', undefined);
    inputBox.hide();
  });
}

function searchInEditor(searchTerm, insertCursorBefore) {
  // store the searchTerm in global state

  const editor = vscode.window.activeTextEditor;
  if (editor && searchTerm) {
    const document = editor.document;

    const text = document.getText();

    // escape any regex special characters
    searchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchTermRegex = new RegExp(searchTerm, "g");

    const cursorPosition = editor.selection.active;
    const cursorOffset = document.offsetAt(cursorPosition);

    const allMatches = [];
    let match;
    while ((match = searchTermRegex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      allMatches.push(new vscode.Range(startPos, endPos));
    }

    const matchesBeforeCursor = allMatches.filter(
      (range) => document.offsetAt(range.start) < cursorOffset
    );
    const matchesAfterCursor = allMatches.filter(
      (range) => document.offsetAt(range.start) >= cursorOffset
    );

    // highlight all matches
    const matchesBeforeHighlight = vscode.window.createTextEditorDecorationType(
      {
        backgroundColor: "rgba(0,255,0,0.4)", //green
      }
    );
    const matchesAfterHighlight = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255,0,0,0.4)", //red
    });
    editor.setDecorations(matchesBeforeHighlight, matchesBeforeCursor);
    editor.setDecorations(matchesAfterHighlight, matchesAfterCursor);

    let targetMatch;

    if (matchesAfterCursor.length > 0) {
      targetMatch = matchesAfterCursor[0];
    } else {
      const WrapSearch = vscode.workspace
        .getConfiguration()
        .get("frogger.wrapSearch", false);

      if (WrapSearch && matchesBeforeCursor.length > 0) {
        targetMatch = matchesBeforeCursor[0];
      } else {
        const SearchBackwardsIfNoMatch = vscode.workspace
          .getConfiguration()
          .get("frogger.searchBackwardsIfNoMatch", false);

        if (SearchBackwardsIfNoMatch && matchesBeforeCursor.length > 0) {
          targetMatch = matchesBeforeCursor[matchesBeforeCursor.length - 1];
        }
      }
    }

    // modify this function to accept a highlighting feature
    if (targetMatch) {
      const newPosition = insertCursorBefore
        ? targetMatch.start
        : targetMatch.end;

      // change this selection to include the old position if highlighting
      // if jumping with a previous search the old position should be passed from the original search
      // this will need to be stored in state
      editor.selection = new vscode.Selection(newPosition, newPosition);

      // make the reveal location editable from settings
      editor.revealRange(targetMatch, vscode.TextEditorRevealType.InCenter);
    }
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
