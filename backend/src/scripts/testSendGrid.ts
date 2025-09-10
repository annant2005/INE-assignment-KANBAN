import 'dotenv/config';
import { sendEmail, sendCardAssignedEmail } from '../clients/sendgrid';

(async () => {
  try {
    console.log('Testing SendGrid integration...');
    
    // Test basic email
    await sendEmail(
      'test@example.com',
      'Test Email from Kanban App',
      '<h1>Hello from Kanban!</h1><p>This is a test email to verify SendGrid integration.</p>'
    );
    
    console.log('✅ Basic email test completed');
    
    // Test card assignment email
    await sendCardAssignedEmail(
      'test@example.com',
      'Test User',
      'Test Card',
      'Test Board'
    );
    
    console.log('✅ Card assignment email test completed');
    console.log('🎉 All SendGrid tests passed!');
    
  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
  }
})();
