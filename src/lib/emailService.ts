/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service to handle transactional email notifications and OTP codes
 * for the Fundora.one platform. Supports direct client-side delivery via EmailJS
 * using custom @fundora.one domains.
 */

interface EmailParams {
  toEmail: string;
  toName: string;
  otpCode: string;
}

// These are retrieved from environment variables (e.g., set up on Vercel or in local .env)
const EMAILJS_SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_zypd756').trim();
const EMAILJS_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_plwqmax').trim();
const EMAILJS_PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'NC4ketlqaNmI4wQgb').trim();

// Resend API (Completely free, branding-free, custom-domain transactional mail)
const RESEND_API_KEY = (import.meta.env.VITE_RESEND_API_KEY || '').trim();
const RESEND_FROM_EMAIL = (import.meta.env.VITE_RESEND_FROM_EMAIL || 'no-reply@fundora.one').trim();

/**
 * Checks if any email service (EmailJS or Resend) is properly configured
 */
export const isEmailServiceConfigured = (): boolean => {
  return !!(RESEND_API_KEY || (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY));
};

/**
 * Returns which service is currently active
 */
export const getActiveEmailService = (): 'resend' | 'emailjs' | 'none' => {
  if (RESEND_API_KEY) return 'resend';
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) return 'emailjs';
  return 'none';
};

/**
 * Sends a real OTP verification code to the registered investor.
 * Uses Resend if configured (Premium & branding-free), otherwise falls back to EmailJS.
 */
export const sendOtpEmail = async (params: EmailParams): Promise<{ success: boolean; error?: string }> => {
  const { toEmail, toName, otpCode } = params;

  if (!isEmailServiceConfigured()) {
    console.log(`[Email Service Simulation] Send OTP to ${toEmail}: Code is ${otpCode}`);
    return { 
      success: false, 
      error: 'No email service configured (Resend/EmailJS). Falling back to secure simulated verification.' 
    };
  }

  // OPTION 1: RESEND API (Zero branding, completely free with custom domains)
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail,
          toName,
          otpCode,
        }),
      });

      if (response.ok) {
        console.log(`Successfully sent branding-free premium OTP to ${toEmail} via Resend API Server Proxy`);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('Resend API Proxy failed to deliver email:', errorText);
        return { success: false, error: errorText || 'Failed to send via Resend Proxy.' };
      }
    } catch (err: any) {
      console.error('Network error during Resend proxy email dispatch:', err);
      return { success: false, error: err.message || 'Network error on Resend proxy request.' };
    }
  }

  // OPTION 2: EMAILJS FALLBACK
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          email: toEmail,
          to: toEmail,
          user_email: toEmail,
          recipient_email: toEmail,
          to_name: toName,
          name: toName,
          user_name: toName,
          otp_code: otpCode,
          otp: otpCode,
          code: otpCode,
          token: otpCode,
          password: otpCode,
          pin: otpCode,
          key: otpCode,
          verification_code: otpCode,
          one_time_password: otpCode,
          company_name: 'Fundora.one',
          companyName: 'Fundora.one',
          app_name: 'Fundora.one',
          appName: 'Fundora.one',
          project_name: 'Fundora.one',
          projectName: 'Fundora.one',
          expiry: '10 minutes',
          expiry_time: '10 minutes',
          valid_till: '10 minutes',
          valid_for: '10 minutes',
          expiration: '10 minutes',
          time: '10 minutes',
          till: '10 minutes',
          minutes: '10',
          reply_to: 'no-reply@fundora.one',
          subject: 'Your Fundora.one Verification Code'
        },
      }),
    });

    if (response.ok) {
      console.log(`Successfully dispatched real OTP code to ${toEmail} via EmailJS`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('EmailJS failed to deliver email:', errorText);
      return { success: false, error: errorText || 'Failed to send verification email.' };
    }
  } catch (err: any) {
    console.error('Network error attempting to send verification email:', err);
    return { success: false, error: err.message || 'Network communication error.' };
  }
};
