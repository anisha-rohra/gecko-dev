/*
 * Tests that the environment variables are used to select a profile and that
 * on the first run of a dedicated profile build we snatch it if it was the
 * default profile and lock it when we're the default app.
 */

add_task(async () => {
  gIsDefaultApp = true;

  let root = makeRandomProfileDir("foo");
  let local = gDataHomeLocal.clone();
  local.append("foo");

  writeCompatibilityIni(root);

  let profileData = {
    options: {
      startWithLastProfile: true,
    },
    profiles: [{
      name: PROFILE_DEFAULT,
      path: root.leafName,
      default: true,
    }, {
      name: "Profile2",
      path: "Path2",
    }, {
      name: "Profile3",
      path: "Path3",
    }],
  };

  // Another install is using the profile but it isn't locked.
  let installData = {
    installs: {
      otherinstall: {
        default: root.leafName,
      },
    },
  };

  writeProfilesIni(profileData);
  writeInstallsIni(installData);
  checkProfileService(profileData, installData);

  let env = Cc["@mozilla.org/process/environment;1"].
            getService(Ci.nsIEnvironment);
  env.set("XRE_PROFILE_PATH", root.path);
  env.set("XRE_PROFILE_LOCAL_PATH", local.path);

  let { rootDir, localDir, profile, didCreate } = selectStartupProfile();
  checkStartupReason("restart-claimed-default");

  Assert.ok(!didCreate, "Should not have created a new profile.");
  Assert.ok(rootDir.equals(root), "Should have selected the right root dir.");
  Assert.ok(localDir.equals(local), "Should have selected the right local dir.");
  Assert.ok(profile, "A named profile matches this.");
  Assert.equal(profile.name, PROFILE_DEFAULT, "The right profile was matched.");

  let service = getProfileService();
  Assert.equal(service.defaultProfile, profile, "Should be the default profile.");
  Assert.equal(service.currentProfile, profile, "Should be the current profile.");

  profileData = readProfilesIni();
  Assert.equal(profileData.profiles[0].name, PROFILE_DEFAULT, "Should be the right profile.");
  Assert.ok(profileData.profiles[0].default, "Should still be the old default profile.");

  let hash = xreDirProvider.getInstallHash();
  installData = readInstallsIni();
  // The info about the other install will have been removed so it goes through first run on next startup.
  Assert.equal(Object.keys(installData.installs).length, 1, "Should be one known install.");
  Assert.equal(installData.installs[hash].default, root.leafName, "Should have marked the original default profile as the default for this install.");
  Assert.ok(installData.installs[hash].locked, "Should have locked as we're the default app.");
});
