# Collaborative Kanban Board

A real-time collaborative Kanban board application built with React, Node.js, WebSockets, and Supabase.

## Features

### Core Features ✅
- **Board & Column Management**: Create boards, add columns, reorder columns
- **Card CRUD & Assignment**: Create/update/delete cards with title, description, assignee, labels, due date
- **Real-Time Sync**: Live updates via WebSockets for all board changes
- **Presence & Typing Indicators**: Show online users and real-time collaboration
- **Optimistic UI & Conflict Handling**: Client-side optimistic updates with server reconciliation
- **Notifications**: In-app notifications for card assignments and board changes
- **Audit Log**: Complete audit trail of all board events
- **Unique Board Codes**: 8-character codes for easy board sharing

### Technical Features ✅
- **WebSocket Communication**: Real-time updates and presence tracking
- **Redis Integration**: Presence tracking and ephemeral locks
- **Database**: Supabase PostgreSQL with Sequelize ORM
- **Email Notifications**: SendGrid integration for card assignments
- **Docker Deployment**: Single container deployment ready for Render.com
- **CI/CD**: GitHub Actions for automated build and deploy

## Tech Stack

- **Frontend**: React.js + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSockets (ws library)
- **Cache**: Redis (Upstash)
- **Email**: SendGrid
- **Deployment**: Docker + Render.com

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase)
- Redis instance (Upstash)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaborative-kanban
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp env.example backend/.env
   
   # Edit backend/.env with your credentials
   DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
   REDIS_URL=redis://your-redis-url
   SENDGRID_API_KEY=your-sendgrid-key
   JWT_SECRET=your-jwt-secret
   ```

4. **Set up the database**
   ```bash
   cd backend
   npm run db:sync
   npm run db:migrate
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

## Production Deployment

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t kanban-app .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:8080 \
     -e DATABASE_URL="your-database-url" \
     -e REDIS_URL="your-redis-url" \
     -e JWT_SECRET="your-jwt-secret" \
     kanban-app
   ```

### Deploy to Render.com

1. **Connect your GitHub repository to Render**
2. **Set environment variables in Render dashboard**
3. **Deploy using the Dockerfile**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `POST /api/boards/join/:code` - Join board by code

### Cards
- `GET /api/cards` - Get cards (with filters)
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `POST /api/cards/:id/move` - Move card between columns
- `DELETE /api/cards/:id` - Delete card

### WebSocket
- `ws://localhost:8080/ws` - WebSocket connection for real-time updates

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `PORT` | Server port | No (default: 8080) |
| `REDIS_URL` | Redis connection string | No |
| `SENDGRID_API_KEY` | SendGrid API key for emails | No |
| `SENDGRID_FROM_EMAIL` | From email address | No |
| `FRONTEND_URL` | Frontend URL for email links | No |
| `DB_SSL` | Enable SSL for database | No (default: false) |

## Real-time Features

### WebSocket Events

**Client to Server:**
- `join` - Join a board
- `typing` - Typing indicator
- `card_moved` - Card movement
- `card_updated` - Card updates
- `column_updated` - Column updates
- `board_updated` - Board updates

**Server to Client:**
- `presence` - User presence updates
- `card_update` - Card changes
- `column_update` - Column changes
- `board_update` - Board changes
- `notify` - Notifications

### Presence Tracking
- Real-time user presence on boards
- Online/offline status
- User activity indicators

## Database Schema

### Tables
- `users` - User accounts
- `boards` - Kanban boards with unique join codes
- `columns` - Board columns
- `cards` - Task cards with assignments
- `notifications` - In-app notifications
- `audit_logs` - Event audit trail

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the GitHub repository.