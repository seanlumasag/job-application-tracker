# Backend README

## Running the Backend

### Development Mode
```bash
mvn spring-boot:run
```

### Build and Run
```bash
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Run Tests
```bash
mvn test
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

- `SUPABASE_DB_URL`: Your Supabase PostgreSQL connection URL
- `SUPABASE_DB_USERNAME`: Database username (usually `postgres`)
- `SUPABASE_DB_PASSWORD`: Your database password

## API Documentation

### Health Check
- **GET** `/api/health` - Returns backend status

### Items API
- **GET** `/api/items` - Get all items
- **GET** `/api/items/{id}` - Get single item
- **POST** `/api/items` - Create new item
- **PUT** `/api/items/{id}` - Update item
- **DELETE** `/api/items/{id}` - Delete item

## Database Schema

The application will automatically create the following table on startup:

```sql
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
