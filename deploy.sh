#!/bin/bash

# Chalkboard Deployment Script
# This script helps prepare the application for production deployment

set -e

echo "🎨 Chalkboard Deployment Script"
echo "================================"

# Create dist directory
echo "📁 Creating distribution directory..."
rm -rf dist
mkdir -p dist/css dist/js dist/img

# Copy HTML (with optional minification)
echo "📄 Processing HTML..."
if command -v html-minifier &> /dev/null; then
    echo "   Minifying HTML..."
    html-minifier --collapse-whitespace --remove-comments --minify-css true --minify-js true index.html -o dist/index.html
else
    echo "   Copying HTML (install html-minifier for minification)..."
    cp index.html dist/index.html
fi

# Process CSS
echo "🎨 Processing CSS..."
if command -v cssnano &> /dev/null; then
    echo "   Minifying CSS..."
    cssnano css/chalk.css dist/css/chalk.css
else
    echo "   Copying CSS (install cssnano for minification)..."
    cp css/chalk.css dist/css/chalk.css
fi

# Process JavaScript
echo "⚙️  Processing JavaScript..."
if command -v terser &> /dev/null; then
    echo "   Minifying JavaScript..."
    terser js/chalk.js -c -m -o dist/js/chalk.js
else
    echo "   Copying JavaScript (install terser for minification)..."
    cp js/chalk.js dist/js/chalk.js
fi

# Copy images if they exist
echo "🖼️  Processing images..."
if [ -d "img" ] && [ "$(ls -A img)" ]; then
    if command -v imagemin &> /dev/null; then
        echo "   Optimizing images..."
        imagemin img/* --out-dir=dist/img
    else
        echo "   Copying images (install imagemin-cli for optimization)..."
        cp -r img/* dist/img/ 2>/dev/null || echo "   No images to copy"
    fi
else
    echo "   No images directory found (using CSS fallbacks)"
fi

# Create a simple server script
echo "🚀 Creating server script..."
cat > dist/server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎨 Chalkboard server running at http://localhost:${PORT}/`);
});
EOF

# Create package.json for deployment
echo "📦 Creating package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "chalkboard",
  "version": "2.0.0",
  "description": "Interactive chalkboard drawing application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "serve": "python3 -m http.server 8000 || python -m SimpleHTTPServer 8000"
  },
  "keywords": ["chalkboard", "drawing", "canvas", "interactive"],
  "author": "Mohamed Moustafa",
  "license": "MIT"
}
EOF

# Generate deployment README
echo "📝 Creating deployment README..."
cat > dist/README.md << 'EOF'
# Chalkboard - Production Build

This is the optimized production build of the Chalkboard application.

## Quick Start

### Option 1: Node.js Server
```bash
npm start
# or
node server.js
```

### Option 2: Python Server
```bash
python3 -m http.server 8000
# or for Python 2
python -m SimpleHTTPServer 8000
```

### Option 3: Static Hosting
Upload all files to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)

## Files
- `index.html` - Main application
- `css/chalk.css` - Styles (minified)
- `js/chalk.js` - JavaScript (minified)
- `img/` - Images (optional, optimized)

## Browser Requirements
- Modern browser with Canvas API support
- JavaScript enabled

## License
MIT License
EOF

# Calculate size reduction
echo ""
echo "📊 Build Statistics:"
echo "==================="
if [ -d "dist" ]; then
    original_size=$(du -sh . | cut -f1)
    build_size=$(du -sh dist | cut -f1)
    echo "Original size: $original_size"
    echo "Build size: $build_size"
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Files are in the 'dist' directory"
echo ""
echo "🚀 To run locally:"
echo "   cd dist"
echo "   npm start"
echo "   # or"
echo "   python3 -m http.server 8000"
echo ""
echo "☁️  To deploy:"
echo "   Upload the contents of 'dist' to your web server"
echo ""
echo "💡 For better optimization, install:"
echo "   npm install -g html-minifier terser cssnano imagemin-cli"

