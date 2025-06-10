#!/bin/bash

echo "=== Diagnóstico del servidor DiskDominator ==="
echo ""

# Verificar si Node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js instalado: $(node --version)"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ npm instalado: $(npm --version)"

# Verificar directorio
if [ ! -d "/home/lauta/glados/DiskDominator" ]; then
    echo "❌ Error: Directorio DiskDominator no encontrado"
    exit 1
fi

cd /home/lauta/glados/DiskDominator
echo "✅ Directorio: $(pwd)"

# Verificar package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    exit 1
fi

echo "✅ package.json encontrado"

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules no encontrado. Instalando dependencias..."
    npm install
fi

# Obtener IPs
echo ""
echo "=== Información de Red ==="
echo "IP WSL2: $(hostname -I | awk '{print $1}')"
echo "Hostname: $(hostname)"

# Verificar puertos en uso
echo ""
echo "=== Puertos en uso (3000-3010) ==="
for port in {3000..3010}; do
    if nc -z localhost $port 2>/dev/null; then
        echo "⚠️  Puerto $port está en uso"
    else
        echo "✅ Puerto $port está libre"
    fi
done

# Verificar procesos Next.js
echo ""
echo "=== Procesos Next.js activos ==="
ps aux | grep -E "next dev" | grep -v grep || echo "No hay servidores Next.js ejecutándose"

echo ""
echo "=== URLs para acceder al servidor ==="
echo "Desde WSL2:"
echo "  - http://localhost:3006"
echo ""
echo "Desde Windows:"
echo "  - http://localhost:3006"
echo "  - http://127.0.0.1:3006"
echo "  - http://$(hostname -I | awk '{print $1}'):3006"

echo ""
echo "=== Iniciando servidor ==="
echo "Ejecutando: HOST=0.0.0.0 PORT=3006 npm run dev"
echo ""

# Iniciar servidor
HOST=0.0.0.0 PORT=3006 exec npm run dev