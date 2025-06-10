#!/bin/bash

echo "🦇 Iniciando sistemas de automatización..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Batman system
if [ -f "$HOME/glados/batman/batman.py" ]; then
    echo -e "${BLUE}[BATMAN]${NC} Activando sistema Batman..."
    cd "$HOME/glados/batman"
    python batman.py --mode background &
    BATMAN_PID=$!
    echo -e "${GREEN}[✓]${NC} Batman activado (PID: $BATMAN_PID)"
else
    echo -e "${YELLOW}[!]${NC} Batman no encontrado"
fi

# Robin assistant
if [ -f "$HOME/glados/batman/robin.py" ]; then
    echo -e "${BLUE}[ROBIN]${NC} Activando asistente Robin..."
    python "$HOME/glados/batman/robin.py" &
    ROBIN_PID=$!
    echo -e "${GREEN}[✓]${NC} Robin activado (PID: $ROBIN_PID)"
else
    echo -e "${YELLOW}[!]${NC} Robin no encontrado"
fi

# Task monitoring
echo -e "${BLUE}[MONITOR]${NC} Iniciando monitoreo de tareas..."

# Create automation status file
cat > /tmp/diskdominator-automation.status << EOF
BATMAN_PID=$BATMAN_PID
ROBIN_PID=$ROBIN_PID
START_TIME=$(date)
PROJECT=DiskDominator
MODE=Development
EOF

echo -e "${GREEN}[✓]${NC} Sistemas de automatización activos"
echo ""
echo "Para detener la automatización:"
echo "  kill $BATMAN_PID $ROBIN_PID"
echo ""
echo "Estado guardado en: /tmp/diskdominator-automation.status"