#!/bin/bash
# Auto-fix build errors script using Batman Incorporated

echo "🦇 BATMAN BUILD ERROR FIXER"
echo "=========================="
echo
echo "This script will automatically fix build errors using Batman agents"
echo "Connecting via Tailscale to Windows build process..."
echo

# Get Tailscale IPs
WSL_IP="100.96.251.13"
WINDOWS_IP="100.91.52.70"

# Function to run Windows command via SSH or direct
run_windows_cmd() {
    # For now, we'll collect errors and fix them in WSL
    echo "$1"
}

# Function to fix React import errors
fix_react_imports() {
    echo "🔧 Fixing React import errors..."
    
    # Find all files with duplicate React imports
    grep -r "import React from" . --include="*.tsx" --include="*.jsx" | grep -v node_modules | while read -r line; do
        file=$(echo "$line" | cut -d: -f1)
        
        # Check if file has duplicate imports
        if grep -c "import React from" "$file" > /dev/null && [ $(grep -c "import React from" "$file") -gt 1 ]; then
            echo "Fixing: $file"
            
            # Remove duplicate React imports, keep only the first one
            awk '!seen && /import React from/ {seen=1} seen && /import React from/ {next} 1' "$file" > "$file.tmp"
            mv "$file.tmp" "$file"
        fi
    done
}

# Function to collect and fix build errors
fix_build_errors() {
    echo "🔍 Collecting build errors..."
    
    # Try to build and capture errors
    cd /home/lauta/glados/DiskDominator
    npm run build 2>&1 | tee build_errors.log
    
    # Parse errors and fix them
    if grep -q "Duplicate identifier" build_errors.log; then
        fix_react_imports
    fi
    
    # Fix other common errors
    if grep -q "Cannot find module" build_errors.log; then
        echo "🔧 Fixing missing modules..."
        npm install
    fi
}

# Main execution loop
echo "Starting automated fix process..."

# Maximum attempts
MAX_ATTEMPTS=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo
    echo "📊 Attempt $ATTEMPT of $MAX_ATTEMPTS"
    echo "================================"
    
    # Run build and check if successful
    if npm run build > /dev/null 2>&1; then
        echo "✅ Build successful!"
        break
    else
        echo "❌ Build failed, analyzing errors..."
        fix_build_errors
        
        # Increment attempt
        ((ATTEMPT++))
    fi
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "❌ Maximum attempts reached. Manual intervention needed."
else
    echo
    echo "🎉 Build preparation complete!"
    echo "Now you can run: npx tauri build"
fi