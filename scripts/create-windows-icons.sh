#!/bin/bash

echo "🎨 Creating Windows Icons for DiskDominator"

# Create icons directory
mkdir -p /home/lauta/glados/DiskDominator/icons

cd /home/lauta/glados/DiskDominator/icons

# Create a simple SVG icon
cat > disk-icon.svg << 'EOF'
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Disk background -->
  <circle cx="128" cy="128" r="110" fill="#2563eb" stroke="#1e40af" stroke-width="4"/>
  
  <!-- Inner circle -->
  <circle cx="128" cy="128" r="80" fill="#3b82f6"/>
  
  <!-- Center hub -->
  <circle cx="128" cy="128" r="35" fill="#1e40af"/>
  
  <!-- Highlight -->
  <path d="M 80 60 Q 128 40, 176 60" fill="none" stroke="#60a5fa" stroke-width="3" opacity="0.7"/>
  
  <!-- "D" letter -->
  <text x="128" y="145" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">D</text>
</svg>
EOF

# Convert SVG to PNG sizes needed for Windows
echo "Converting to PNG formats..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    convert disk-icon.svg -resize 16x16 icon-16.png
    convert disk-icon.svg -resize 32x32 icon-32.png
    convert disk-icon.svg -resize 48x48 icon-48.png
    convert disk-icon.svg -resize 64x64 icon-64.png
    convert disk-icon.svg -resize 128x128 icon-128.png
    convert disk-icon.svg -resize 256x256 icon-256.png
    
    # Create ICO file (Windows icon)
    convert icon-16.png icon-32.png icon-48.png icon-256.png icon.ico
    
    echo "✅ Icons created successfully!"
else
    echo "⚠️  ImageMagick not installed. Creating placeholder icon.ico"
    
    # Create a simple placeholder
    echo "PLACEHOLDER" > icon.ico
fi

# Copy standard sizes for Tauri
cp icon-32.png 32x32.png 2>/dev/null || echo "32x32" > 32x32.png
cp icon-128.png 128x128.png 2>/dev/null || echo "128x128" > 128x128.png
cp icon-128.png "128x128@2x.png" 2>/dev/null || echo "128x128@2x" > "128x128@2x.png"

# Create macOS icon placeholder
echo "ICNS_PLACEHOLDER" > icon.icns

echo "📁 Icons created in: /home/lauta/glados/DiskDominator/icons/"
ls -la *.png *.ico *.icns 2>/dev/null || echo "Note: Install ImageMagick for proper icon generation"