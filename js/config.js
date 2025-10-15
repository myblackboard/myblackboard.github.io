/**
 * Chalkboard Configuration
 * Optional configuration file to customize the chalkboard behavior
 * Add <script src="js/config.js"></script> before chalk.js in index.html to use
 */

window.ChalkboardConfig = {
    // Drawing settings
    drawing: {
        defaultColor: '#ffffff',      // Default chalk color
        brushSize: 7,                  // Default brush size (1-20)
        eraserSize: 50,                // Default eraser size (20-100)
        textureIntensity: 3,           // Number of texture particles (0-10)
        opacity: {
            min: 0.4,                  // Minimum stroke opacity
            max: 0.6                   // Maximum stroke opacity
        }
    },

    // Canvas settings
    canvas: {
        backgroundColor: '#0a3d0a',    // Chalkboard background color
        textureEnabled: true,          // Enable background texture
        textureOpacity: 0.02,          // Background texture opacity
        preserveOnResize: true         // Preserve content when window resizes
    },

    // UI settings
    ui: {
        showHelpOnStart: true,         // Show help tooltip on startup
        helpDuration: 3000,            // Help tooltip duration (ms)
        notificationDuration: 2000,    // Success notification duration (ms)
        controlPanelPosition: 'bottom-left', // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
        showColorPicker: true,         // Show color picker in control panel
        showGitHubLink: true           // Show GitHub fork banner
    },

    // Performance settings
    performance: {
        useRAF: true,                  // Use requestAnimationFrame
        batchDrawCalls: true,          // Batch drawing operations
        maxQueueSize: 50,              // Maximum draw queue size
        canvasDesync: true             // Use desynchronized canvas context
    },

    // Keyboard shortcuts
    shortcuts: {
        clear: ' ',                    // Clear canvas
        save: 's',                     // Save drawing
        eraser: 'e',                   // Toggle eraser
        help: 'h',                     // Show help
        undo: 'z',                     // Undo last stroke (if implemented)
        redo: 'y'                      // Redo stroke (if implemented)
    },

    // Touch settings
    touch: {
        enabled: true,                 // Enable touch support
        preventScrolling: true,        // Prevent page scrolling while drawing
        multiTouchGestures: false      // Enable multi-touch gestures (pinch to zoom, etc.)
    },

    // Save settings
    save: {
        format: 'png',                 // Save format ('png', 'jpeg')
        quality: 0.9,                  // JPEG quality (0-1)
        includeBackground: true,       // Include background in saved image
        filenamePrefix: 'chalkboard', // Filename prefix
        includeTimestamp: true         // Add timestamp to filename
    },

    // Advanced features
    features: {
        pressure: false,               // Enable pressure sensitivity (requires compatible device)
        smoothing: true,               // Enable line smoothing
        autoSave: false,               // Auto-save to localStorage
        autoSaveInterval: 30000,       // Auto-save interval (ms)
        undoRedo: false,               // Enable undo/redo functionality
        layers: false                  // Enable layer support
    },

    // Custom colors palette
    colorPalette: [
        '#ffffff',  // White
        '#ffff00',  // Yellow
        '#00ff00',  // Green
        '#00ffff',  // Cyan
        '#ff00ff',  // Magenta
        '#ff9999',  // Pink
        '#99ccff',  // Light Blue
        '#ffcc99'   // Peach
    ],

    // Debug settings
    debug: {
        showFPS: false,                // Show FPS counter
        logEvents: false,              // Log drawing events to console
        showCursorPosition: false,     // Show cursor coordinates
        showCanvasInfo: false          // Show canvas information
    },

    // Experimental features
    experimental: {
        webGL: false,                  // Use WebGL for rendering (if available)
        offscreenCanvas: false,        // Use OffscreenCanvas API
        imageSmoothing: true,          // Enable image smoothing
        compositeOperations: true      // Use advanced composite operations
    },

    // Callbacks (optional)
    callbacks: {
        onInit: null,                  // Called when chalkboard initializes
        onDraw: null,                  // Called on each draw operation
        onClear: null,                 // Called when canvas is cleared
        onSave: null,                  // Called when drawing is saved
        onColorChange: null,           // Called when color changes
        onEraserToggle: null          // Called when eraser is toggled
    },

    // Localization (optional)
    i18n: {
        language: 'en',
        strings: {
            en: {
                save: 'Save',
                clear: 'Clear',
                eraser: 'Eraser',
                helpTitle: 'Controls:',
                helpDraw: 'Draw: Left click/touch and drag',
                helpErase: 'Erase: Right click and drag',
                helpClear: 'Clear: Press spacebar',
                helpSave: 'Save: Press \'S\' or click Save button',
                savedMessage: 'Drawing saved successfully!',
                clearConfirm: 'Clear the entire board?'
            }
        }
    }
};

// Helper function to merge user config with defaults
window.ChalkboardConfig.merge = function(userConfig) {
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = target[key] || {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    return deepMerge(this, userConfig);
};

// Auto-apply dark mode if system preference is set
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    window.ChalkboardConfig.canvas.backgroundColor = '#0a3d0a';
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    window.ChalkboardConfig.canvas.backgroundColor = '#1a5a1a';
}

// Detect touch device and adjust settings
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    window.ChalkboardConfig.touch.enabled = true;
    window.ChalkboardConfig.ui.controlPanelPosition = 'bottom-center';
}

// Log config in debug mode
if (window.ChalkboardConfig.debug.logEvents) {
    console.log('Chalkboard Configuration:', window.ChalkboardConfig);
}

