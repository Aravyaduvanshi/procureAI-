/**
 * ProcureAI Outbound Communication Provider Abstraction
 * Supports Live Providers (Resend, SendGrid, SMTP) and Safe Mock Mode
 */

class MockEmailProvider {
  constructor() {
    this.name = 'MockEmailProvider';
    this.mode = 'MOCK_SIMULATED';
  }

  async sendEmail({ to, subject, body, negotiationId }) {
    console.log(`[EMAIL] Simulated outbound message to ${to} (negotiation: ${negotiationId})`);
    console.log(`[EMAIL:Subject] ${subject}`);
    console.log(`[EMAIL:Body] ${body.slice(0, 150)}...`);

    const messageId = `msg_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      success: true,
      mode: 'MOCK_SIMULATED',
      providerDisabled: true,
      messageId,
      recipient: to,
      dispatchedAt: new Date().toISOString()
    };
  }
}

class ResendEmailProvider {
  constructor(apiKey, fromAddress) {
    this.name = 'ResendEmailProvider';
    this.apiKey = apiKey;
    this.fromAddress = fromAddress || 'procureai@resend.dev';
    this.mode = 'LIVE_RESEND';
  }

  async sendEmail({ to, subject, body, negotiationId }) {
    if (!this.apiKey) {
      throw new Error('Resend EMAIL_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [to],
        subject: `[${negotiationId}] ${subject}`,
        text: body
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    console.log(`[EMAIL:Resend] Email dispatched to ${to}. Resend ID: ${result.id}`);

    return {
      success: true,
      mode: 'LIVE_RESEND',
      messageId: result.id,
      recipient: to,
      dispatchedAt: new Date().toISOString()
    };
  }
}

class SendGridEmailProvider {
  constructor(apiKey, fromAddress) {
    this.name = 'SendGridEmailProvider';
    this.apiKey = apiKey;
    this.fromAddress = fromAddress || 'procurement@procureai.example.com';
    this.mode = 'LIVE_SENDGRID';
  }

  async sendEmail({ to, subject, body, negotiationId }) {
    if (!this.apiKey) {
      throw new Error('SendGrid EMAIL_API_KEY is not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.fromAddress },
        subject: `[${negotiationId}] ${subject}`,
        content: [{ type: 'text/plain', value: body }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SendGrid API error (${response.status}): ${errText}`);
    }

    const messageId = `sg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`[EMAIL:SendGrid] Email dispatched to ${to}`);

    return {
      success: true,
      mode: 'LIVE_SENDGRID',
      messageId,
      recipient: to,
      dispatchedAt: new Date().toISOString()
    };
  }
}

function resolveProvider() {
  const isExternal = process.env.ENABLE_EXTERNAL_EMAIL === 'true';
  const providerType = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS;

  if (isExternal && apiKey) {
    if (providerType === 'sendgrid') {
      console.log('[EMAIL] Initialized live SendGrid email provider');
      return new SendGridEmailProvider(apiKey, from);
    }
    console.log('[EMAIL] Initialized live Resend email provider');
    return new ResendEmailProvider(apiKey, from);
  }

  console.log('[EMAIL] Initialized safe Mock email provider (ENABLE_EXTERNAL_EMAIL=false)');
  return new MockEmailProvider();
}

let activeProvider = resolveProvider();

export function getEmailProvider() {
  return activeProvider;
}

export default activeProvider;
