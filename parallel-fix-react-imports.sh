#!/bin/bash
# Parallel fix for all React import duplicates

echo "🚀 PARALLEL REACT IMPORT FIXER"
echo "=============================="
echo

# Find all files with duplicate React imports
files_with_errors=$(grep -r "import type React from" --include="*.tsx" --include="*.jsx" /home/lauta/glados/DiskDominator/components | cut -d: -f1 | sort -u)

echo "Found files with duplicate React imports:"
echo "$files_with_errors"
echo

# Function to fix a single file
fix_file() {
    local file=$1
    echo "🔧 Fixing: $file"
    
    # Remove the duplicate import type React line
    sed -i '/^import type React from "react"$/d' "$file"
    
    # Consolidate imports if they're on separate lines
    if grep -q 'import React from "react"' "$file" && grep -q 'import { .* } from "react"' "$file"; then
        # Extract the imports
        imports=$(grep 'import { .* } from "react"' "$file" | sed 's/import { \(.*\) } from "react"/\1/')
        
        # Remove the separate import line
        sed -i '/^import { .* } from "react"$/d' "$file"
        
        # Replace React import with consolidated version
        sed -i "s/import React from \"react\"/import React, { $imports } from \"react\"/" "$file"
    fi
    
    echo "✅ Fixed: $file"
}

# Export the function so it can be used in parallel
export -f fix_file

# Process all files in parallel
echo "$files_with_errors" | parallel -j 10 fix_file {}

echo
echo "🎉 All React imports fixed in parallel!"
echo
echo "Testing build..."
npm run build 2>&1 | grep -E "(Compiled successfully|Failed to compile|Type error)" | head -10