/**
 * Chalkboard - Interactive Canvas Drawing Application
 * Enhanced version with improved performance, touch support, and features
 */

class Chalkboard {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.isDrawing = false;
        this.isErasing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#ffffff';
        this.brushSize = 7;
        this.eraserSize = 50;
        this.touchIdentifier = null;
        
        // Performance optimization
        this.rafId = null;
        this.drawQueue = [];
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.createCanvas();
        this.createChalkCursor();
        this.setupEventListeners();
        this.showHelpTooltip();
        this.resizeCanvas();
    }

    createCanvas() {
        // Remove existing canvas if present
        const existing = document.getElementById('chalkboard');
        if (existing) existing.remove();

        // Create new canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'chalkboard';
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true 
        });
        
        // Set default styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    createChalkCursor() {
        // Remove existing cursor
        const existing = document.querySelector('.chalk');
        if (existing) existing.remove();

        this.chalkCursor = document.createElement('div');
        this.chalkCursor.className = 'chalk';
        document.body.appendChild(this.chalkCursor);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Control panel buttons
        this.setupControlPanel();

        // Color picker
        const colorPicker = document.getElementById('chalk-color');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.currentColor = e.target.value;
            });
        }
    }

    setupControlPanel() {
        const saveBtn = document.querySelector('.btn-save');
        const clearBtn = document.querySelector('.btn-clear');
        const eraserBtn = document.querySelector('.btn-toggle-eraser');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCanvas());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCanvas());
        }

        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                this.isErasing = !this.isErasing;
                eraserBtn.classList.toggle('active', this.isErasing);
                this.chalkCursor.classList.toggle('eraser', this.isErasing);
            });
        }
    }

    handleMouseDown(e) {
        if (e.button === 2) {
            // Right click - eraser
            this.isErasing = true;
            this.chalkCursor.classList.add('eraser');
        } else if (e.button === 0) {
            // Left click - draw
            if (e.target.closest('.panel') || e.target.closest('.github-fork')) {
                return;
            }
        }
        
        this.startDrawing(e.clientX, e.clientY);
    }

    handleMouseMove(e) {
        // Update cursor position
        this.updateCursorPosition(e.clientX, e.clientY);
        
        if (this.isDrawing) {
            this.addToDrawQueue(e.clientX, e.clientY);
        }
    }

    handleMouseUp(e) {
        this.stopDrawing();
        
        if (e.button === 2) {
            this.isErasing = false;
            this.chalkCursor.classList.remove('eraser');
            const eraserBtn = document.querySelector('.btn-toggle-eraser');
            if (eraserBtn) {
                eraserBtn.classList.remove('active');
            }
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchIdentifier = touch.identifier;
            this.startDrawing(touch.clientX, touch.clientY);
            this.updateCursorPosition(touch.clientX, touch.clientY);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        if (this.touchIdentifier !== null) {
            const touch = Array.from(e.touches).find(t => t.identifier === this.touchIdentifier);
            if (touch) {
                this.updateCursorPosition(touch.clientX, touch.clientY);
                if (this.isDrawing) {
                    this.addToDrawQueue(touch.clientX, touch.clientY);
                }
            }
        }
    }

    handleTouchEnd(e) {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchIdentifier);
        if (touch) {
            this.stopDrawing();
            this.touchIdentifier = null;
        }
    }

    handleKeyDown(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.clearCanvas();
                break;
            case 's':
            case 'S':
                e.preventDefault();
                this.saveCanvas();
                break;
            case 'e':
            case 'E':
                this.toggleEraser();
                break;
            case 'h':
            case 'H':
                this.toggleHelp();
                break;
        }
    }

    handleResize() {
        // Debounce resize
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.resizeCanvas(), 100);
    }

    startDrawing(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        
        if (!this.isErasing) {
            // Start with a dot
            this.drawDot(x, y);
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        this.drawQueue = [];
    }

    addToDrawQueue(x, y) {
        this.drawQueue.push({ x, y });
        
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => this.processDrawQueue());
        }
    }

    processDrawQueue() {
        if (this.drawQueue.length === 0) {
            this.rafId = null;
            return;
        }

        const points = this.drawQueue.splice(0, this.drawQueue.length);
        
        points.forEach(point => {
            if (this.isErasing) {
                this.erase(point.x, point.y);
            } else {
                this.draw(point.x, point.y);
            }
        });

        this.rafId = requestAnimationFrame(() => this.processDrawQueue());
    }

    draw(x, y) {
        // Main stroke
        this.ctx.strokeStyle = this.hexToRgba(this.currentColor, 0.4 + Math.random() * 0.2);
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        // Chalk texture effect
        this.addChalkTexture(x, y);
        
        this.lastX = x;
        this.lastY = y;
    }

    drawDot(x, y) {
        this.ctx.fillStyle = this.hexToRgba(this.currentColor, 0.6);
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    addChalkTexture(x, y) {
        const distance = Math.hypot(x - this.lastX, y - this.lastY);
        const steps = Math.ceil(distance / 2);
        
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const currentX = this.lastX + (x - this.lastX) * t;
            const currentY = this.lastY + (y - this.lastY) * t;
            
            // Random particles for chalk texture
            for (let j = 0; j < 3; j++) {
                const offsetX = (Math.random() - 0.5) * this.brushSize;
                const offsetY = (Math.random() - 0.5) * this.brushSize;
                const size = Math.random() * 2 + 1;
                
                this.ctx.fillStyle = this.hexToRgba(this.currentColor, Math.random() * 0.1);
                this.ctx.fillRect(
                    currentX + offsetX,
                    currentY + offsetY,
                    size,
                    size
                );
            }
        }
    }

    erase(x, y) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.eraserSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        this.lastX = x;
        this.lastY = y;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.applyBackground();
    }

    resizeCanvas() {
        // Save current content
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Resize canvas
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Restore styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Apply background
        this.applyBackground();
        
        // Restore content
        this.ctx.putImageData(imageData, 0, 0);
    }

    applyBackground() {
        // Create chalkboard green background
        this.ctx.fillStyle = '#0a3d0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add subtle texture
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.02})`;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    updateCursorPosition(x, y) {
        if (this.chalkCursor) {
            this.chalkCursor.style.left = x + 'px';
            this.chalkCursor.style.top = y + 'px';
            
            // Hide cursor when outside canvas
            const isInsideCanvas = x >= 0 && x <= this.width && y >= 0 && y <= this.height;
            this.chalkCursor.style.opacity = isInsideCanvas ? '1' : '0';
        }
    }

    saveCanvas() {
        // Show loading indicator
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = 'Preparing download...';
        document.body.appendChild(loading);

        // Create a new canvas with background
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width;
        exportCanvas.height = this.canvas.height;
        const exportCtx = exportCanvas.getContext('2d');

        // Draw green background
        exportCtx.fillStyle = '#0a3d0a';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Draw the current canvas content
        exportCtx.drawImage(this.canvas, 0, 0);

        // Convert to blob and download
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chalkboard_${new Date().getTime()}.png`;
            link.click();
            
            // Cleanup
            URL.revokeObjectURL(url);
            loading.remove();
            
            // Show success message
            this.showNotification('Drawing saved successfully!');
        }, 'image/png');
    }

    toggleEraser() {
        this.isErasing = !this.isErasing;
        this.chalkCursor.classList.toggle('eraser', this.isErasing);
        
        const eraserBtn = document.querySelector('.btn-toggle-eraser');
        if (eraserBtn) {
            eraserBtn.classList.toggle('active', this.isErasing);
        }
    }

    toggleHelp() {
        const tooltip = document.querySelector('.help-tooltip');
        if (tooltip) {
            tooltip.classList.toggle('show');
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 5000);
        }
    }

    showHelpTooltip() {
        const tooltip = document.querySelector('.help-tooltip');
        if (tooltip) {
            setTimeout(() => {
                tooltip.classList.add('show');
                setTimeout(() => {
                    tooltip.classList.remove('show');
                }, 3000);
            }, 500);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'loading';
        notification.textContent = message;
        notification.style.background = '#4CAF50';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Initialize the chalkboard
const chalkboard = new Chalkboard();

