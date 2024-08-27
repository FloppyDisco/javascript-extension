const vscode = require("vscode");
const {
    COMMANDS,
    SETTING_NAMES,
    BUTTONS,
    CONTEXTS,
    HIGHLIGHTS,
} = require("./constants");

let whenContextTimer;

function activate(context) {
    // |-------------------------|
    // |        Settings         |
    // |-------------------------|

    //   insertCursor setting
    // ------------------------
    updateGlobalState(SETTING_NAMES.insertCursorLeft, false);

    //   select setting
    // ------------------
    updateGlobalState(SETTING_NAMES.selectToMatch, false);

    //   search backwards setting
    // ----------------------------
    updateGlobalState(SETTING_NAMES.searchBackwards, false);

    // make sure previousLeap is not set
    updateGlobalState(SETTING_NAMES.previousLeap, {});

    updateGlobalState(SETTING_NAMES.startingCursorPosition, undefined);

    // |-------------------------|
    // |        create UI        |
    // |-------------------------|

    function createButtons() {
        const { insertCursorLeft, selectToMatch, searchBackwards } =
            getAllGlobalState();

        return [
            {
                id: BUTTONS.searchBackwards.id,
                iconPath: new vscode.ThemeIcon(
                    BUTTONS.searchBackwards.icons[searchBackwards]
                ),
                tooltip: BUTTONS.searchBackwards.tooltip[searchBackwards],
            },
            {
                id: BUTTONS.insert.id,
                iconPath: new vscode.ThemeIcon(
                    BUTTONS.insert.icons[insertCursorLeft]
                ),
                tooltip: BUTTONS.insert.tooltip[insertCursorLeft],
            },
            {
                id: BUTTONS.select.id,
                iconPath: new vscode.ThemeIcon(
                    BUTTONS.select.icons[selectToMatch]
                ),
                tooltip: BUTTONS.select.tooltip[selectToMatch],
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
    inputBox.placeholder = "Enter a character to leap to ...";
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
        inputBox.hide();

        leap({
            searchTerm,
            ...getAllGlobalState(),
        });
        inputBox.updatePrompt(searchTerm);
    });

    inputBox.onDidAccept(() => {
        // call leap with previous search term
        // vscode.commands.executeCommand(COMMANDS.repeatLeapForward);
    });

    inputBox.onDidHide(() => {
        inputBox.value = "";
        setFroggerFocusContext(undefined);
        vscode.window.activeTextEditor?.setDecorations(HIGHLIGHTS.green, []);
    });

    inputBox.openBox = () => {
        setFroggerFocusContext(true);
        inputBox.show();
    };

    inputBox.updatePrompt = (searchTerm) => {
        inputBox.prompt = `or leap again with " ${searchTerm} "`;
    };

    //   Status Bar
    // --------------

    const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        0
    );
    statusBar.text = "🐸";
    statusBar.tooltip = "Don't Forget to Frogger!";
    statusBar.command = COMMANDS.openBox;
    statusBar.show();

    // |------------------------|
    // |        Commands        |
    // |------------------------|

    const commands = [
        //   UI Commands
        // ---------------

        vscode.commands.registerCommand(COMMANDS.openBox, () => {
            inputBox.openBox();
        }),

        vscode.commands.registerCommand(COMMANDS.toggleInsertCursor, () => {
            // get the current global state and toggle the value
            const insertCursorLeft = getGlobalState(
                SETTING_NAMES.insertCursorLeft,
                false
            );
            // update the state
            updateGlobalState(
                SETTING_NAMES.insertCursorLeft,
                !insertCursorLeft
            );
            // update the ui to reflect the new state
            inputBox.buttons = createButtons();
        }),

        vscode.commands.registerCommand(COMMANDS.toggleSelectToMatch, () => {
            const selectToMatch = getGlobalState(
                SETTING_NAMES.selectToMatch,
                false
            );
            updateGlobalState(SETTING_NAMES.selectToMatch, !selectToMatch);
            inputBox.buttons = createButtons();
        }),

        vscode.commands.registerCommand(COMMANDS.toggleSearchBackwards, () => {
            const searchBackwards = getGlobalState(
                SETTING_NAMES.searchBackwards,
                false
            );
            updateGlobalState(SETTING_NAMES.searchBackwards, !searchBackwards);
            inputBox.buttons = createButtons();
        }),

        //   Search Commands
        // -------------------

        vscode.commands.registerCommand(COMMANDS.leap, (args) => {
            if (args) {
                //   command was called from keybinding
                if (!args.searchTerm) {
                    updateAllGlobalState(args);
                    inputBox.openBox();
                } else {
                    leap(args);
                }
            } else {
                inputBox.openBox();
            }
        }),

        vscode.commands.registerCommand(COMMANDS.repeatLeapForward, () => {
            let previousSearch = getGlobalState(SETTING_NAMES.previousLeap, {});
            console.log("previousSearch", previousSearch);

            previousSearch.searchBackwards = false;
            leap(previousSearch);
            highlightCurrentSelection();
        }),

        vscode.commands.registerCommand(COMMANDS.repeatLeapBack, () => {
            let previousSearch = getGlobalState(SETTING_NAMES.previousLeap, {});
            console.log("previousSeach", previousSearch);

            previousSearch.searchBackwards = true;
            leap(previousSearch);
            highlightCurrentSelection();
        }),
        /*

        */
    ]; // end of commands

    context.subscriptions.push(inputBox, ...commands);

    // |--------------------|
    // |        leap        |
    // |--------------------|

    function leap({
        searchTerm,
        insertCursorLeft = false,
        selectToMatch = false,
        searchBackwards = false,
        revealRange = false,
        copyOnSelect = false,
        startingCursorPosition,
        useRegex = false,
    }) {
        const editor = vscode.window.activeTextEditor;

        if (editor && searchTerm) {
            // save the search term in state
            const originalSearchTerm = searchTerm;
            if (!useRegex) {
                // escape any regex special characters
                searchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }
            const searchTermRegex = new RegExp(searchTerm, "i");

            const document = editor.document;

            const cursorPosition = editor.selection.active;

            // |--------------------------|
            // |        Find Match        |
            // |--------------------------|

            let matchPositionStart;
            let matchPositionEnd;

            if (searchBackwards) {
                //   Searching Backwards
                // -----------------------

                // shift the cursor one char to prevent matching the first char repeatedly
                const shiftedCursorPosition = document.positionAt(
                    document.offsetAt(cursorPosition) - 1
                );

                let textToSearch = document.getText(
                    new vscode.Range(
                        // top of document
                        new vscode.Position(0, 0),
                        // to the cursor
                        shiftedCursorPosition
                    )
                );

                textToSearch = [...textToSearch].reverse().join("");
                const match = searchTermRegex.exec(textToSearch);
                if (!match) {
                    return null;
                }

                // Calculate the actual position in the document
                const matchOffset =
                    document.offsetAt(shiftedCursorPosition) - match.index;

                matchPositionStart = document.positionAt(matchOffset);
                matchPositionEnd = document.positionAt(matchOffset - 1);
            } else {
                //   Searching Forwards
                // ----------------------

                // shift the cursor one char to prevent matching the first char repeatedly
                const shiftedCursorPosition = document.positionAt(
                    document.offsetAt(cursorPosition) + 1
                );

                const lastLine = document.lineCount - 1;

                const textToSearch = document.getText(
                    new vscode.Range(
                        // from the shifted cursor
                        shiftedCursorPosition,
                        // to the bottom of document
                        new vscode.Position(
                            lastLine,
                            document.lineAt(lastLine).text.length
                        )
                    )
                );

                const match = searchTermRegex.exec(textToSearch);
                if (!match) {
                    return null;
                }

                // Calculate the actual position in the document
                const matchOffset =
                    document.offsetAt(shiftedCursorPosition) + match.index;

                matchPositionStart = document.positionAt(matchOffset);
                matchPositionEnd = document.positionAt(matchOffset + 1);
            }

            // |----------------------------------------------|
            // |        Move editor selection to match        |
            // |----------------------------------------------|

            const matchRange = new vscode.Range(
                matchPositionStart,
                matchPositionEnd
            );

            const newPosition = insertCursorLeft
                ? matchRange.start
                : matchRange.end;

            const startingCursorPosition = getGlobalState(
                SETTING_NAMES.startingCursorPosition,
                undefined
            );

            editor.selection = new vscode.Selection(
                selectToMatch
                    ? startingCursorPosition
                        ? startingCursorPosition
                        : cursorPosition
                    : newPosition,
                newPosition
            );

            if (copyOnSelect) {
                vscode.env.clipboard.writeText(
                    document.getText(editor.selection)
                );
            }

            editor.revealRange(
                matchRange,
                vscode.TextEditorRevealType[revealRange]
            );

            // |-----------------------------|
            // |        Leap Complete        |
            // |-----------------------------|

            //   set recentLeap when context
            // -------------------------------

            setFroggerLeapedContext(true);
            statusBar.backgroundColor = new vscode.ThemeColor(
                "statusBarItem.warningBackground"
            );
            cancelRecentLeapContextAfterTimeout();

            updateGlobalState(SETTING_NAMES.previousLeap, {
                    searchTerm: originalSearchTerm,
                    leapFinalPosition: newCursorPosition,
                    insertCursorLeft,
                    selectToMatch,
                    searchBackwards,
                    revealRange,
                    copyOnSelect,
                    useRegex,
            });
        }
    }


    function highlightCurrentSelection() {
        // highlight the current position in the editor for clarity
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // clear previous highlighting
            editor.setDecorations(HIGHLIGHTS.green, []);

            const { searchBackwards, insertCursorLeft } = getAllGlobalState();

            const range = new vscode.Range(
                editor.selection.start,
                editor.document.positionAt(
                    editor.document.offsetAt(editor.selection.end) +
                        (insertCursorLeft ? 1 : -1)
                )
            );
            editor.setDecorations(HIGHLIGHTS.green, [range]);
        }
    }

    // |-------------------------------|
    // |        State Functions        |
    // |-------------------------------|

    function updateGlobalState(settingName, value) {
        context.globalState.update(settingName, value);
    }
    function getGlobalState(settingName, settingDefault) {
        return context.globalState.get(settingName, settingDefault);
    }
    function getAllGlobalState() {
        return {
            insertCursorLeft: getGlobalState(
                SETTING_NAMES.insertCursorLeft,
                false
            ),

            selectToMatch: getGlobalState(SETTING_NAMES.selectToMatch, false),

            searchBackwards: getGlobalState(
                SETTING_NAMES.searchBackwards,
                false
            ),



            startingCursorPosition: getGlobalState(
                SETTING_NAMES.startingCursorPosition,
                undefined
            ),

            revealRange: vscode.workspace
                .getConfiguration()
                .get(SETTING_NAMES.revealRange, "Default"),

            copyOnSelect: vscode.workspace
                .getConfiguration()
                .get(SETTING_NAMES.copyOnSelect, "Default"),
        };
    }

    function updateAllGlobalState({
        insertCursorLeft,
        selectToMatch,
        searchBackwards,
        lastSearchTerm,
        startingCursorPosition,
        revealRange,
        copyOnSelect,
    }) {
        if (insertCursorLeft !== undefined) {
            updateGlobalState(SETTING_NAMES.insertCursorLeft, insertCursorLeft);
        }
        if (selectToMatch !== undefined) {
            updateGlobalState(SETTING_NAMES.selectToMatch, selectToMatch);
        }
        if (searchBackwards !== undefined) {
            updateGlobalState(SETTING_NAMES.searchBackwards, searchBackwards);
        }
        if (copyOnSelect !== undefined) {
            updateGlobalState(SETTING_NAMES.copyOnSelect, copyOnSelect);
        }
        if (revealRange !== undefined) {
            updateGlobalState(SETTING_NAMES.revealRange, revealRange);
        }
        if (lastSearchTerm !== undefined) {
            updateGlobalState(SETTING_NAMES.lastSearchTerm, lastSearchTerm);
        }
        inputBox.buttons = createButtons();
    }

    // |--------------------------------|
    // |        Context Funtions        |
    // |--------------------------------|

    function setWhenContext(key, value) {
        return vscode.commands.executeCommand("setContext", key, value);
    }
    function setFroggerFocusContext(value) {
        return setWhenContext(CONTEXTS.froggerIsViewable, value);
    }
    function setRecentLeapContext(value) {
        if (whenContextTimer) {
            clearTimeout(whenContextTimer);
        }
        return setWhenContext(CONTEXTS.froggerJustLeaped, value);
    }

    function cancelRecentLeapContextAfterTimeout() {
        const timeout = vscode.workspace
            .getConfiguration()
            .get(SETTING_NAMES.repeatSearchTimeout, 1500);

        whenContextTimer = setTimeout(() => {
            // clear status bar background
            statusBar.backgroundColor = "";
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                // clear any highlighting
                editor.setDecorations(HIGHLIGHTS.green, []);
            }
            setRecentLeapContext(undefined);
        }, timeout);
    }
} // end of activate()

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
