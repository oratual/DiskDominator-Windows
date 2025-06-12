#!/bin/bash
# Final build check and auto-fix

echo "🚀 FINAL BUILD CHECK"
echo "==================="
echo

# Counter for attempts
attempt=0
max_attempts=20

while [ $attempt -lt $max_attempts ]; do
    echo "Attempt $((attempt + 1)) of $max_attempts..."
    
    # Run build and capture output
    output=$(npm run build 2>&1)
    
    # Check if build succeeded
    if echo "$output" | grep -q "Build optimization complete"; then
        echo
        echo "✅ BUILD SUCCESSFUL!"
        echo
        echo "$output" | grep -E "(Collecting page data|Generating static pages|finalizing page optimization|Route|Build optimization complete)" | tail -20
        exit 0
    fi
    
    # Look for missing module
    missing=$(echo "$output" | grep "Cannot find module" | grep -o "'[^']*'" | head -1 | tr -d "'")
    
    if [ -n "$missing" ]; then
        echo "📦 Installing missing module: $missing"
        npm install "$missing"
    else
        # Look for other errors
        echo
        echo "❌ Build failed with error:"
        echo "$output" | grep -A 5 -B 5 "error:" | head -20
        exit 1
    fi
    
    ((attempt++))
done

echo "❌ Max attempts reached. Manual intervention needed."