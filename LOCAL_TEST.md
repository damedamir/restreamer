# Local Testing Guide

## 🧪 Test the App Locally

### **Quick Local Test (Simplified)**

Since the full Docker setup is complex, let's test the core functionality locally first:

### **Option 1: Test Backend Only**

```bash
cd /Users/damirfatic/custom-restreamer/backend

# Install dependencies
npm install

# Start database (using Docker)
docker run -d --name postgres-test -e POSTGRES_PASSWORD=password -e POSTGRES_DB=custom_restreamer -p 5432:5432 postgres:16-alpine

# Wait for database
sleep 10

# Set environment
export DATABASE_URL="postgresql://postgres:password@localhost:5432/custom_restreamer"
export JWT_SECRET="test-secret"
export CORS_ORIGIN="http://localhost:3000"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Start backend
npm run dev
```

### **Option 2: Test Frontend Only**

```bash
cd /Users/damirfatic/custom-restreamer/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

### **Option 3: Full Docker Test (When Ready)**

```bash
# Use the test script
./scripts/test-local.sh
```

## 🔍 What to Test

1. **Backend API:**
   - `http://localhost:3001/health` - Should return health status
   - `http://localhost:3001/api/stream/test-stream` - Should return stream data

2. **Frontend:**
   - `http://localhost:3000` - Should show landing page
   - `http://localhost:3000/admin` - Should show admin panel

3. **Database:**
   - Check if tables are created
   - Test user registration/login

## 🐛 Troubleshooting

### **Common Issues:**

1. **Database Connection:**
   ```bash
   # Check if PostgreSQL is running
   docker ps | grep postgres
   
   # Check connection
   docker exec postgres-test pg_isready -U postgres
   ```

2. **Port Conflicts:**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   ```

3. **Dependencies:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📋 Test Checklist

- [ ] Backend starts without errors
- [ ] Database connection works
- [ ] API endpoints respond
- [ ] Frontend loads
- [ ] Admin panel accessible
- [ ] User registration works
- [ ] Stream creation works

## 🚀 Next Steps

Once local testing works:
1. Fix any issues found
2. Test with Docker Compose
3. Deploy to your server
4. Configure for your domain

---

**Happy Testing! 🎥**
