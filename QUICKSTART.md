# Quick Start Guide

Get the application running locally in less than 10 minutes!

## Prerequisites

Make sure you have these installed:
- ✅ **Java 17** or higher - [Download](https://adoptium.net/)
- ✅ **Maven 3.6+** - [Download](https://maven.apache.org/download.cgi)
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **Git** - [Download](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/seanlumasag/dev.git
cd dev
```

## Step 2: Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Project Name:** dev-app (or any name)
   - **Database Password:** Choose a strong password
   - **Region:** Select closest to you
4. Wait for setup to complete (~2 minutes)

### Get Your Credentials

1. In Supabase Dashboard, go to **Settings** → **Database**
   - Copy the **Connection String** (URI format)
   - Note: Change `[YOUR-PASSWORD]` to your actual password

2. Go to **Settings** → **API**
   - Copy **Project URL**
   - Copy **anon public** key

## Step 3: Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your Supabase credentials:

```bash
# Replace with your actual values
SUPABASE_DB_URL=jdbc:postgresql://db.xxxxxxxxxxxxx.supabase.co:5432/postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-database-password
```

### Test Backend

```bash
# Install dependencies and compile
mvn clean install

# Run the backend
mvn spring-boot:run
```

You should see:
```
Started BackendApplication in X.XXX seconds
```

### Verify Backend Works

Open another terminal and test:
```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "UP",
  "message": "Backend is running"
}
```

✅ **Backend is working!**

## Step 4: Configure Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env` file:

```bash
# Replace with your Supabase credentials
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API (should work as-is for local dev)
VITE_API_BASE_URL=http://localhost:8080/api
```

### Install Dependencies

```bash
npm install
```

### Start Frontend

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Step 5: Test the Application

### Open Your Browser

Navigate to: **http://localhost:5173**

You should see the application with:
- Header: "Full Stack App - React + Spring Boot + Supabase"
- Backend Status indicator
- Authentication form

### Test Authentication

1. Click **Sign Up**
2. Enter:
   - Email: `test@example.com`
   - Password: Choose a password (min 6 characters)
3. Click **Sign Up** button

If successful, you'll see the Items management interface!

### Test CRUD Operations

1. **Create an Item:**
   - Name: "Test Item"
   - Description: "This is my first item"
   - Click **Add Item**

2. **View the Item:**
   - Should appear in the list below

3. **Edit the Item:**
   - Click **Edit** button
   - Change the name or description
   - Click **Update**

4. **Delete the Item:**
   - Click **Delete** button
   - Confirm deletion

### Test Backend API Directly

```bash
# Get all items (in another terminal)
curl http://localhost:8080/api/items

# Should return an array of items
```

## Architecture Overview

```
Browser (localhost:5173)
    ↓
React Frontend
    ↓
Spring Boot Backend (localhost:8080)
    ↓
Supabase PostgreSQL Database
```

## Common Issues & Solutions

### Issue: Backend won't start

**Error:** `Connection refused to database`

**Solution:**
1. Check your `.env` file in the backend folder
2. Verify Supabase credentials are correct
3. Make sure Supabase project is running (check dashboard)
4. Ensure your IP is allowed (Supabase → Settings → Database → Connection pooling)

### Issue: Frontend can't connect to backend

**Error:** `Backend not connected` or CORS error

**Solution:**
1. Make sure backend is running on port 8080
2. Check `VITE_API_BASE_URL` in frontend/.env
3. Restart both backend and frontend

### Issue: Authentication not working

**Error:** `Invalid API key` or authentication fails

**Solution:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Check `VITE_SUPABASE_ANON_KEY` is the anon public key
3. Ensure Supabase project is active
4. Check browser console for specific errors

### Issue: Port already in use

**Error:** `Port 8080 already in use`

**Solution:**
```bash
# Find and kill the process (Linux/Mac)
lsof -ti:8080 | xargs kill -9

# Or change port in backend/src/main/resources/application.properties
server.port=8081
```

## Development Workflow

### Making Changes to Backend

1. Make your code changes
2. Backend auto-reloads with Spring Boot DevTools
3. If it doesn't reload, restart: `mvn spring-boot:run`

### Making Changes to Frontend

1. Make your code changes
2. Frontend auto-reloads with Vite HMR
3. Check browser console for errors

### Adding New Dependencies

**Backend:**
```bash
# Add to pom.xml, then:
mvn clean install
```

**Frontend:**
```bash
npm install <package-name>
```

## Project Structure

```
dev/
├── backend/              # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/     # Java source code
│   │   │   └── resources/ # Configuration files
│   │   └── test/         # Tests
│   └── pom.xml           # Maven configuration
│
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── package.json      # npm configuration
│
├── README.md             # Main documentation
├── ARCHITECTURE.md       # Technical architecture
└── DEPLOYMENT.md         # Deployment guide
```

## Next Steps

Now that you have the app running:

1. **Read the Documentation**
   - [README.md](./README.md) - Complete setup guide
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

2. **Explore the Code**
   - Check out the backend controllers
   - Look at React components
   - Understand the service layer

3. **Customize It**
   - Add new features
   - Modify the UI
   - Extend the API

4. **Deploy It**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Choose a hosting platform
   - Make it live!

## Useful Commands

### Backend
```bash
# Build
mvn clean package

# Run
mvn spring-boot:run

# Run tests
mvn test

# Clean build artifacts
mvn clean
```

### Frontend
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Getting Help

- Check the [README.md](./README.md) for detailed setup
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Check Supabase documentation
- Review Spring Boot documentation
- Look at React documentation

## Success Checklist

- [x] ✅ Backend running on port 8080
- [x] ✅ Frontend running on port 5173
- [x] ✅ Can sign up and log in
- [x] ✅ Can create items
- [x] ✅ Can edit items
- [x] ✅ Can delete items
- [x] ✅ Backend status shows "running"

**Congratulations! Your full stack app is running! 🎉**
