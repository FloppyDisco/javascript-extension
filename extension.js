const vscode = require("vscode");

function activate(context) {



  const insertCursorBeforeDefault = vscode.workspace
    .getConfiguration()
    .get("frogger.insertCursorBeforeByDefault", false);
  context.globalState.update(
    "insertCursorBefore",
    insertCursorBeforeDefault
  );

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
  inputBox.buttons = [
    {
      iconPath: new vscode.ThemeIcon("triangle-left"),
      tooltip: "Search",
    },
    {
      iconPath: new vscode.ThemeIcon("close"),
      tooltip: "Cancel",
    },
  ];

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

  let disposable = vscode.commands.registerCommand("frogger.jump", () => {

	const insertCursorBefore = context.globalState.get('insertCursorBefore', insertCursorBeforeDefault);
		jump(
			inputBox,
			insertCursorBefore,
		)
	});
	context.subscriptions.push(disposable);
}

function jump(
	inputBox,
	insertCursorBefore,
) {
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
    switch (button.tooltip) {
      case "Trigger Command":
        // Call a command when the "Trigger Command" button is clicked
        vscode.commands.executeCommand("extension.someCommand");
        break;
      case "Cancel":
        // Hide the input box when the "Cancel" button is clicked
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
    inputBox.hide();
  });
}

function searchInEditor(searchTerm, insertCursorBeforeMatch) {
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
    const matchesHighlight = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(0,255,0,0.4)", //green
    });
    editor.setDecorations(matchesHighlight, allMatches);

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
      const newPosition = insertCursorBeforeMatch ? targetMatch.start : targetMatch.end;

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
