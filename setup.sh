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

# Check if Docker Compose is installed.
# Docker moderno solo trae el plugin v2 ("docker compose"); el binario
# standalone v1 ("docker-compose") sigue siendo válido si está presente.
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    echo "Instala el plugin v2 (incluido en Docker Desktop y en docker-compose-plugin)"
    echo "o el binario standalone docker-compose."
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
    $DOCKER_COMPOSE build

    echo ""
    echo "🚀 Iniciando servicios..."
    $DOCKER_COMPOSE up -d
    
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
    echo "  - a11y_glitch_user"
    echo "  - security_glitch_user"
    echo ""
    echo "Para ver los logs:"
    echo "  $DOCKER_COMPOSE logs -f"
    echo ""
    echo "Para detener los servicios:"
    echo "  $DOCKER_COMPOSE down"
    
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

# El backend requiere Python 3.11 o 3.12: pydantic==2.5.3 no publica wheels
# para CPython 3.13+, así que la instalación intenta compilar desde fuente y
# falla. Se valida el intérprete que va a crear el venv, antes de crearlo.
PYTHON_VERSION=$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])')
case "$PYTHON_VERSION" in
    3.11|3.12) ;;
    *)
        echo -e "${RED}❌ Python $PYTHON_VERSION no es compatible${NC}"
        echo "El backend requiere Python 3.11 o 3.12."
        echo "pydantic==2.5.3 no publica wheels para CPython 3.13+; con un"
        echo "intérprete más nuevo la instalación intenta compilar desde"
        echo "fuente y falla. Ver .python-version y README.md."
        exit 1
        ;;
esac

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

# El frontend se instala con pnpm: solo pnpm-lock.yaml está versionado.
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm no está instalado${NC}"
    echo "Instálalo con: npm install -g pnpm   (o: corepack enable)"
    exit 1
fi

echo -e "${GREEN}✅ Python $PYTHON_VERSION, Node.js y pnpm están instalados${NC}"
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
# stdout silenciado, pero stderr NO: bajo `set -e` un fallo de pip abortaría
# el script sin imprimir nada si se redirigiera también stderr.
pip install -r requirements.txt > /dev/null

cd ..

# Setup Frontend
echo ""
echo "📦 Configurando Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias..."
    pnpm install > /dev/null
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
echo "  pnpm dev"
echo ""
echo "URLs disponibles:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
