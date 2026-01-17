# Full Stack Application Framework

A modern full stack application framework built with **React**, **Spring Boot**, and **Supabase**.

## 🚀 Quick Start

Want to get started quickly? Check out our [Quick Start Guide](./QUICKSTART.md) to have the app running in less than 10 minutes!

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get running in under 10 minutes
- **[Architecture Overview](./ARCHITECTURE.md)** - Technical architecture and design
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Supabase Client** for authentication and real-time features
- **Axios** for API communication

### Backend
- **Spring Boot 3.2.1** with Java 17
- **Spring Data JPA** for database operations
- **PostgreSQL** driver for Supabase connection
- **Maven** for dependency management

### Database & Authentication
- **Supabase** - PostgreSQL database with built-in authentication

## Project Structure

```
dev/
├── backend/              # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/dev/backend/
│   │   │   │   ├── config/       # Configuration classes
│   │   │   │   ├── controller/   # REST controllers
│   │   │   │   ├── model/        # Entity models
│   │   │   │   ├── repository/   # JPA repositories
│   │   │   │   └── service/      # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
└── frontend/             # React frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── lib/          # Library configurations
    │   ├── pages/        # Page components
    │   ├── services/     # API service layers
    │   └── types/        # TypeScript type definitions
    └── package.json
```

## Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 18+** and npm
- **Supabase Account** - [Sign up here](https://supabase.com)

## Setup Instructions

### 1. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **Project Settings > Database**
3. Note down your database connection details
4. Go to **Project Settings > API**
5. Copy your project URL and anon public key

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Supabase credentials:
   ```
   SUPABASE_DB_URL=jdbc:postgresql://db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   SUPABASE_DB_USERNAME=postgres
   SUPABASE_DB_PASSWORD=your-database-password
   ```

4. Install dependencies and run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Check backend status

### Items CRUD
- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

## Features

### Authentication
- User registration and login via Supabase Auth
- Session management
- Protected routes

### CRUD Operations
- Create, Read, Update, Delete operations for items
- Real-time updates
- RESTful API design

### Database
- PostgreSQL database through Supabase
- Automatic schema migrations with Spring Data JPA
- Connection pooling and optimization

## Building for Production

### Backend
```bash
cd backend
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
cd frontend
npm run build
```

The production build will be in the `frontend/dist` directory.

## Development

### Backend Development
- Hot reload is enabled with Spring Boot DevTools
- Run tests: `mvn test`
- Check code style: Configure with your preferred linter

### Frontend Development
- Hot Module Replacement (HMR) enabled
- Run linter: `npm run lint`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Troubleshooting

### Backend Issues
- **Connection refused**: Ensure Supabase database credentials are correct
- **Port already in use**: Change port in `application.properties`

### Frontend Issues
- **Cannot connect to backend**: Verify `VITE_API_BASE_URL` is correct
- **Supabase errors**: Check your Supabase URL and anon key

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Learn More

- **[React Documentation](https://react.dev/)**
- **[Spring Boot Documentation](https://spring.io/projects/spring-boot)**
- **[Supabase Documentation](https://supabase.com/docs)**
- **[Vite Documentation](https://vitejs.dev/)**
- **[TypeScript Documentation](https://www.typescriptlang.org/)**

## Project Structure

```
dev/
├── backend/              # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/     # Java source code
│   │   │   └── resources/ # Configuration
│   │   └── test/         # Tests
│   └── pom.xml           # Maven config
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── package.json      # npm config
│
├── QUICKSTART.md         # Quick start guide
├── ARCHITECTURE.md       # Architecture docs
└── DEPLOYMENT.md         # Deployment guide
```

## Support

For detailed information:
- Setup issues: See [QUICKSTART.md](./QUICKSTART.md)
- Architecture questions: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- Deployment help: See [DEPLOYMENT.md](./DEPLOYMENT.md)