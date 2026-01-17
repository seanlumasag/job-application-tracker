# Deployment Guide

This guide provides step-by-step instructions for deploying the full stack application to production.

## Prerequisites

Before deploying, ensure you have:
- ✅ Supabase account and project configured
- ✅ Backend successfully builds locally (`mvn clean package`)
- ✅ Frontend successfully builds locally (`npm run build`)
- ✅ Environment variables ready for production

## Quick Deployment Options

### Option 1: Deploy to Render (Recommended for Beginners)

#### Backend Deployment

1. **Prepare Backend**
   ```bash
   cd backend
   mvn clean package
   ```

2. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect to your repository
   - **Build Command:** `cd backend && mvn clean package`
   - **Start Command:** `cd backend && java -jar target/backend-0.0.1-SNAPSHOT.jar`
   - **Environment:** Java 17

4. **Add Environment Variables**
   ```
   SUPABASE_DB_URL=jdbc:postgresql://...
   SUPABASE_DB_USERNAME=postgres
   SUPABASE_DB_PASSWORD=your-password
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://your-app.onrender.com`)

#### Frontend Deployment

1. **Update Frontend Config**
   ```bash
   cd frontend
   ```

2. **Create `.env.production`**
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Deploy to Render**
   - Click "New +" → "Static Site"
   - Connect to your repository
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - Add environment variables
   - Click "Create Static Site"

### Option 2: Deploy to Vercel (Frontend) + Railway (Backend)

#### Backend on Railway

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Root Directory: `/backend`
   - Build Command: `mvn clean package`
   - Start Command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`

4. **Add Environment Variables**
   ```
   SUPABASE_DB_URL=jdbc:postgresql://...
   SUPABASE_DB_USERNAME=postgres
   SUPABASE_DB_PASSWORD=your-password
   ```

5. **Generate Domain**
   - Go to Settings → Networking
   - Generate public domain
   - Note the URL

#### Frontend on Vercel

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Sign up at [vercel.com](https://vercel.com)**

3. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Framework Preset: Vite
   - Root Directory: `frontend`

4. **Configure Build**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Add Environment Variables**
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-backend.up.railway.app/api
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - Visit your live site

### Option 3: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Config** (`frontend/nginx.conf`):
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SUPABASE_DB_URL=${SUPABASE_DB_URL}
      - SUPABASE_DB_USERNAME=${SUPABASE_DB_USERNAME}
      - SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD}
    restart: unless-stopped

  frontend:
    build: 
      context: ./frontend
      args:
        - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
        - VITE_API_BASE_URL=http://localhost:8080/api
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**Deploy with Docker Compose:**
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Post-Deployment Checklist

### Backend
- [ ] Health endpoint accessible: `https://your-backend.com/api/health`
- [ ] CORS configured for frontend domain
- [ ] Database connection working
- [ ] Environment variables set correctly
- [ ] Logs showing no errors

### Frontend
- [ ] Application loads without errors
- [ ] Can connect to backend API
- [ ] Supabase authentication works
- [ ] All features functional
- [ ] Console shows no errors

### Database
- [ ] Connection from backend works
- [ ] Tables created automatically
- [ ] Supabase dashboard accessible
- [ ] Authentication system working

## Testing Production Deployment

1. **Test Authentication**
   - Sign up with a new account
   - Log in with credentials
   - Log out

2. **Test CRUD Operations**
   - Create new items
   - View items list
   - Update existing items
   - Delete items

3. **Test API Directly**
   ```bash
   # Health check
   curl https://your-backend.com/api/health

   # Get items (requires authentication)
   curl https://your-backend.com/api/items
   ```

## Monitoring

### Backend Monitoring
- Check application logs regularly
- Monitor response times
- Track error rates
- Monitor database connections

### Frontend Monitoring
- Browser console for errors
- Network tab for API calls
- Check loading times

### Database Monitoring
- Supabase dashboard
- Query performance
- Connection pool usage

## Troubleshooting

### Common Issues

#### Backend won't start
```
Error: Connection refused to database

Solution:
1. Check SUPABASE_DB_URL is correct
2. Verify database password
3. Ensure IP whitelist allows your server
4. Check Supabase project is active
```

#### Frontend can't connect to backend
```
Error: CORS policy blocked

Solution:
1. Add frontend domain to CORS config
2. Update CorsConfig.java allowedOrigins
3. Redeploy backend
```

#### Authentication not working
```
Error: Invalid API key

Solution:
1. Verify VITE_SUPABASE_ANON_KEY is correct
2. Check Supabase project settings
3. Ensure environment variables are set
```

## Rollback Plan

If deployment fails:

1. **Revert to previous version**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Keep old version running**
   - Most platforms support multiple versions
   - Switch traffic back to old version

3. **Database backup**
   - Supabase provides automatic backups
   - Can restore from Supabase dashboard

## Scaling Considerations

### When to Scale

- Response times > 500ms
- CPU usage > 70%
- Memory usage > 80%
- Error rate > 1%

### How to Scale

**Horizontal Scaling:**
- Add more backend instances
- Use load balancer
- Scale Supabase plan

**Vertical Scaling:**
- Increase server resources
- Upgrade hosting plan
- Optimize database queries

## Security Best Practices

1. **Use HTTPS**
   - Enable SSL certificates
   - Force HTTPS redirects

2. **Environment Variables**
   - Never commit secrets
   - Use platform secret management

3. **Database**
   - Regular backups
   - Keep credentials secure
   - Use strong passwords

4. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Apply patches promptly

## Cost Optimization

### Free Tiers
- **Supabase:** 500MB database, 2GB bandwidth
- **Vercel:** 100GB bandwidth, unlimited sites
- **Render:** 750 hours/month free
- **Railway:** $5 credit/month

### Paid Plans
- Start with basic plans
- Scale as needed
- Monitor usage
- Set up billing alerts

## Support

If you encounter issues:
1. Check application logs
2. Review environment variables
3. Verify Supabase configuration
4. Check platform documentation
5. Review ARCHITECTURE.md for system details

## Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Add performance monitoring
5. Set up error tracking (Sentry, LogRocket)
