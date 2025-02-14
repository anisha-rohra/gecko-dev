/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

// Test for About Dialog foreground check for updates
// with another application instance handling updates.
add_task(async function aboutDialog_foregroundCheck_otherInstance() {
  setOtherInstanceHandlingUpdates();

  let updateParams = "";
  await runAboutDialogUpdateTest(updateParams, false, [
    {
      panelId: "otherInstanceHandlingUpdates",
      checkActiveUpdate: null,
      continueFile: null,
    },
  ]);
});
