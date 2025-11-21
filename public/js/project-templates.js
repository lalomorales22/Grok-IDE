/**
 * Project Templates - Phase 4
 * Scaffolding and project templates
 */

class ProjectTemplates {
    constructor() {
        this.templates = this.getDefaultTemplates();
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.setupDialog();
        this.setupEventListeners();

        this.initialized = true;
        console.log('✅ Project Templates initialized');
    }

    getDefaultTemplates() {
        return [
            {
                id: 'html-basic',
                name: 'HTML5 Basic',
                icon: '📄',
                description: 'Basic HTML5 page with CSS and JavaScript',
                tags: ['html', 'css', 'javascript'],
                files: {
                    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, World!</h1>
    <script src="script.js"></script>
</body>
</html>`,
                    'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    padding: 20px;
}

h1 {
    color: #333;
}`,
                    'script.js': `console.log('Hello, World!');

// Your code here
`
                }
            },
            {
                id: 'react-component',
                name: 'React Component',
                icon: '⚛️',
                description: 'React functional component with hooks',
                tags: ['react', 'javascript', 'component'],
                files: {
                    'Component.jsx': `import React, { useState, useEffect } from 'react';
import './Component.css';

const Component = () => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        console.log('Component mounted');
        return () => {
            console.log('Component will unmount');
        };
    }, []);

    return (
        <div className="component">
            <h2>My Component</h2>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
};

export default Component;`,
                    'Component.css': `.component {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.component h2 {
    margin-bottom: 10px;
}

.component button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.component button:hover {
    background: #0056b3;
}`
                }
            },
            {
                id: 'express-api',
                name: 'Express API',
                icon: '🚀',
                description: 'Node.js Express API with routes',
                tags: ['node', 'express', 'api'],
                files: {
                    'server.js': `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

app.get('/api/data', (req, res) => {
    res.json({ data: 'Sample data' });
});

// Start server
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`,
                    'package.json': `{
  "name": "express-api",
  "version": "1.0.0",
  "description": "Express API template",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}`
                }
            },
            {
                id: 'python-script',
                name: 'Python Script',
                icon: '🐍',
                description: 'Python script template with main function',
                tags: ['python', 'script'],
                files: {
                    'main.py': `#!/usr/bin/env python3
"""
Main script
"""

def main():
    """Main function"""
    print("Hello, World!")

    # Your code here

if __name__ == "__main__":
    main()`,
                    'requirements.txt': `# Add your dependencies here
# requests==2.28.0
`
                }
            },
            {
                id: 'typescript-node',
                name: 'TypeScript Node',
                icon: '📘',
                description: 'TypeScript Node.js project setup',
                tags: ['typescript', 'node'],
                files: {
                    'index.ts': `interface Config {
    name: string;
    version: string;
}

const config: Config = {
    name: 'my-project',
    version: '1.0.0'
};

function main(): void {
    console.log(\`\${config.name} v\${config.version}\`);
}

main();`,
                    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`,
                    'package.json': `{
  "name": "typescript-project",
  "version": "1.0.0",
  "description": "TypeScript project",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  }
}`
                }
            }
        ];
    }

    setupDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'templates-dialog';
        dialog.className = 'modal';
        dialog.style.display = 'none';
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header">
                    <h2>📦 Project Templates</h2>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="templates-grid" id="templates-grid"></div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    setupEventListeners() {
        const modal = document.getElementById('templates-dialog');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hide();
        });
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        this.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-description">${template.description}</div>
                <div class="template-tags">
                    ${template.tags.map(tag => `<span class="template-tag">${tag}</span>`).join('')}
                </div>
            `;

            card.addEventListener('click', () => this.applyTemplate(template));

            grid.appendChild(card);
        });
    }

    async applyTemplate(template) {
        if (window.showNotification) {
            window.showNotification(`Applying template: ${template.name}`, 'info');
        }

        // Note: In a real implementation, this would create files
        // For now, we'll just show the files in the editor

        const fileNames = Object.keys(template.files);

        if (fileNames.length > 0) {
            // Open first file in editor
            const firstFile = fileNames[0];
            const content = template.files[firstFile];

            if (window.monacoEditor) {
                window.monacoEditor.setValue(content);

                if (window.showNotification) {
                    window.showNotification(
                        `Template applied! Created ${fileNames.length} file(s)`,
                        'success'
                    );
                }
            }

            // Log other files
            console.log('Template files:', template.files);
        }

        this.hide();
    }

    show() {
        const modal = document.getElementById('templates-dialog');
        modal.style.display = 'flex';
        this.renderTemplates();
    }

    hide() {
        const modal = document.getElementById('templates-dialog');
        modal.style.display = 'none';
    }
}

window.ProjectTemplates = ProjectTemplates;
