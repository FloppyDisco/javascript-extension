const vscode = require("vscode");

/*
settings.json
	"frogger.insertCursorBeforeByDefault"
	"frogger.selectToMatchByDefault"
	"frogger.searchBackwardsByDefault"
	"frogger.copyToClipboardOnSelect"
*/

const SETTING_NAMES = {
    insertCursorBefore: "frogger.insertCursorBefore",
    insertCursorBeforeByDefault: "frogger.insertCursorBeforeByDefault",
    selectToMatch: "frogger.selectToMatch",
    selectToMatchByDefault: "frogger.selectToMatchByDefault",
    copyToClipboardOnSelect: "frogger.copyToClipboardOnSelect",
    searchBackwards: "frogger.searchBackwards",
    searchBackwardsByDefault: "frogger.searchBackwardsByDefault",
    lastSearchTerm: "frogger.lastSearchTerm",
};

const COMMANDS = {
    toggleInsertCursor: "frogger.toggleInsertCursor",
    toggleSelectToMatch: "frogger.toggleSelectToMatch",
    toggleSearchBackwards: "frogger.toggleSearchBackwards",

    jump: "frogger.jump",
    jumpWithLastSearch: "frogger.jumpWithLastSearch",
    /*
		add commands to start these functions with specific settings, regardless of state or defaults

		- command to jump to the typed letter
			- "frogger.jump"
		- command to jump to the next occurence of the prev search
			- "frogger.jumpToNext"
		- command to jump to the prev occurence of the prev search
			- "frogger.jumpToPrev"
		- command to jump with selecting already selected
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
};

const CONTEXTS = {
    froggerIsViewable: "FroggerIsViewable",
};

const BUTTONS = {
    close: {
        id: "close",
        icon: "close",
        tooltip: "Close (Escape)",
    },
    insert: {
        id: "insert",
        icons: {
            true: "triangle-left",
            false: "triangle-right",
        },
        tip: {
            true: "Insert Cursor Before",
            false: "Insert Cursor After",
        },
        key: "⌘I",
    },
    select: {
        id: "select",
        icons: {
            true: "pencil",
            false: "whole-word",
        },
        tip: {
            true: "Select to Match",
            false: "Jump to Match",
        },
        key: "⌘L",
    },
    searchBackwards: {
        id: "searchBackwards",
        icons: {
            true: "arrow-left",
            false: "arrow-right",
        },
        tip: {
            true: "Search Backwards",
            false: "Search Forwards",
        },
        key: "⌘K",
    },
};


const HIGHLIGHTS ={
    green: vscode.window.createTextEditorDecorationType(
        {
            backgroundColor: "rgba(0,255,0,0.25)",
        }
    ),
    red: vscode.window.createTextEditorDecorationType(
        {
            backgroundColor: "rgba(255,0,0,0.25)",
        }
    ),
};


function activate(context) {
    // |-------------------------|
    // |        Settings         |
    // |-------------------------|

    function createDefaultSetting(settingName) {
        return vscode.workspace.getConfiguration().get(settingName, false);
    }
    function updateGlobalState(settingName, value) {
        context.globalState.update(settingName, value);
    }
    function getGlobalState(settingName, settingDefault) {
        return context.globalState.get(settingName, settingDefault);
    }

    //   insertCursor setting
    // ------------------------
    const insertCursorBeforeDefault = createDefaultSetting(
        SETTING_NAMES.insertCursorBeforeByDefault
    );
    updateGlobalState(
        SETTING_NAMES.insertCursorBefore,
        insertCursorBeforeDefault
    );

    //   select setting
    // ------------------
    const selectToMatchDefault = createDefaultSetting(
        SETTING_NAMES.selectToMatchByDefault
    );
    updateGlobalState(SETTING_NAMES.selectToMatch, selectToMatchDefault);

    //   search backwards setting
    // ----------------------------
    const searchBackwardsDefault = createDefaultSetting(
        SETTING_NAMES.selectToMatchByDefault
    );
    updateGlobalState(SETTING_NAMES.searchBackwards, selectToMatchDefault);

    // make sure last search term is not set
    updateGlobalState(SETTING_NAMES.lastSearchTerm, false);

    function getAllGlobalState() {
        return {
            insertCursorBefore: getGlobalState(
                SETTING_NAMES.insertCursorBefore,
                insertCursorBeforeDefault
            ),
            selectToMatch: getGlobalState(
                SETTING_NAMES.selectToMatch,
                selectToMatchDefault
            ),
            searchBackwards: getGlobalState(
                SETTING_NAMES.searchBackwards,
                searchBackwardsDefault
            ),
            lastSearchTerm: getGlobalState(
                SETTING_NAMES.lastSearchTerm,
                false
            )
        };
    }

    // |-------------------------|
    // |        create UI        |
    // |-------------------------|

    function createButtons() {
        const { insertCursorBefore, selectToMatch, searchBackwards } =
            getAllGlobalState();

        return [
            {
                id: BUTTONS.searchBackwards.id,
                iconPath: new vscode.ThemeIcon(
                    BUTTONS.searchBackwards.icons[searchBackwards]
                ),
                tooltip: createTooltip(
                    BUTTONS.searchBackwards,
                    searchBackwards
                ),
            },
            {
                id: BUTTONS.insert.id,
                iconPath: new vscode.ThemeIcon(
                    BUTTONS.insert.icons[insertCursorBefore]
                ),
                tooltip: createTooltip(BUTTONS.insert, insertCursorBefore),
            },
            {
                id: BUTTONS.select.id,
                iconPath: new vscode.ThemeIcon(
                    BUTTONS.select.icons[selectToMatch]
                ),
                tooltip: createTooltip(BUTTONS.select, selectToMatch),
            },
            {
                id: BUTTONS.close.id,
                iconPath: new vscode.ThemeIcon(BUTTONS.close.icon),
                tooltip: BUTTONS.close.tooltip,
            },
        ];
    }

    //   Input Box
    // -------------

    const inputBox = vscode.window.createInputBox();
    inputBox.placeholder = "Enter a character to jump to ...";
    inputBox.prompt = "";
    inputBox.title = "🐸";
    inputBox.buttons = createButtons();

    inputBox.onDidTriggerButton((button) => {
        switch (button.id) {
            case BUTTONS.insert.id:
                vscode.commands.executeCommand(COMMANDS.toggleInsertCursor);
                break;
            case BUTTONS.select.id:
                vscode.commands.executeCommand(COMMANDS.toggleSelectToMatch);
                break;
            case BUTTONS.searchBackwards.id:
                vscode.commands.executeCommand(COMMANDS.toggleSearchBackwards);
                break;
            case BUTTONS.close.id:
                inputBox.hide();
                break;
        }
    });

    inputBox.onDidChangeValue((searchTerm) => {
        const { insertCursorBefore, selectToMatch, searchBackwards } =
            getAllGlobalState();

        inputBox.hide();
        Jump(
            searchTerm,
            insertCursorBefore,
            selectToMatch,
            searchBackwards
        );
        inputBox.storeSearchTerm(searchTerm);
    });
    inputBox.onDidAccept(() => {

        vscode.commands.executeCommand(COMMANDS.jumpWithLastSearch);

        const editor = vscode.window.activeTextEditor
        if (editor){
            editor.setDecorations(HIGHLIGHTS.green,[])
            const range = new vscode.Range(editor.selection.start, editor.document.positionAt(editor.document.offsetAt(editor.selection.end)+(getGlobalState(SETTING_NAMES.insertCursorBefore,false) ? 1 : -1)))
            editor.setDecorations(HIGHLIGHTS.green,[range])
        }
    });

    inputBox.onDidHide(() => {
        inputBox.value = "";
        setFroggerFocusContext(undefined);
        inputBox.hide();
        vscode.window.activeTextEditor?.setDecorations(HIGHLIGHTS.green,[])
    });

    inputBox.openBox = () => {
        // highlightCurrentCharacter();
        setFroggerFocusContext(true);
        inputBox.show();
    };
    inputBox.storeSearchTerm = (searchTerm) => {
        updateGlobalState(SETTING_NAMES.lastSearchTerm, searchTerm);
        inputBox.prompt = `or jump to  ${searchTerm}  again!`;
    };

    // |---------------------------|
    // |        UI Commands        |
    // |---------------------------|

    const commands = [
        vscode.commands.registerCommand(COMMANDS.toggleInsertCursor, () => {
            // get the current global state and toggle the value
            const insertCursorBefore = !getGlobalState(
                SETTING_NAMES.insertCursorBefore,
                insertCursorBeforeDefault
            );
            // update the state
            updateGlobalState(
                SETTING_NAMES.insertCursorBefore,
                insertCursorBefore
            );
            // update the ui to reflect the new state
            inputBox.buttons = createButtons();
        }),

        vscode.commands.registerCommand(COMMANDS.toggleSelectToMatch, () => {
            const selectToMatch = !getGlobalState(
                SETTING_NAMES.selectToMatch,
                selectToMatchDefault
            );
            updateGlobalState(SETTING_NAMES.selectToMatch, selectToMatch);
            inputBox.buttons = createButtons();
        }),

        vscode.commands.registerCommand(COMMANDS.toggleSearchBackwards, () => {
            const searchBackwards = !getGlobalState(
                SETTING_NAMES.searchBackwards,
                searchBackwardsDefault
            );
            updateGlobalState(SETTING_NAMES.searchBackwards, searchBackwards);
            inputBox.buttons = createButtons();
        }),

        // |-------------------------------|
        // |        Search Commands        |
        // |-------------------------------|

        vscode.commands.registerCommand(COMMANDS.jump, () => {
            inputBox.openBox();
            // highlight current location in editor
        }),
        vscode.commands.registerCommand(COMMANDS.jumpWithLastSearch, () => {

            // check how often this is used, maybe pull it back out of getAll
            // const lastSearchTerm = getGlobalState(SETTING_NAMES.lastSearchTerm,undefined);

            const { insertCursorBefore, selectToMatch, searchBackwards, lastSearchTerm } =
            getAllGlobalState();
            if (!lastSearchTerm){ return null }

            Jump(
                lastSearchTerm,
                insertCursorBefore,
                selectToMatch,
                searchBackwards
            )
        }),
        /*


		*/
    ]; // end of commands

    context.subscriptions.push(inputBox, ...commands);

    // |--------------------|
    // |        Jump        |
    // |--------------------|

    function Jump(
        searchTerm,
        insertCursorBefore,
        selectToMatch,
        searchBackwards
    ) {
        // vscode.window.showInformationMessage(`jumping to ${searchTerm}`);
        // console.log('settings:',);
        // console.log('insertCursorBefore',insertCursorBefore);
        // console.log('selectToMatch',selectToMatch);
        // console.log('searchBackwards',searchBackwards);




        const editor = vscode.window.activeTextEditor;

        if (editor && searchTerm) {
            // escape any regex special characters
            searchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            // create regex to search for
            const searchTermRegex = new RegExp(searchTerm, "g");

            const document = editor.document;

            // get selection (line: col)
            const cursorPosition = editor.selection.active;

            if (searchBackwards) {
                //   Searching Backwards
                // -----------------------

                console.log('searching backwards',);


                var textToSearch = document.getText(
                    new vscode.Range(
                        // top of document
                        new vscode.Position(0, 0),
                        // to the cursor
                        cursorPosition
                    )
                );
                textToSearch = [...textToSearch].reverse().join("");
                const match = searchTermRegex.exec(textToSearch);
                if (!match) {
                    return null;
                }
            } else {

                console.log('searching forwards',);

                //   Searching Forwards
                // ----------------------

                // shift the cursor one char to prevent matching the first char repeatedly
                var shiftedCursorPosition = document.positionAt(document.offsetAt(cursorPosition)+1);

                // console.log('cursorPosition',cursorPosition);
                // console.log('shiftedCursorPosition',shiftedCursorPosition);

                const lastLine = document.lineCount - 1;

                var textToSearch = document.getText(
                    new vscode.Range(
                        // from the shifted cursor
                        shiftedCursorPosition,
                        // to the bottom of document
                        new vscode.Position(
                            lastLine,
                            document.lineAt(lastLine).range.end
                        )
                    )
                );

console.log('textToSearch',textToSearch);



                var match = searchTermRegex.exec(textToSearch);
                if (!match) {
                    console.log('no match',);

                    return null;
                }
            }
            console.log('match',match);

            // Calculate the actual position in the document
            const startOffset =
                document.offsetAt(shiftedCursorPosition) + match.index;
            const endOffset = startOffset + 1;

            const startPos = document.positionAt(startOffset);
            const endPos = document.positionAt(endOffset);

            const matchRange = new vscode.Range(startPos, endPos);

            // highlight all matches


            const newPosition = insertCursorBefore
                ? matchRange.start
                : matchRange.end;

            // change this selection to include the old position if highlighting
            // if jumping with a previous search the old position should be passed from the original search
            // this will need to be stored in state
            editor.selection = new vscode.Selection(newPosition, newPosition);

            // make the reveal location editable from settings
            editor.revealRange(
                matchRange,
                vscode.TextEditorRevealType.InCenter
            );
        }
    }
} // end of activate()

function setWhenContext(key, value) {
    return vscode.commands.executeCommand("setContext", key, value);
}
function setFroggerFocusContext(value) {
    return setWhenContext(CONTEXTS.froggerIsViewable, value);
}
function createTooltip(buttonSettings, settingState) {
    return `${buttonSettings.tip[settingState]} (${buttonSettings.key})`;
}

// fix this shit
function highlightCurrentCharacter() {
    const editor = vscode.window.activeTextEditor;
    const cursorPosition = editor.selection.active;
    const cursorOffset = editor.document.positionAt(cursorPosition);
    const cursor = new vscode.Range(cursorOffset, cursorOffset + 1);
    editor.selection = new vscode.Selection(cursor.start, cursor.end);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
