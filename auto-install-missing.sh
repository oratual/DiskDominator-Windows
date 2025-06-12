#!/bin/bash
# Auto-install missing npm modules

echo "🔧 Auto-installing missing modules..."

while true; do
    # Try to build and capture output
    output=$(npm run build 2>&1)
    
    # Check if build succeeded
    if echo "$output" | grep -q "Build optimization complete"; then
        echo "✅ Build successful!"
        break
    fi
    
    # Extract missing module name
    missing_module=$(echo "$output" | grep "Cannot find module" | grep -o "'[^']*'" | head -1 | tr -d "'")
    
    if [ -z "$missing_module" ]; then
        echo "❌ Build failed but no missing modules found"
        echo "$output" | grep -E "(Type error|Failed to compile)" | head -5
        break
    fi
    
    echo "📦 Installing: $missing_module"
    npm install "$missing_module"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install $missing_module"
        break
    fi
done