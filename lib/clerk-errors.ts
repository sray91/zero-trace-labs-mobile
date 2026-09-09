/**
 * Maps Clerk API errors to user-friendly, actionable messages.
 *
 * Why this exists: the production Clerk instance has
 *  - compromised-password rejection (HIBP) enabled on sign-up AND sign-in
 *  - bot/CAPTCHA protection enabled ("smart" widget)
 * Raw Clerk messages for these read like app bugs to users (and to App Review —
 * the app was rejected under Guideline 2.1 when a reviewer's weak test password
 * was rejected at sign-up). Mapping them to clear guidance makes it obvious the
 * app is working as intended and tells the user what to do next.
 */
export function clerkErrorMessage(err: any, fallback: string): string {
  const e = err?.errors?.[0];

  if (!e) {
    // No Clerk error payload — likely a connectivity problem.
    if (
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('Failed to fetch')
    ) {
      return 'Unable to reach the server. Please check your internet connection and try again.';
    }
    return fallback;
  }

  switch (e.code) {
    // HIBP compromised-password rejection (enabled on this instance)
    case 'form_password_pwned':
      return (
        'For your security, this password can’t be used because it has appeared ' +
        'in an online data breach. This is a safety feature, not an error — ' +
        'please choose a different, unique password.'
      );

    case 'form_identifier_exists':
      return 'An account with this email already exists. Try signing in instead.';

    case 'form_password_length_too_short':
      return 'Your password is too short. Please use at least 8 characters.';

    case 'form_param_format_invalid':
    case 'form_identifier_not_found':
      return e.meta?.paramName === 'email_address'
        ? 'Please enter a valid email address.'
        : e.longMessage || e.message || fallback;

    case 'form_password_incorrect':
      return 'Incorrect email or password. Please try again.';

    // Bot-protection failures (Apple review traffic can trip these)
    case 'captcha_invalid':
    case 'captcha_unavailable':
    case 'captcha_not_enabled':
      return 'We couldn’t verify your request. Please wait a moment and try again.';

    case 'too_many_requests':
      return 'Too many attempts. Please wait a minute and try again.';

    case 'verification_expired':
      return 'That verification code has expired. Please request a new one.';

    case 'form_code_incorrect':
      return 'That verification code is incorrect. Please check the code and try again.';

    default:
      return e.longMessage || e.message || fallback;
  }
}
