#!/bin/bash

# OmniPizza Setup Script
# Este script configura el proyecto para desarrollo local

set -e

echo "🍕 OmniPizza Setup Script"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo "Por favor instala Docker desde: https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    echo "Por favor instala Docker Compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker y Docker Compose están instalados${NC}"
echo ""

# Option 1: Docker Compose
echo "Opción 1: Iniciar con Docker Compose (Recomendado)"
echo "---------------------------------------------------"
read -p "¿Deseas iniciar con Docker Compose? (y/n): " choice

if [ "$choice" == "y" ] || [ "$choice" == "Y" ]; then
    echo ""
    echo "🐳 Construyendo imágenes Docker..."
    docker-compose build
    
    echo ""
    echo "🚀 Iniciando servicios..."
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}✅ Servicios iniciados correctamente${NC}"
    echo ""
    echo "URLs disponibles:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/api/docs"
    echo ""
    echo "Usuarios de prueba (password: pizza123):"
    echo "  - standard_user"
    echo "  - locked_out_user"
    echo "  - problem_user"
    echo "  - performance_glitch_user"
    echo "  - error_user"
    echo ""
    echo "Para ver los logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Para detener los servicios:"
    echo "  docker-compose down"
    
    exit 0
fi

# Option 2: Local Development
echo ""
echo "Opción 2: Desarrollo Local"
echo "--------------------------"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 no está instalado${NC}"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python y Node.js están instalados${NC}"
echo ""

# Setup Backend
echo "📦 Configurando Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "  Creando entorno virtual..."
    python3 -m venv venv
fi

echo "  Activando entorno virtual..."
source venv/bin/activate || . venv/Scripts/activate

echo "  Instalando dependencias..."
pip install -r requirements.txt > /dev/null 2>&1

cd ..

# Setup Frontend
echo ""
echo "📦 Configurando Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias..."
    npm install > /dev/null 2>&1
fi

cd ..

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "Para iniciar los servicios:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "URLs disponibles:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
