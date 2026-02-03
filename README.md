# Sunrise International School - Backend API

Backend API for the Sunrise International School management system.

## Features
- JWT-based authentication
- User management (Admin, Teacher, Staff roles)
- School data synchronization
- MongoDB database storage
- CORS-enabled for frontend integration

## Technology Stack
- Node.js & Express
- MongoDB & Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Setup for Local Development

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/sunrise-backend.git
cd sunrise-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` and fill in your values:
- Add your MongoDB connection string
- Generate a JWT secret (see .env.example for command)
- Set your frontend URL
- Configure admin credentials

5. Seed the admin account:
```bash
node seedAdmin.js
```

6. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (admin only after first user)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/password` - Change password (protected)

### School Data
- `GET /api/data` - Get all school data (protected)
- `POST /api/data` - Save school data (protected)

### Health Check
- `GET /api/health` - Server health check

## Deployment

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Project Structure
```
sunrise-backend/
├── models/
│   ├── User.js           # User model (authentication)
│   └── SchoolData.js     # School data model
├── routes/
│   ├── auth.js           # Authentication routes
│   └── data.js           # School data routes
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── server.js             # Express app setup
├── seedAdmin.js          # Admin account seeding script
├── package.json          # Dependencies
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | mongodb+srv://... |
| JWT_SECRET | Secret key for JWT tokens | (64-char random string) |
| JWT_EXPIRES_IN | Token expiration time | 7d |
| PORT | Server port | 5000 |
| FRONTEND_ORIGIN | Frontend URL for CORS | https://yourapp.netlify.app |
| ADMIN_EMAIL | Initial admin email | admin@school.edu |
| ADMIN_PASSWORD | Initial admin password | SecurePass123! |
| ADMIN_NAME | Initial admin name | Administrator |

## Security Notes
- Never commit `.env` file to version control
- Change default admin password after first login
- Use strong, random JWT_SECRET in production
- Keep MongoDB connection string secure
- Enable MongoDB Atlas IP whitelist for production

## License
Private - Sunrise International School

## Support
For issues and questions, contact the development team.
