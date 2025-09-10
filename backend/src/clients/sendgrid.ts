import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!apiKey) {
    console.log('SendGrid not configured, email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    return;
  }

  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@kanban.app',
      subject,
      html,
    };
    
    await sgMail.send(msg);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('SendGrid error:', error);
    // Don't throw error to prevent application crashes
    // Email sending is not critical for core functionality
    console.log('Email sending failed, but continuing with application flow');
  }
};

export const sendCardAssignedEmail = async (userEmail: string, userName: string, cardTitle: string, boardTitle: string) => {
  const subject = `Card Assigned: ${cardTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You've been assigned a card!</h2>
      <p>Hello ${userName},</p>
      <p>You have been assigned to the card <strong>"${cardTitle}"</strong> on the board <strong>"${boardTitle}"</strong>.</p>
      <p>Click <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #007bff;">here</a> to view the board.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification from your Kanban board.</p>
    </div>
  `;
  
  await sendEmail(userEmail, subject, html);
};

export const sendBoardInviteEmail = async (userEmail: string, userName: string, boardTitle: string, joinCode: string) => {
  const subject = `Invitation to join board: ${boardTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You're invited to collaborate!</h2>
      <p>Hello ${userName},</p>
      <p>You have been invited to collaborate on the board <strong>"${boardTitle}"</strong>.</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Join Code:</h3>
        <code style="background: #e9ecef; padding: 10px 15px; border-radius: 4px; font-size: 18px; font-weight: bold; letter-spacing: 2px;">${joinCode}</code>
      </div>
      <p>Use this code to join the board and start collaborating in real-time!</p>
      <p>Click <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #007bff;">here</a> to access the application.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated invitation from your Kanban board.</p>
    </div>
  `;
  
  await sendEmail(userEmail, subject, html);
};
