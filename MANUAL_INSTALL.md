# Custom Restreamer - Manual Installation Guide

## 🚀 Complete Manual Installation (Step by Step)

### **Prerequisites Check**
```bash
# Check if you have sudo access
sudo whoami

# Check if git is installed
git --version

# Check if curl is installed
curl --version
```

### **Step 1: Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

### **Step 2: Install Required Packages**
```bash
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### **Step 3: Install Docker**
```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
sudo apt update

# Install Docker Engine
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### **Step 4: Install Docker Compose**
```bash
# Get latest version
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

# Download and install
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **Step 5: Install Certbot**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### **Step 6: Install Nginx with RTMP Module**
```bash
# Add Nginx repository
sudo add-apt-repository -y ppa:nginx/development

# Update package index
sudo apt update

# Install Nginx with RTMP module
sudo apt install -y nginx libnginx-mod-rtmp
```

### **Step 7: Install Node.js**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### **Step 8: Configure Firewall**
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1935
sudo ufw --force enable
```

### **Step 9: Create Directories**
```bash
sudo mkdir -p /var/www/hls
sudo chown -R $USER:$USER /var/www/hls
sudo chmod -R 755 /var/www/hls
```

### **Step 10: Clone Repository**
```bash
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer
```

### **Step 11: Logout and Login Again**
```bash
# This is required for Docker group changes
logout
# (login again)
```

### **Step 12: Navigate Back to Project**
```bash
cd custom-restreamer
```

### **Step 13: Create Environment File**
```bash
cp env.example .env

# Generate random secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Update .env with generated secrets
sed -i.bak "s/your-secret-key/$WEBHOOK_SECRET/g" .env
sed -i.bak "s/your-jwt-secret/$JWT_SECRET/g" .env
```

### **Step 14: Start Services**
```bash
# Start all services
docker-compose up -d --build

# Wait for services to start
sleep 30

# Check status
docker-compose ps
```

### **Step 15: Setup Database**
```bash
# Wait for database to be ready
until docker-compose exec postgres pg_isready -U postgres; do
    echo "Waiting for database..."
    sleep 2
done

# Run database migrations
docker-compose exec backend npx prisma db push
```

### **Step 16: Create Admin User**
```bash
# Create default admin user
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created: admin@example.com / admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
"
```

### **Step 17: Verify Installation**
```bash
# Check if services are running
docker-compose ps

# Test endpoints
curl http://localhost:3000
curl http://localhost:3001/health

# View logs
docker-compose logs -f
```

## 🎉 Installation Complete!

Your Custom Restreamer is now running at:
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health**: http://localhost:3001/health

### **Admin Credentials:**
- **Email**: admin@example.com
- **Password**: admin123

### **RTMP Streaming:**
- **Server**: rtmp://localhost/live
- **Stream Key**: your-stream-slug

## 🔧 Troubleshooting

### **If Docker Commands Fail:**
```bash
# Check if user is in docker group
groups $USER

# If not, add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### **If Services Won't Start:**
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### **If Database Connection Fails:**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

## 📊 Management Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and restart
docker-compose up -d --build
```

---

**Happy Streaming! 🎥**
