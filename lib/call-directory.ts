/**
 * Bridge between the React Native app and the iOS Call Directory extension.
 *
 * The app writes a JSON file of { phoneNumber: label } entries to the shared
 * App Group container. The extension reads this file when iOS asks it to
 * identify incoming calls.
 *
 * The extension must be manually enabled by the user in:
 *   Settings → Phone → Call Blocking & Identification → 0Trace Caller ID
 *
 * After enabling, iOS calls the extension's beginRequest() which reads the
 * shared container. The app should call `reloadExtension()` after updating
 * the data file so iOS re-reads it.
 */

import { Platform, NativeModules } from 'react-native';

// The native module is only available on iOS builds that include the
// CallDirectoryExtension target (produced by the config plugin).
// On Android / web this module is a no-op.
const { CallDirectoryBridge } = NativeModules;

const APP_GROUP_ID = 'group.com.zerotracelabs.app.callerid';

export interface CallerLabel {
  /** E.164 format: +1XXXXXXXXXX */
  phoneNumber: string;
  /** Display label shown on incoming call screen */
  label: string;
}

/**
 * Write caller labels to the shared App Group container.
 * Labels must be sorted by phone number ascending (CallKit requirement).
 */
export async function writeCallerLabels(labels: CallerLabel[]): Promise<void> {
  if (Platform.OS !== 'ios' || !CallDirectoryBridge) return;

  // Sort by phone number ascending (CallKit requirement)
  const sorted = [...labels].sort((a, b) =>
    a.phoneNumber.localeCompare(b.phoneNumber, undefined, { numeric: true })
  );

  // Convert to the { number: label } format the extension expects
  const record: Record<string, string> = {};
  for (const entry of sorted) {
    record[entry.phoneNumber] = entry.label;
  }

  await CallDirectoryBridge.writeCallerLabels(
    APP_GROUP_ID,
    'caller_labels.json',
    JSON.stringify(record)
  );
}

/**
 * Ask iOS to reload the Call Directory extension.
 * Call this after writing new labels so the extension picks them up.
 */
export async function reloadExtension(): Promise<void> {
  if (Platform.OS !== 'ios' || !CallDirectoryBridge) return;
  await CallDirectoryBridge.reloadExtension();
}

/**
 * Check whether the user has enabled the extension in Settings.
 * Returns true if enabled, false otherwise.
 */
export async function isExtensionEnabled(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !CallDirectoryBridge) return false;
  return await CallDirectoryBridge.isExtensionEnabled();
}

/**
 * Convenience: write labels from the user's tracked phone lookups.
 * Formats each lookup into a caller label and writes them all.
 */
export function formatLookupAsLabel(
  normalizedNumber: string,
  context?: string,
  notes?: string
): CallerLabel {
  const e164 = normalizedNumber.length === 10
    ? `+1${normalizedNumber}`
    : `+${normalizedNumber}`;

  let label = '0Trace: Unknown';
  if (context === 'texted_me') label = '0Trace: Texted You';
  else if (context === 'called_me') label = '0Trace: Called You';
  else if (context === 'found_online') label = '0Trace: Found Online';

  if (notes && notes.length > 0) {
    // Truncate notes for the caller ID label (iOS truncates at ~40 chars)
    const short = notes.length > 30 ? notes.slice(0, 30) + '…' : notes;
    label = `${label} — ${short}`;
  }

  return { phoneNumber: e164, label };
}
