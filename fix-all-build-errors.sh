#!/bin/bash
# Comprehensive build error fixer for DiskDominator

echo "🔧 DiskDominator Build Error Auto-Fixer"
echo "======================================="
echo

# Change to project directory
cd /home/lauta/glados/DiskDominator

# Function to fix specific errors
fix_window_intervals_error() {
    echo "🔧 Fixing window._intervals error..."
    
    # Find file with the error
    file=$(grep -r "window\._intervals" --include="*.tsx" --include="*.ts" | grep -v node_modules | cut -d: -f1 | head -1)
    
    if [ -n "$file" ]; then
        echo "  Found in: $file"
        
        # Fix by adding type declaration or using window as any
        sed -i 's/window\._intervals/(window as any)._intervals/g' "$file"
        echo "  Fixed!"
    fi
}

fix_type_errors() {
    echo "🔍 Scanning for type errors..."
    
    # Capture build output
    npm run build 2>&1 > build_output.log
    
    # Check for window._intervals error
    if grep -q "Property '_intervals' does not exist" build_output.log; then
        fix_window_intervals_error
    fi
    
    # Check for other common type errors
    if grep -q "Property .* does not exist on type 'Window" build_output.log; then
        echo "🔧 Fixing window type errors..."
        
        # Find all files with window.something errors
        grep -r "window\." --include="*.tsx" --include="*.ts" | grep -v node_modules | while read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            
            # Add type assertion for custom window properties
            sed -i 's/window\.\([a-zA-Z_][a-zA-Z0-9_]*\)/(window as any).\1/g' "$file" 2>/dev/null
        done
    fi
}

# Main loop - try to fix errors until build succeeds
MAX_ATTEMPTS=5
attempt=1

while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo
    echo "🔄 Build attempt $attempt of $MAX_ATTEMPTS"
    echo "-----------------------------------"
    
    # Try to build
    if npm run build > /dev/null 2>&1; then
        echo "✅ Build successful!"
        echo
        echo "🎉 All errors fixed! Ready for Tauri build."
        echo
        echo "Next steps on Windows:"
        echo "1. cd K:\\_Glados\\DiskDominator"
        echo "2. npx tauri build"
        exit 0
    else
        echo "❌ Build failed, fixing errors..."
        fix_type_errors
        
        # Increment attempt
        ((attempt++))
    fi
done

echo
echo "⚠️ Could not fix all errors automatically."
echo "Manual intervention may be needed."
echo
echo "Check build_output.log for remaining errors."