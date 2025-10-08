# Accountability AI - Command Reference

Quick reference for all common commands and operations.

## Installation & Setup

```powershell
# Install all dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate NextAuth secret
openssl rand -base64 32
```

## Development

```powershell
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Run linter
npm run lint
```

## Project Management

```powershell
# Check Node.js version (need 18+)
node --version

# Check npm version
npm --version

# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update all dependencies
npm update

# Audit for vulnerabilities
npm audit
```

## Troubleshooting Commands

```powershell
# Clear npm cache
npm cache clean --force

# Delete and reinstall dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Delete Next.js build cache
Remove-Item -Recurse -Force .next

# Full reset
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run dev
```

## Git Commands

```powershell
# Check status
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature-name

# Switch branch
git checkout main
```

## Environment Variables

```powershell
# View all environment variables (PowerShell)
Get-ChildItem Env:

# Check if specific variable is set
$env:GOOGLE_CLIENT_ID

# Set temporary environment variable (current session only)
$env:VARIABLE_NAME = "value"
```

## Google Cloud Commands (CLI)

```powershell
# Install Google Cloud SDK first: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# List enabled APIs
gcloud services list --enabled

# Enable Google Sheets API
gcloud services enable sheets.googleapis.com

# List service accounts
gcloud iam service-accounts list

# Create service account
gcloud iam service-accounts create accountability-ai-sheets --display-name="Accountability AI Sheets"

# Create service account key
gcloud iam service-accounts keys create ./service-account-key.json --iam-account=accountability-ai-sheets@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## VS Code Commands

```powershell
# Open project in VS Code
code .

# Open specific file
code README.md

# Install VS Code extension
code --install-extension ms-vscode.vscode-typescript-next
```

## Package Management

```powershell
# List installed packages
npm list --depth=0

# Check for outdated packages
npm outdated

# View package info
npm info package-name

# Uninstall package
npm uninstall package-name
```

## Testing & Quality

```powershell
# Run TypeScript compiler check
npx tsc --noEmit

# Format code with Prettier
npx prettier --write .

# Lint and auto-fix
npm run lint -- --fix
```

## Logs & Debugging

```powershell
# View npm logs
npm config get cache
# Then: Get-Content "C:\Users\USERNAME\AppData\Roaming\npm-cache\_logs\*-debug.log"

# View Next.js build info
npm run build -- --debug

# Start with verbose logging
npm run dev -- --verbose
```

## Port Management

```powershell
# Check what's using port 3000 (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill process using port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Start on different port
$env:PORT=3001; npm run dev
```

## File Operations

```powershell
# Search for text in files
Select-String -Path "src/**/*.ts" -Pattern "searchterm"

# Count lines of code
Get-ChildItem -Recurse -Include *.ts,*.tsx | Get-Content | Measure-Object -Line

# Find large files
Get-ChildItem -Recurse | Where-Object {$_.Length -gt 1MB} | Sort-Object Length -Descending

# Zip project (exclude node_modules)
Compress-Archive -Path .\src,.\public,.\package.json,.\README.md -DestinationPath accountability-ai.zip
```

## Deployment Commands (Vercel)

```powershell
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List deployments
vercel ls

# Add environment variable
vercel env add VARIABLE_NAME
```

## Database/Sheets Operations

```powershell
# Test Google Sheets API access (create test script)
node -e "console.log(require('./src/lib/sheets.ts'))"

# Verify service account credentials
node -e "console.log(JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS))"
```

## Quick Access URLs

```powershell
# Open local app
start http://localhost:3000

# Open Google Cloud Console
start https://console.cloud.google.com

# Open Google Sheet
start "https://docs.google.com/spreadsheets/d/1UnsPseWvNIb1R1P3UhPOsap3kM-4p2OcOpHToGdKhNU/edit"

# Open Vercel dashboard
start https://vercel.com/dashboard
```

## Useful Snippets

### Create new component
```powershell
$componentName = "MyComponent"
New-Item -Path "src/components/$componentName.tsx" -ItemType File
```

### Create new API route
```powershell
$routeName = "myroute"
New-Item -Path "src/app/api/$routeName" -ItemType Directory
New-Item -Path "src/app/api/$routeName/route.ts" -ItemType File
```

### Backup .env file
```powershell
Copy-Item .env .env.backup
```

### Generate random secret
```powershell
# PowerShell
-join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use openssl (if installed)
openssl rand -base64 32
```

## Keyboard Shortcuts (VS Code)

```
Ctrl+Shift+P     Command Palette
Ctrl+P           Quick Open File
Ctrl+`           Toggle Terminal
Ctrl+B           Toggle Sidebar
Ctrl+Shift+F     Search in Files
Ctrl+Shift+E     Explorer
F5               Start Debugging
Ctrl+.           Quick Fix
Alt+Shift+F      Format Document
Ctrl+/           Toggle Comment
```

## Common Workflows

### Adding a new feature
```powershell
git checkout -b feature/new-feature
# Make changes
npm run lint
npm run build
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# Create Pull Request on GitHub
```

### Deploying to production
```powershell
git checkout main
git pull origin main
npm run build  # Test locally
npm run start  # Verify
vercel --prod  # Deploy
```

### Updating dependencies
```powershell
npm outdated
npm update
npm run build  # Test
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

## Emergency Commands

```powershell
# Force stop all Node processes
Get-Process node | Stop-Process -Force

# Clean everything and start fresh
Remove-Item -Recurse -Force node_modules, .next, package-lock.json
npm cache clean --force
npm install
npm run dev
```

## Monitoring & Performance

```powershell
# Check bundle size
npm run build
# Look for "First Load JS" in output

# Analyze bundle
npx @next/bundle-analyzer
```

## Documentation

```powershell
# Generate TypeDoc (if configured)
npx typedoc

# View README in browser
start README.md

# Search documentation
Select-String -Path "*.md" -Pattern "search term"
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build | `npm run build` |
| Install deps | `npm install` |
| Lint | `npm run lint` |
| Clear cache | `npm cache clean --force` |
| Reset project | Delete `node_modules`, `.next` → `npm install` |
| Open browser | `start http://localhost:3000` |
| Stop server | `Ctrl+C` |
| View logs | Check terminal & browser console |

---

## Get Help

- Check `TROUBLESHOOTING.md` for common issues
- Check `README.md` for full documentation
- Check `DEVELOPMENT.md` for development guide
