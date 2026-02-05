interface MatchEmailParams {
  compatibilityScore: number;
  compatibilityTitle: string;
  resultsUrl: string;
  matchName?: string | null;
  matchInstagram?: string | null;
}

export function generateMatchEmail({
  compatibilityScore,
  compatibilityTitle,
  resultsUrl,
  matchName,
  matchInstagram,
}: MatchEmailParams): string {
  const matchDetails = [
    matchName
      ? `<p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; color: #2A0A0A;">${matchName}</p>`
      : "",
    matchInstagram
      ? `<p style="margin: ${matchName ? "4px" : "0"} 0 0; font-size: 14px; color: #2A0A0A; opacity: 0.6;">@${matchInstagram}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("\n              ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Platonic Alignment Match</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F8F4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9F8F4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 48px 24px;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 2px; color: #2A0A0A; opacity: 0.4; text-transform: uppercase;">
                Your Results Are In
              </p>
            </td>
          </tr>

          <!-- Main Title -->
          <tr>
            <td style="padding: 0 48px;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 48px; font-style: italic; color: #2A0A0A; line-height: 1.1;">
                ${compatibilityTitle}
              </h1>
            </td>
          </tr>

          <!-- Score Badge -->
          <tr>
            <td style="padding: 24px 48px;">
              <span style="display: inline-block; padding: 8px 16px; border: 1px solid #2A0A0A; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                ${compatibilityScore}% Match
              </span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <div style="height: 1px; background-color: #EBE9E2;"></div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 32px 48px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2A0A0A;">
                We've found your platonic match. Someone out there shares your vibe, your quirks, and maybe even your coffee order.
              </p>
              ${
                matchDetails
                  ? `<div style="margin: 24px 0 0; padding: 20px; background-color: #F9F8F4;">
                <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 2px; color: #2A0A0A; opacity: 0.4; text-transform: uppercase;">Your Match</p>
                ${matchDetails}
              </div>`
                  : ""
              }
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 16px 48px 48px;">
              <a href="${resultsUrl}" style="display: block; background-color: #2A0A0A; color: #F9F8F4; text-decoration: none; padding: 20px; text-align: center; font-weight: 500; font-size: 16px;">
                See Your Match
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 48px; background-color: #F9F8F4;">
              <p style="margin: 0; font-size: 12px; color: #2A0A0A; opacity: 0.4; text-align: center;">
                Cosmic Twins Friendship Quiz
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
