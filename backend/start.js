// Load environment variables first
import 'dotenv/config';

// Set environment variables if not already set
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Annant@1100@db.gxychcqoxelajmfggyab.supabase.co:5432/postgres';
process.env.DB_SSL = process.env.DB_SSL || 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
process.env.PORT = process.env.PORT || '8080';
// Note: SENDGRID_API_KEY should be set via environment variables in production
process.env.SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@kanban.app';

// Start the server
// Load environment variables first

// Start the server
import('./dist/server.js');
