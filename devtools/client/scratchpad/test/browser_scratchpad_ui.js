/* vim: set ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

function test() {
  waitForExplicitFinish();

  gBrowser.selectedTab = BrowserTestUtils.addTab(gBrowser);
  BrowserTestUtils.browserLoaded(gBrowser.selectedBrowser).then(function() {
    openScratchpad(runTests);
  });

  BrowserTestUtils.loadURI(gBrowser, "data:text/html,<title>foobarBug636725</title>" +
                   "<p>test inspect() in Scratchpad");
}

function runTests() {
  const sp = gScratchpadWindow.Scratchpad;
  const doc = gScratchpadWindow.document;

  const methodsAndItems = {
    "sp-menu-newscratchpad": "openScratchpad",
    "sp-menu-open": "openFile",
    "sp-menu-save": "saveFile",
    "sp-menu-saveas": "saveFileAs",
    "sp-text-run": "run",
    "sp-text-inspect": "inspect",
    "sp-text-display": "display",
    "sp-text-reloadAndRun": "reloadAndRun",
    "sp-menu-content": "setContentContext",
    "sp-menu-browser": "setBrowserContext",
    "sp-menu-line-numbers": "toggleEditorOption",
    "sp-menu-word-wrap": "toggleEditorOption",
    "sp-menu-highlight-trailing-space": "toggleEditorOption",
    "sp-menu-larger-font": "increaseFontSize",
    "sp-menu-smaller-font": "decreaseFontSize",
    "sp-menu-normal-size-font": "normalFontSize",
  };

  let lastMethodCalled = null;

  for (const id in methodsAndItems) {
    lastMethodCalled = null;

    const methodName = methodsAndItems[id];
    const oldMethod = sp[methodName];
    ok(oldMethod, "found method " + methodName + " in Scratchpad object");

    sp[methodName] = () => {
      lastMethodCalled = methodName;
    };

    const menu = doc.getElementById(id);
    ok(menu, "found menuitem #" + id);

    try {
      menu.doCommand();
    } catch (ex) {
      ok(false, "exception thrown while executing the command of menuitem #" + id);
    }

    ok(lastMethodCalled == methodName,
       "method " + methodName + " invoked by the associated menuitem");

    sp[methodName] = oldMethod;
  }

  finish();
}
