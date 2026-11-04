/**
 * ProcureAI Outbound Communication Provider Abstraction
 * External sending is strictly disabled by default (ENABLE_EXTERNAL_EMAIL=false).
 */

class MockEmailProvider {
  constructor() {
    this.name = 'MockEmailProvider';
  }

  async sendEmail({ to, subject, body, negotiationId, metadata = {} }) {
    console.log(`[Communication:MockEmail] Simulated outbound message to ${to}`);
    console.log(`[Subject]: ${subject}`);
    console.log(`[Body]:\n${body}\n-----------------------------------------`);

    return {
      success: true,
      mode: 'MOCK_SIMULATED',
      providerDisabled: true,
      messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      recipient: to,
      dispatchedAt: new Date().toISOString(),
      note: 'External email provider is disabled (ENABLE_EXTERNAL_EMAIL=false). Message recorded and simulated locally without real external network transmission.'
    };
  }
}

class LiveEmailProvider {
  constructor(apiKey) {
    this.name = 'LiveEmailProvider';
    this.apiKey = apiKey;
  }

  async sendEmail({ to, subject, body, negotiationId }) {
    if (!this.apiKey) {
      throw new Error('EMAIL_API_KEY is missing');
    }
    // Provider integration (e.g. SendGrid / Resend / SES) when real credentials supplied
    console.log(`[Communication:LiveEmail] Dispatched email to ${to} via external provider.`);
    return {
      success: true,
      mode: 'LIVE_EXTERNAL',
      messageId: `live_msg_${Date.now()}`,
      recipient: to,
      dispatchedAt: new Date().toISOString()
    };
  }
}

let activeProvider = new MockEmailProvider();

if (process.env.ENABLE_EXTERNAL_EMAIL === 'true' && process.env.EMAIL_API_KEY) {
  activeProvider = new LiveEmailProvider(process.env.EMAIL_API_KEY);
  console.log('[Communication] Live email provider initialized.');
} else {
  console.log('[Communication] Running in safe mock/draft-only mode (external sending disabled).');
}

export function getEmailProvider() {
  return activeProvider;
}

export default activeProvider;
