// Public legal documents. Apple requires both to be linked from the paywall
// (Guideline 3.1.2) and from the App Store listing.
export const PRIVACY_POLICY_URL = 'https://www.0tracelabs.com/privacy-policy';
export const TERMS_OF_USE_URL = 'https://www.0tracelabs.com/terms-of-service';
// Apple's standard EULA, acceptable as Terms of Use if you don't host your own.
export const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// ---- Third-party AI disclosure (App Store Guidelines 5.1.1(i) / 5.1.2(i)) ----
// The Support chat is the only feature that sends user data to an AI service.
// This copy is what the user sees before anything is sent; keep it, the privacy
// policy and the App Review Information notes saying the same thing.
export const AI_PROVIDER = 'Anthropic, PBC';
export const AI_PRODUCT = 'Claude';

export const AI_DISCLOSURE_INTRO =
  `Our support assistant is powered by ${AI_PRODUCT}, an AI service operated by ` +
  `${AI_PROVIDER}. To answer you, we send your chat messages to Anthropic.`;

export const AI_DATA_SENT = [
  'The messages you type in this support chat',
  "The assistant's own earlier replies in this conversation",
];

export const AI_DATA_NOT_SENT = [
  'Your name, email address or postal address',
  'Your scan results or data broker listings',
  'Your subscription or payment information',
];

export const AI_DISCLOSURE_FOOTER =
  'Anthropic processes these messages to generate a reply and does not use them to ' +
  'train its models. You can decline and talk to our team instead, and you can turn ' +
  'the assistant off at any time in Settings.';
