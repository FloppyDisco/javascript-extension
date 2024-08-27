const vscode = require("vscode");

exports.SETTING_NAMES = {
    insertCursorLeft: "frogger.insertCursorLeft",
    selectToMatch: "frogger.selectToMatch",
    searchBackwards: "frogger.searchBackwards",
    copyOnSelect: "frogger.copyOnSelect",
    revealRange: "frogger.revealRange",
    previousLeap: "frogger.previousLeap",
    continueSelectionFrom: "frogger.continueSelectionFrom",
    repeatSearchTimeout: "frogger.repeatSearchTimeout",
};

exports.COMMANDS = {
    openBox: "frogger.openBox",
    toggleInsertCursor: "frogger.toggleInsertCursor",
    toggleSelectToMatch: "frogger.toggleSelectToMatch",
    toggleSearchBackwards: "frogger.toggleSearchBackwards",

    leap: "frogger.leap",
    repeatLeapForward: "frogger.repeatLeapForward",
    repeatLeapBack: "frogger.repeatLeapBack",
    leapWithPreviousSearchTerm: "frogger.leapWithPreviousSearchTerm",
};

exports.CONTEXTS = {
    froggerFocus: "FroggerFocus",
    froggerJustLeaped: "FroggerJustLeaped",
};

exports.BUTTONS = {
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
        tooltip: {
            true: "Insert Cursor Left (⌘I)",
            false: "Insert Cursor Right (⌘I)",
        },
    },
    select: {
        id: "select",
        icons: {
            true: "pencil",
            false: "whole-word",
        },
        tooltip: {
            true: "Select to Match (⌘H)",
            false: "Leap to Match (⌘H)",
        },
    },
    searchBackwards: {
        id: "searchBackwards",
        icons: {
            true: "arrow-left",
            false: "arrow-right",
        },
        tooltip: {
            true: "Search Backwards (⌘U)",
            false: "Search Forwards (⌘U)",
        },
    },
};

exports.HIGHLIGHTS = {
    green: vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(0,255,0,0.4)",
    }),
    red: vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(255,0,0,0.4)",
    }),
};
