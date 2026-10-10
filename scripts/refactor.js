const fs = require('fs');
const path = require('path');

const rootDir = 'e:/AyuLekha';
const appsDir = path.join(rootDir, 'apps');
const patientDir = path.join(appsDir, 'patient');
const doctorDir = path.join(appsDir, 'doctor');
const sharedDir = path.join(rootDir, 'packages', 'shared');

// 1. Create directories
[
  patientDir, doctorDir, sharedDir,
  path.join(patientDir, 'src'), path.join(doctorDir, 'src'),
  path.join(patientDir, 'src', 'pages'), path.join(doctorDir, 'src', 'pages'),
  path.join(sharedDir, 'src')
].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// 2. Move shared directories
const sharedDirs = ['components', 'contexts', 'styles', 'locales', 'config', 'assets'];
sharedDirs.forEach(dir => {
  const src = path.join(rootDir, 'src', dir);
  const dest = path.join(sharedDir, 'src', dir);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
});

// 3. Move shared files
const sharedFiles = ['api.js'];
sharedFiles.forEach(file => {
  const src = path.join(rootDir, 'src', file);
  const dest = path.join(sharedDir, 'src', file);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
});

// 4. Move pages
const pagesDir = path.join(rootDir, 'src', 'pages');
if (fs.existsSync(pagesDir)) {
  const pages = fs.readdirSync(pagesDir);
  pages.forEach(page => {
    const src = path.join(pagesDir, page);
    let dest;
    if (page === 'DoctorDashboard' || page === 'DoctorSummary') {
      dest = path.join(doctorDir, 'src', 'pages', page);
    } else {
      dest = path.join(patientDir, 'src', 'pages', page);
    }
    fs.renameSync(src, dest);
  });
}

// 5. Create package.json files
fs.writeFileSync(path.join(sharedDir, 'package.json'), JSON.stringify({
  name: "@ayulekha/shared",
  version: "1.0.0",
  main: "src/index.js",
  type: "module"
}, null, 2));

fs.writeFileSync(path.join(patientDir, 'package.json'), JSON.stringify({
  name: "patient-app",
  version: "1.0.0",
  type: "module",
  scripts: {
    "dev": "vite",
    "build": "vite build"
  },
  dependencies: {
    "@ayulekha/shared": "*"
  }
}, null, 2));

fs.writeFileSync(path.join(doctorDir, 'package.json'), JSON.stringify({
  name: "doctor-app",
  version: "1.0.0",
  type: "module",
  scripts: {
    "dev": "vite --port 5174",
    "build": "vite build"
  },
  dependencies: {
    "@ayulekha/shared": "*"
  }
}, null, 2));

// 6. Update root package.json
const rootPkgPath = path.join(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
rootPkg.workspaces = ["apps/*", "packages/*"];
rootPkg.scripts = {
  ...rootPkg.scripts,
  "dev:patient": "npm run dev --workspace=patient-app",
  "dev:doctor": "npm run dev --workspace=doctor-app"
};
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));

// 7. Configure Vite configs
const viteConfigTemplate = (port) => `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: ${port},
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
`;
fs.writeFileSync(path.join(patientDir, 'vite.config.js'), viteConfigTemplate(5173));
fs.writeFileSync(path.join(doctorDir, 'vite.config.js'), viteConfigTemplate(5174));

// 8. Copy index.html and index.css
const rootIndexHtml = path.join(rootDir, 'index.html');
if (fs.existsSync(rootIndexHtml)) {
  fs.copyFileSync(rootIndexHtml, path.join(patientDir, 'index.html'));
  fs.copyFileSync(rootIndexHtml, path.join(doctorDir, 'index.html'));
}
const rootIndexCss = path.join(rootDir, 'src', 'index.css');
if (fs.existsSync(rootIndexCss)) {
  fs.copyFileSync(rootIndexCss, path.join(sharedDir, 'src', 'index.css'));
}

// 9. Create App.jsx and main.jsx for Patient
const patientMainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@ayulekha/shared/styles/tokens.css'
import '@ayulekha/shared/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
fs.writeFileSync(path.join(patientDir, 'src', 'main.jsx'), patientMainJsx);

const doctorMainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@ayulekha/shared/styles/tokens.css'
import '@ayulekha/shared/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
fs.writeFileSync(path.join(doctorDir, 'src', 'main.jsx'), doctorMainJsx);

// We will fix imports in a second pass since it requires reading all files.
console.log('Restructuring complete!');
