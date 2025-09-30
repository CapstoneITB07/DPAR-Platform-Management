# 🐳 DPAR Platform Docker Setup

## 🚀 **Quick Start (3 Steps)**

### **Step 1: Install Docker Desktop**

- Download: https://www.docker.com/products/docker-desktop/
- Install and restart your computer

### **Step 2: Run Setup**

```bash
# Double-click this file:
setup-docker.bat
```

### **Step 3: Access Your App**

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

---

## 📁 **Files You Need**

### **Essential Files:**

- ✅ `docker-compose.yml` - Main configuration
- ✅ `setup-docker.bat` - Setup script
- ✅ `backend/Dockerfile` - Laravel container
- ✅ `frontend/Dockerfile` - React container
- ✅ `nginx/nginx.conf` - Web server

### **What the Setup Script Does:**

1. Creates correct `.env` file for Docker
2. Builds all containers (PHP, Node.js, MySQL, Redis)
3. Starts everything automatically
4. Sets up database with your data
5. Configures permissions

---

## 🛠️ **Useful Commands**

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart everything
docker-compose restart
```

---

## 🆘 **Troubleshooting**

### **Port Already in Use:**

```bash
# Check what's using port 3000 or 8000
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

### **Database Issues:**

```bash
# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### **Permission Issues:**

```bash
# Fix Laravel permissions
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 755 /var/www/html/storage
```

---

## 🎯 **That's It!**

Just install Docker Desktop and run `setup-docker.bat`. Everything else is handled automatically! 🚀
