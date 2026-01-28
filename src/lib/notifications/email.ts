/**
 * LetLog Email Notification Service
 * 
 * Sends transactional emails for all key platform events.
 * Uses Supabase Auth emails + custom templates via Resend/SendGrid.
 */

import { createClient } from "@/lib/supabase/server";

// Email types for different notifications
export type EmailType = 
  | "booking_requested"
  | "booking_confirmed"
  | "booking_cancelled"
  | "visit_scheduled"
  | "visit_reminder"
  | "visit_completed"
  | "issue_reported"
  | "issue_updated"
  | "issue_resolved"
  | "quote_received"
  | "quote_accepted"
  | "quote_rejected"
  | "document_uploaded"
  | "document_shared"
  | "compliance_expiring"
  | "compliance_expired"
  | "rent_due_reminder"
  | "rent_received"
  | "rent_overdue"
  | "tenancy_starting"
  | "tenancy_ending"
  | "tenancy_renewed"
  | "review_received"
  | "review_requested"
  | "message_received"
  | "welcome"
  | "account_deleted";

export interface NotificationPayload {
  to: string;
  toName?: string;
  type: EmailType;
  data: Record<string, any>;
}

// Email templates with subject and body generators
const emailTemplates: Record<EmailType, { 
  subject: (data: any) => string; 
  body: (data: any) => string;
}> = {
  // Booking notifications
  booking_requested: {
    subject: (d) => `New viewing request for ${d.propertyAddress}`,
    body: (d) => `
      <h2>New Viewing Request</h2>
      <p>Hi ${d.landlordName},</p>
      <p><strong>${d.tenantName}</strong> has requested a viewing at:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.propertyAddress}</strong></p>
        <p style="margin: 8px 0 0 0;">Requested date: ${d.requestedDate}</p>
      </div>
      <p><a href="${d.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Request</a></p>
    `,
  },
  booking_confirmed: {
    subject: (d) => `Viewing confirmed for ${d.propertyAddress}`,
    body: (d) => `
      <h2>Viewing Confirmed! 🎉</h2>
      <p>Hi ${d.tenantName},</p>
      <p>Your viewing has been confirmed:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.propertyAddress}</strong></p>
        <p style="margin: 8px 0 0 0;">📅 ${d.confirmedDate}</p>
        <p style="margin: 8px 0 0 0;">🕐 ${d.confirmedTime}</p>
      </div>
      <p>We'll send you a reminder 24 hours before.</p>
    `,
  },
  booking_cancelled: {
    subject: (d) => `Viewing cancelled for ${d.propertyAddress}`,
    body: (d) => `
      <h2>Viewing Cancelled</h2>
      <p>Hi ${d.recipientName},</p>
      <p>The viewing for <strong>${d.propertyAddress}</strong> on ${d.cancelledDate} has been cancelled.</p>
      ${d.reason ? `<p>Reason: ${d.reason}</p>` : ''}
      <p><a href="${d.rescheduleUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Reschedule</a></p>
    `,
  },

  // Visit notifications
  visit_scheduled: {
    subject: (d) => `Visit scheduled: ${d.visitType} at ${d.propertyAddress}`,
    body: (d) => `
      <h2>Visit Scheduled</h2>
      <p>Hi ${d.recipientName},</p>
      <p>A ${d.visitType} has been scheduled:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.propertyAddress}</strong></p>
        <p style="margin: 8px 0 0 0;">📅 ${d.visitDate} at ${d.visitTime}</p>
        <p style="margin: 8px 0 0 0;">👤 ${d.visitorName}</p>
      </div>
      <p><a href="${d.calendarUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Add to Calendar</a></p>
    `,
  },
  visit_reminder: {
    subject: (d) => `Reminder: ${d.visitType} tomorrow at ${d.propertyAddress}`,
    body: (d) => `
      <h2>Visit Reminder ⏰</h2>
      <p>Hi ${d.recipientName},</p>
      <p>Just a reminder about your ${d.visitType} tomorrow:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.propertyAddress}</strong></p>
        <p style="margin: 8px 0 0 0;">📅 ${d.visitDate} at ${d.visitTime}</p>
      </div>
    `,
  },
  visit_completed: {
    subject: (d) => `Visit completed at ${d.propertyAddress}`,
    body: (d) => `
      <h2>Visit Completed ✅</h2>
      <p>Hi ${d.recipientName},</p>
      <p>The ${d.visitType} at ${d.propertyAddress} has been marked as completed.</p>
      ${d.notes ? `<p><strong>Notes:</strong> ${d.notes}</p>` : ''}
      <p><a href="${d.detailsUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Details</a></p>
    `,
  },

  // Issue/Maintenance notifications
  issue_reported: {
    subject: (d) => `New maintenance issue: ${d.issueTitle}`,
    body: (d) => `
      <h2>New Maintenance Issue Reported</h2>
      <p>Hi ${d.landlordName},</p>
      <p><strong>${d.tenantName}</strong> has reported an issue at ${d.propertyAddress}:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.issueTitle}</strong></p>
        <p style="margin: 8px 0 0 0;">Category: ${d.category}</p>
        <p style="margin: 8px 0 0 0;">Priority: <span style="color: ${d.priority === 'urgent' ? '#dc2626' : '#f59e0b'};">${d.priority}</span></p>
        <p style="margin: 8px 0 0 0;">${d.description}</p>
      </div>
      <p><a href="${d.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Issue</a></p>
    `,
  },
  issue_updated: {
    subject: (d) => `Issue update: ${d.issueTitle}`,
    body: (d) => `
      <h2>Issue Updated</h2>
      <p>Hi ${d.recipientName},</p>
      <p>The issue "${d.issueTitle}" has been updated:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;">Status: <strong>${d.newStatus}</strong></p>
        ${d.message ? `<p style="margin: 8px 0 0 0;">${d.message}</p>` : ''}
      </div>
      <p><a href="${d.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Issue</a></p>
    `,
  },
  issue_resolved: {
    subject: (d) => `Issue resolved: ${d.issueTitle}`,
    body: (d) => `
      <h2>Issue Resolved ✅</h2>
      <p>Hi ${d.recipientName},</p>
      <p>Great news! The issue "${d.issueTitle}" at ${d.propertyAddress} has been resolved.</p>
      ${d.resolution ? `<p><strong>Resolution:</strong> ${d.resolution}</p>` : ''}
      <p><a href="${d.reviewUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Rate the Service</a></p>
    `,
  },

  // Quote notifications
  quote_received: {
    subject: (d) => `New quote received for ${d.jobTitle}`,
    body: (d) => `
      <h2>New Quote Received</h2>
      <p>Hi ${d.landlordName},</p>
      <p><strong>${d.contractorName}</strong> has submitted a quote:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.jobTitle}</strong></p>
        <p style="margin: 8px 0 0 0;">Amount: <strong>£${d.amount}</strong></p>
        <p style="margin: 8px 0 0 0;">Available from: ${d.availableFrom}</p>
        <p style="margin: 8px 0 0 0;">Rating: ⭐ ${d.contractorRating}</p>
      </div>
      <p><a href="${d.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Quote</a></p>
    `,
  },
  quote_accepted: {
    subject: (d) => `Quote accepted: ${d.jobTitle}`,
    body: (d) => `
      <h2>Quote Accepted! 🎉</h2>
      <p>Hi ${d.contractorName},</p>
      <p>Great news! Your quote for "${d.jobTitle}" has been accepted.</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;">Property: ${d.propertyAddress}</p>
        <p style="margin: 8px 0 0 0;">Amount: £${d.amount}</p>
        <p style="margin: 8px 0 0 0;">Contact: ${d.landlordName} (${d.landlordPhone})</p>
      </div>
      <p><a href="${d.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Job</a></p>
    `,
  },
  quote_rejected: {
    subject: (d) => `Quote update: ${d.jobTitle}`,
    body: (d) => `
      <h2>Quote Not Selected</h2>
      <p>Hi ${d.contractorName},</p>
      <p>Unfortunately, your quote for "${d.jobTitle}" was not selected this time.</p>
      ${d.reason ? `<p>Feedback: ${d.reason}</p>` : ''}
      <p><a href="${d.browseUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Browse More Jobs</a></p>
    `,
  },

  // Document notifications
  document_uploaded: {
    subject: (d) => `New document: ${d.documentName}`,
    body: (d) => `
      <h2>New Document Uploaded</h2>
      <p>Hi ${d.recipientName},</p>
      <p>A new document has been uploaded for ${d.propertyAddress}:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.documentName}</strong></p>
        <p style="margin: 8px 0 0 0;">Type: ${d.documentType}</p>
        <p style="margin: 8px 0 0 0;">Uploaded by: ${d.uploaderName}</p>
      </div>
      <p><a href="${d.viewUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Document</a></p>
    `,
  },
  document_shared: {
    subject: (d) => `Document shared with you: ${d.documentName}`,
    body: (d) => `
      <h2>Document Shared</h2>
      <p>Hi ${d.recipientName},</p>
      <p><strong>${d.senderName}</strong> has shared a document with you:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${d.documentName}</strong></p>
        ${d.message ? `<p style="margin: 8px 0 0 0;">"${d.message}"</p>` : ''}
      </div>
      <p><a href="${d.viewUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Document</a></p>
    `,
  },

  // Compliance notifications
  compliance_expiring: {
    subject: (d) => `⚠️ ${d.certificateType} expiring soon - ${d.propertyAddress}`,
    body: (d) => `
      <h2>Compliance Alert ⚠️</h2>
      <p>Hi ${d.landlordName},</p>
      <p>Your <strong>${d.certificateType}</strong> for ${d.propertyAddress} is expiring soon:</p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;">Expiry date: <strong>${d.expiryDate}</strong></p>
        <p style="margin: 8px 0 0 0;">Days remaining: <strong>${d.daysRemaining}</strong></p>
      </div>
      <p><a href="${d.renewUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Arrange Renewal</a></p>
    `,
  },
  compliance_expired: {
    subject: (d) => `🚨 URGENT: ${d.certificateType} expired - ${d.propertyAddress}`,
    body: (d) => `
      <h2>Compliance Expired 🚨</h2>
      <p>Hi ${d.landlordName},</p>
      <p><strong>Your ${d.certificateType} for ${d.propertyAddress} has expired!</strong></p>
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0;">Expired on: <strong>${d.expiryDate}</strong></p>
        <p style="margin: 8px 0 0 0;">Action required immediately to remain compliant.</p>
      </div>
      <p><a href="${d.renewUrl}" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Arrange Now</a></p>
    `,
  },

  // Rent notifications
  rent_due_reminder: {
    subject: (d) => `Rent reminder: Payment due ${d.dueDate}`,
    body: (d) => `
      <h2>Rent Payment Reminder</h2>
      <p>Hi ${d.tenantName},</p>
      <p>This is a friendly reminder that your rent payment is due:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;">Property: ${d.propertyAddress}</p>
        <p style="margin: 8px 0 0 0;">Amount: <strong>£${d.amount}</strong></p>
        <p style="margin: 8px 0 0 0;">Due date: <strong>${d.dueDate}</strong></p>
      </div>
      ${d.paymentUrl ? `<p><a href="${d.paymentUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Pay Now</a></p>` : ''}
    `,
  },
  rent_received: {
    subject: (d) => `Rent received: £${d.amount} from ${d.tenantName}`,
    body: (d) => `
      <h2>Rent Payment Received ✅</h2>
      <p>Hi ${d.landlordName},</p>
      <p>A rent payment has been received:</p>
      <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;">Property: ${d.propertyAddress}</p>
        <p style="margin: 8px 0 0 0;">Amount: <strong>£${d.amount}</strong></p>
        <p style="margin: 8px 0 0 0;">From: ${d.tenantName}</p>
        <p style="margin: 8px 0 0 0;">Date: ${d.paymentDate}</p>
      </div>
    `,
  },
  rent_overdue: {
    subject: (d) => `⚠️ Rent overdue: ${d.propertyAddress}`,
    body: (d) => `
      <h2>Rent Payment Overdue</h2>
      <p>Hi ${d.tenantName},</p>
      <p>Your rent payment is now overdue:</p>
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0;">Property: ${d.propertyAddress}</p>
        <p style="margin: 8px 0 0 0;">Amount due: <strong>£${d.amount}</strong></p>
        <p style="margin: 8px 0 0 0;">Was due: ${d.dueDate}</p>
        <p style="margin: 8px 0 0 0;">Days overdue: ${d.daysOverdue}</p>
      </div>
      <p>Please arrange payment as soon as possible or contact your landlord if you're experiencing difficulties.</p>
    `,
  },

  // Tenancy notifications
  tenancy_starting: {
    subject: (d) => `Tenancy starting soon: ${d.propertyAddress}`,
    body: (d) => `
      <h2>Tenancy Starting Soon 🏠</h2>
      <p>Hi ${d.recipientName},</p>
      <p>Your tenancy at ${d.propertyAddress} starts in ${d.daysUntil} days:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;">Start date: <strong>${d.startDate}</strong></p>
        <p style="margin: 8px 0 0 0;">Monthly rent: £${d.rentAmount}</p>
      </div>
      <p><a href="${d.checklistUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Move-in Checklist</a></p>
    `,
  },
  tenancy_ending: {
    subject: (d) => `Tenancy ending: ${d.propertyAddress}`,
    body: (d) => `
      <h2>Tenancy Ending Notice</h2>
      <p>Hi ${d.recipientName},</p>
      <p>The tenancy at ${d.propertyAddress} ends in ${d.daysUntil} days:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;">End date: <strong>${d.endDate}</strong></p>
      </div>
      <p><a href="${d.actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">${d.isLandlord ? 'Discuss Renewal' : 'Request Renewal'}</a></p>
    `,
  },
  tenancy_renewed: {
    subject: (d) => `Tenancy renewed: ${d.propertyAddress}`,
    body: (d) => `
      <h2>Tenancy Renewed ✅</h2>
      <p>Hi ${d.recipientName},</p>
      <p>The tenancy at ${d.propertyAddress} has been renewed:</p>
      <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;">New end date: <strong>${d.newEndDate}</strong></p>
        <p style="margin: 8px 0 0 0;">Monthly rent: £${d.rentAmount}</p>
      </div>
    `,
  },

  // Review notifications
  review_received: {
    subject: (d) => `New review received: ${d.rating}⭐`,
    body: (d) => `
      <h2>New Review Received</h2>
      <p>Hi ${d.recipientName},</p>
      <p><strong>${d.reviewerName}</strong> left you a review:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-size: 24px;">${'⭐'.repeat(d.rating)}</p>
        <p style="margin: 8px 0 0 0;">"${d.reviewText}"</p>
        <p style="margin: 8px 0 0 0; color: #666;">— ${d.reviewerName}</p>
      </div>
      <p><a href="${d.viewUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View Review</a></p>
    `,
  },
  review_requested: {
    subject: (d) => `How was your experience with ${d.contractorName}?`,
    body: (d) => `
      <h2>Leave a Review</h2>
      <p>Hi ${d.recipientName},</p>
      <p>The job "${d.jobTitle}" at ${d.propertyAddress} has been completed.</p>
      <p>How was your experience with <strong>${d.contractorName}</strong>?</p>
      <p><a href="${d.reviewUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Leave Review</a></p>
    `,
  },

  // Message notifications
  message_received: {
    subject: (d) => `New message from ${d.senderName}`,
    body: (d) => `
      <h2>New Message</h2>
      <p>Hi ${d.recipientName},</p>
      <p><strong>${d.senderName}</strong> sent you a message:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;">"${d.messagePreview}"</p>
      </div>
      <p><a href="${d.replyUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Reply</a></p>
    `,
  },

  // Account notifications
  welcome: {
    subject: () => `Welcome to LetLog! 🏠`,
    body: (d) => `
      <h2>Welcome to LetLog! 🎉</h2>
      <p>Hi ${d.name},</p>
      <p>Thanks for joining LetLog — your property management just got easier.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Manage properties and tenancies</li>
        <li>Track compliance certificates</li>
        <li>Handle maintenance requests</li>
        <li>Find verified contractors</li>
      </ul>
      <p><a href="${d.dashboardUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Get Started</a></p>
    `,
  },
  account_deleted: {
    subject: () => `Your LetLog account has been deleted`,
    body: (d) => `
      <h2>Account Deleted</h2>
      <p>Hi ${d.name},</p>
      <p>Your LetLog account has been deleted as requested. All your data has been permanently removed.</p>
      <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>
      <p>— The LetLog Team</p>
    `,
  },
};

// Base email wrapper
function wrapEmail(content: string, previewText: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LetLog</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <span style="display: none; max-height: 0; overflow: hidden;">${previewText}</span>
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; text-align: center; line-height: 48px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">L</span>
          </div>
        </div>
        
        <!-- Content -->
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} LetLog. All rights reserved.</p>
          <p>
            <a href="#" style="color: #666;">Unsubscribe</a> · 
            <a href="#" style="color: #666;">Preferences</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send an email notification
 */
export async function sendNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates[payload.type];
  if (!template) {
    return { success: false, error: `Unknown email type: ${payload.type}` };
  }

  const subject = template.subject(payload.data);
  const bodyContent = template.body(payload.data);
  const html = wrapEmail(bodyContent, subject);

  // In production, send via email service (Resend, SendGrid, etc.)
  // For now, we'll use Supabase Edge Function or log for development
  
  console.log(`📧 Email notification [${payload.type}]`, {
    to: payload.to,
    subject,
  });

  // TODO: Integrate with email service
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'LetLog <noreply@letlog.app>',
  //   to: payload.to,
  //   subject,
  //   html,
  // });

  return { success: true };
}

/**
 * Send multiple notifications (batch)
 */
export async function sendNotifications(payloads: NotificationPayload[]): Promise<void> {
  await Promise.all(payloads.map(sendNotification));
}

/**
 * Notification triggers - call these from your API routes/actions
 */
export const notify = {
  // Issue notifications
  issueReported: (data: { landlordEmail: string; landlordName: string; tenantName: string; propertyAddress: string; issueTitle: string; category: string; priority: string; description: string; actionUrl: string }) =>
    sendNotification({ to: data.landlordEmail, type: "issue_reported", data }),
  
  issueUpdated: (data: { recipientEmail: string; recipientName: string; issueTitle: string; newStatus: string; message?: string; actionUrl: string }) =>
    sendNotification({ to: data.recipientEmail, type: "issue_updated", data }),

  // Compliance notifications
  complianceExpiring: (data: { landlordEmail: string; landlordName: string; propertyAddress: string; certificateType: string; expiryDate: string; daysRemaining: number; renewUrl: string }) =>
    sendNotification({ to: data.landlordEmail, type: "compliance_expiring", data }),
  
  complianceExpired: (data: { landlordEmail: string; landlordName: string; propertyAddress: string; certificateType: string; expiryDate: string; renewUrl: string }) =>
    sendNotification({ to: data.landlordEmail, type: "compliance_expired", data }),

  // Quote notifications
  quoteReceived: (data: { landlordEmail: string; landlordName: string; contractorName: string; jobTitle: string; amount: number; availableFrom: string; contractorRating: number; actionUrl: string }) =>
    sendNotification({ to: data.landlordEmail, type: "quote_received", data }),

  // Review notifications  
  reviewReceived: (data: { recipientEmail: string; recipientName: string; reviewerName: string; rating: number; reviewText: string; viewUrl: string }) =>
    sendNotification({ to: data.recipientEmail, type: "review_received", data }),

  // Document notifications
  documentUploaded: (data: { recipientEmail: string; recipientName: string; propertyAddress: string; documentName: string; documentType: string; uploaderName: string; viewUrl: string }) =>
    sendNotification({ to: data.recipientEmail, type: "document_uploaded", data }),

  // Welcome
  welcome: (data: { email: string; name: string; dashboardUrl: string }) =>
    sendNotification({ to: data.email, type: "welcome", data }),
};
