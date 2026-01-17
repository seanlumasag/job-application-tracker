# Architecture Overview

## System Architecture

This full stack application follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
│              React + TypeScript + Vite               │
│                                                       │
│  ┌──────────────┐  ┌───────────┐ │
│  │ API Service  │  │Components │ │
│  │   (Axios)    │  │   (UI)    │ │
│  └──────────────┘  └───────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP/REST
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Backend Layer                      │
│                Spring Boot + Java                    │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Controllers  │→ │   Services   │→ │Repository │ │
│  │  (REST API)  │  │ (Business)   │  │   (JPA)   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ JDBC
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Database Layer                     │
│               Supabase PostgreSQL Database           │
│                                                       │
│  ┌──────────────┐ │
│  │   Tables     │ │
│  │  (Storage)   │ │
│  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React + TypeScript)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Axios for HTTP requests

**Key Components:**
1. **App.tsx** - Main application component
2. **ItemList.tsx** - CRUD operations for items
3. **Services Layer:**
   - `itemService.ts` - REST API calls to backend
4. **Library Configuration:**
   - `apiClient.ts` - Axios HTTP client configuration

**Data Flow:**
```
User Action → Component → Service → API Client → Backend
                    ↓
          State Update (React)
                    ↓
            UI Re-render
```

### Backend (Spring Boot)

**Technology Stack:**
- Spring Boot 3.2.1
- Spring Data JPA
- PostgreSQL Driver
- Maven for dependency management

**Architecture Layers:**

1. **Controller Layer** (`@RestController`)
   - `HealthController` - Health check endpoint
   - `ItemController` - RESTful CRUD endpoints for items
   - Handles HTTP requests and responses
   - Input validation

2. **Service Layer** (`@Service`)
   - `ItemService` - Business logic for item operations
   - Transaction management
   - Data transformation

3. **Repository Layer** (`@Repository`)
   - `ItemRepository` - JPA data access
   - Automatic query generation
   - Database abstraction

4. **Model Layer** (`@Entity`)
   - `Item` - Entity mapped to database table
   - JPA annotations for ORM
   - Automatic timestamp management

5. **Configuration Layer** (`@Configuration`)
   - `CorsConfig` - CORS policy for frontend communication

**Request Flow:**
```
HTTP Request → Controller → Service → Repository → Database
                                            ↓
                                    Entity Mapping
                                            ↓
                      HTTP Response ← Service ← Repository
```

### Database (Supabase PostgreSQL)

**Features Used:**
1. **PostgreSQL Database** - Relational data storage
2. **Connection Pooling** - Optimized connections

**Schema:**
```sql
-- Items table (auto-created by JPA)
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

```

## API Endpoints

### Health Check
```
GET /api/health
Response: { "status": "UP", "message": "Backend is running" }
```

### Items CRUD
```
GET    /api/items       - List all items
GET    /api/items/{id}  - Get single item
POST   /api/items       - Create item
PUT    /api/items/{id}  - Update item
DELETE /api/items/{id}  - Delete item
```

## Security

### Frontend Security
- Environment variables for configuration

### Backend Security
- CORS configuration for allowed origins
- Spring Security (can be enhanced)
- Input validation with Bean Validation
- Connection pooling

### Database Security
- SSL connections
- Prepared statements (SQL injection prevention)

## Environment Configuration

### Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Database: Supabase cloud instance

### Environment Variables
**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:8080/api
```

**Backend (.env):**
```
SUPABASE_DB_URL=jdbc:postgresql://...
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-password
```

## Deployment Options

### Option 1: Separate Hosting
- **Frontend:** Vercel, Netlify, or AWS S3 + CloudFront
- **Backend:** Heroku, AWS Elastic Beanstalk, or Google Cloud Run
- **Database:** Supabase (managed)

### Option 2: Container Deployment
- Docker containers for frontend and backend
- Docker Compose for local development
- Kubernetes for production orchestration

### Option 3: Platform as a Service
- Deploy both on Railway, Render, or Fly.io
- Simplified deployment with git push
- Automatic scaling

## Performance Considerations

### Frontend
- Code splitting with Vite
- Lazy loading components
- React memoization
- Asset optimization

### Backend
- Connection pooling
- JPA query optimization
- Caching (can be added with Redis)
- Async operations

### Database
- Indexed columns
- Connection pooling
- Query optimization
- Supabase edge functions

## Scalability

### Horizontal Scaling
- Frontend: CDN distribution
- Backend: Multiple instances behind load balancer
- Database: Supabase handles scaling

### Vertical Scaling
- Increase server resources as needed
- Database plan upgrades

## Monitoring & Logging

### Frontend
- Browser console
- Error boundary components
- Analytics integration (optional)

### Backend
- Spring Boot Actuator (can be added)
- Application logs
- Metrics collection

### Database
- Supabase dashboard
- Query performance monitoring
- Connection pool metrics

## Future Enhancements

1. **Authentication Improvements**
   - Social login (Google, GitHub)
   - Password reset functionality
   - Email verification

2. **Advanced Features**
   - Real-time updates with Supabase subscriptions
   - File uploads with Supabase Storage
   - Advanced search and filtering

3. **DevOps**
   - CI/CD pipeline
   - Automated testing
   - Infrastructure as Code

4. **Performance**
   - Redis caching layer
   - Database query optimization
   - CDN integration

5. **Security**
   - Rate limiting
   - API versioning
   - Enhanced input validation
