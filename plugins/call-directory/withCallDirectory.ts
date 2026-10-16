import {
  ConfigPlugin,
  withXcodeProject,
  withInfoPlist,
  withEntitlementsPlist,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

const EXTENSION_NAME = "CallDirectoryExtension";
const EXTENSION_BUNDLE_ID_SUFFIX = "CallDirectory";

/**
 * Expo config plugin that adds an iOS Call Directory extension target.
 *
 * The extension reads a shared App Group container for a JSON file of
 * { phoneNumber: label } entries written by the main app, and registers
 * them with CallKit's identification (not blocking) API.
 *
 * During `npx expo prebuild`, this plugin:
 *  1. Creates the extension's Swift source + Info.plist under ios/CallDirectoryExtension/
 *  2. Adds a new PBXNativeTarget to the Xcode project
 *  3. Adds the App Group entitlement to both the main app and the extension
 *
 * Note: `expo prebuild` must be run locally (`npx expo prebuild -p ios`) or on
 * EAS Build. The extension target requires a provisioning profile with the
 * App Group capability — EAS handles this via the `entitlements` in app.json.
 */
const withCallDirectory: ConfigPlugin<{ appGroupId: string }> = (
  config,
  { appGroupId }
) => {
  const extensionBundleId = `${config.ios?.bundleIdentifier}.${EXTENSION_BUNDLE_ID_SUFFIX}`;

  // --- 1. Write the extension source files during prebuild ---
  config = withXcodeProject(config, async (cfg) => {
    const project = cfg.modResults;
    const iosDir = path.join(cfg.modRequest.projectRoot, "ios");
    const extDir = path.join(iosDir, EXTENSION_NAME);

    // Create the extension source directory
    fs.mkdirSync(extDir, { recursive: true });

    // Write the Swift handler
    fs.writeFileSync(
      path.join(extDir, "CallDirectoryHandler.swift"),
      SWIFT_HANDLER.replace(/__APP_GROUP_ID__/g, appGroupId)
    );

    // Write the extension Info.plist
    fs.writeFileSync(
      path.join(extDir, "Info.plist"),
      INFO_PLIST.replace(/__EXTENSION_BUNDLE_ID__/g, extensionBundleId)
    );

    // Write entitlements
    fs.writeFileSync(
      path.join(extDir, `${EXTENSION_NAME}.entitlements`),
      ENTITLEMENTS.replace(/__APP_GROUP_ID__/g, appGroupId)
    );

    // --- Add the target to the Xcode project ---
    const targetName = EXTENSION_NAME;
    const targetUuid = project.addTarget(
      targetName,
      "app_extension",
      targetName
    );

    // Add build phases
    project.addBuildPhase(
      [`${EXTENSION_NAME}/CallDirectoryHandler.swift`],
      "PBXSourcesBuildPhase",
      "Sources",
      targetUuid
    );

    project.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      targetUuid
    );

    project.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      targetUuid
    );

    // Set build settings for the extension target
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const buildSettings = configurations[key].buildSettings;
      if (
        buildSettings &&
        configurations[key].name &&
        (buildSettings.PRODUCT_NAME === `"${targetName}"` ||
          buildSettings.PRODUCT_NAME === targetName)
      ) {
        buildSettings.PRODUCT_BUNDLE_IDENTIFIER = extensionBundleId;
        buildSettings.INFOPLIST_FILE = `${EXTENSION_NAME}/Info.plist`;
        buildSettings.CODE_SIGN_ENTITLEMENTS = `${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements`;
        buildSettings.SWIFT_VERSION = "5.0";
        buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "15.0";
        buildSettings.SKIP_INSTALL = "YES";
        buildSettings.CLDEX_CLASSIFICATION = "call-directory";
      }
    }

    return cfg;
  });

  // --- 2. Add the App Group entitlement to the main app ---
  config = withEntitlementsPlist(config, (cfg) => {
    const groups =
      (cfg.modResults["com.apple.security.application-groups"] as string[]) ??
      [];
    if (!groups.includes(appGroupId)) {
      groups.push(appGroupId);
    }
    cfg.modResults["com.apple.security.application-groups"] = groups;
    return cfg;
  });

  // --- 3. Declare the Call Directory usage in the main app's Info.plist ---
  config = withInfoPlist(config, (cfg) => {
    // No special Info.plist key needed for the main app; the extension carries
    // the NSExtension declaration. But we do want the app group declared.
    return cfg;
  });

  return config;
};

// ---------------------------------------------------------------------------
// Template files
// ---------------------------------------------------------------------------

const SWIFT_HANDLER = `import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider,
    CXCallDirectoryExtensionContextDelegate {

    let appGroupId = "__APP_GROUP_ID__"
    let dataFileName = "caller_labels.json"

    func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self

        do {
            if #available(iOSApplicationExtension 16.0, *) {
                // iOS 16+: add identification entries then complete
                try addIdentificationPhoneNumbers(to: context)
                context.completeRequest()
            } else {
                // iOS 15 and earlier: use incremental loading
                try addIdentificationPhoneNumbers(to: context)
                context.completeRequest()
            }
        } catch {
            NSLog("CallDirectoryHandler: failed to load numbers — \\(error)")
            context.completeRequest()
        }
    }

    private func addIdentificationPhoneNumbers(
        to context: CXCallDirectoryExtensionContext
    ) throws {
        guard let containerURL = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupId)
        else {
            NSLog("CallDirectoryHandler: App Group container not available")
            return
        }

        let fileURL = containerURL.appendingPathComponent(dataFileName)
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            NSLog("CallDirectoryHandler: no data file found")
            return
        }

        let data = try Data(contentsOf: fileURL)
        guard let entries = try JSONSerialization.jsonObject(with: data)
            as? [String: String]
        else {
            NSLog("CallDirectoryHandler: invalid JSON format")
            return
        }

        // Sort numerically — CallKit requires entries in ascending order
        let sorted = entries
            .compactMap { (key, value) -> (CXCallDirectoryPhoneNumber, String)? in
                guard let number = CXCallDirectoryPhoneNumber(key)
                    .flatMap({ $0 }) ?? CXCallDirectoryPhoneNumber(key)
                else { return nil }
                return (number, value)
            }
            .sorted { $0.0 < $1.0 }

        for (phoneNumber, label) in sorted {
            context.addIdentificationEntry(
                withNextSequentialPhoneNumber: phoneNumber,
                label: label
            )
        }

        NSLog("CallDirectoryHandler: loaded \\(sorted.count) identification entries")
    }

    // MARK: - CXCallDirectoryExtensionContextDelegate

    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext,
                       withError error: Error) {
        NSLog("CallDirectoryHandler: request failed — \\(error.localizedDescription)")
    }
}
`;

const INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>0Trace Caller ID</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.callkit.call-directory</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).CallDirectoryHandler</string>
    </dict>
</dict>
</plist>
`;

const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>__APP_GROUP_ID__</string>
    </array>
</dict>
</plist>
`;

export default withCallDirectory;
