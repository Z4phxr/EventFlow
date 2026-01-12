#!/usr/bin/env node
/**
 * EventFlow Frontend - Quick Verification Script
 * Run with: node verify-frontend.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 EventFlow Frontend - Part 1 Verification\n');

const checks = [];

// Check 1: Required files exist
console.log('📁 Checking project structure...');
const requiredFiles = [
  '.env.example',
  'src/auth/AuthContext.jsx',
  'src/components/ProtectedRoute.jsx',
  'src/components/Navbar.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/EventsList.jsx',
  'src/pages/EventDetail.jsx',
  'src/pages/OrganizerDashboard.jsx',
  'src/App.jsx',
  'src/api.js',
  'src/index.css',
  'package.json',
  'FRONTEND_README.md',
  'IMPLEMENTATION_SUMMARY.md'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  if (!exists) {
    console.log(`  ❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('  ✅ All required files present\n');
  checks.push({ name: 'Project Structure', status: 'PASS' });
} else {
  console.log('  ❌ Some files are missing\n');
  checks.push({ name: 'Project Structure', status: 'FAIL' });
}

// Check 2: Dependencies
console.log('📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = {
  'react': true,
  'react-dom': true,
  'react-router-dom': true,
  'axios': true
};

let allDepsPresent = true;
Object.keys(requiredDeps).forEach(dep => {
  if (!packageJson.dependencies[dep]) {
    console.log(`  ❌ Missing dependency: ${dep}`);
    allDepsPresent = false;
  }
});

if (allDepsPresent) {
  console.log('  ✅ All dependencies present\n');
  checks.push({ name: 'Dependencies', status: 'PASS' });
} else {
  console.log('  ❌ Some dependencies missing\n');
  checks.push({ name: 'Dependencies', status: 'FAIL' });
}

// Check 3: AuthContext implementation
console.log('🔐 Checking AuthContext...');
const authContext = fs.readFileSync('src/auth/AuthContext.jsx', 'utf8');
const authFeatures = [
  { name: 'AuthProvider', pattern: /export.*AuthProvider/i },
  { name: 'useAuth hook', pattern: /export.*useAuth/i },
  { name: 'JWT decode', pattern: /decodeJWT|decode.*token/i },
  { name: 'login function', pattern: /login.*=.*\(|function login/i },
  { name: 'logout function', pattern: /logout.*=.*\(|function logout/i },
  { name: 'localStorage', pattern: /localStorage/i }
];

let authComplete = true;
authFeatures.forEach(feature => {
  if (!feature.pattern.test(authContext)) {
    console.log(`  ❌ Missing: ${feature.name}`);
    authComplete = false;
  }
});

if (authComplete) {
  console.log('  ✅ AuthContext properly implemented\n');
  checks.push({ name: 'AuthContext', status: 'PASS' });
} else {
  console.log('  ❌ AuthContext incomplete\n');
  checks.push({ name: 'AuthContext', status: 'FAIL' });
}

// Check 4: ProtectedRoute component
console.log('🛡️  Checking ProtectedRoute...');
const protectedRoute = fs.readFileSync('src/components/ProtectedRoute.jsx', 'utf8');
const protectedFeatures = [
  { name: 'useAuth import', pattern: /import.*useAuth/i },
  { name: 'allowedRoles prop', pattern: /allowedRoles/i },
  { name: 'Navigate redirect', pattern: /Navigate.*to/i }
];

let protectedComplete = true;
protectedFeatures.forEach(feature => {
  if (!feature.pattern.test(protectedRoute)) {
    console.log(`  ❌ Missing: ${feature.name}`);
    protectedComplete = false;
  }
});

if (protectedComplete) {
  console.log('  ✅ ProtectedRoute properly implemented\n');
  checks.push({ name: 'ProtectedRoute', status: 'PASS' });
} else {
  console.log('  ❌ ProtectedRoute incomplete\n');
  checks.push({ name: 'ProtectedRoute', status: 'FAIL' });
}

// Check 5: API client configuration
console.log('🌐 Checking API client...');
const apiFile = fs.readFileSync('src/api.js', 'utf8');
const apiFeatures = [
  { name: 'Gateway URL', pattern: /VITE_API_BASE_URL/i },
  { name: 'Request interceptor', pattern: /interceptors\.request/i },
  { name: 'Response interceptor', pattern: /interceptors\.response/i },
  { name: '401 handling', pattern: /401/i },
  { name: 'authAPI', pattern: /authAPI/i },
  { name: 'eventsAPI', pattern: /eventsAPI/i },
  { name: 'registrationsAPI', pattern: /registrationsAPI/i }
];

let apiComplete = true;
apiFeatures.forEach(feature => {
  if (!feature.pattern.test(apiFile)) {
    console.log(`  ❌ Missing: ${feature.name}`);
    apiComplete = false;
  }
});

if (apiComplete) {
  console.log('  ✅ API client properly configured\n');
  checks.push({ name: 'API Client', status: 'PASS' });
} else {
  console.log('  ❌ API client incomplete\n');
  checks.push({ name: 'API Client', status: 'FAIL' });
}

// Check 6: No emojis in EventsList
console.log('🎨 Checking code quality...');
const eventsList = fs.readFileSync('src/pages/EventsList.jsx', 'utf8');
const hasEmojis = /[📍🗓️👥]/u.test(eventsList);

if (!hasEmojis) {
  console.log('  ✅ No emojis in EventsList\n');
  checks.push({ name: 'No Emojis', status: 'PASS' });
} else {
  console.log('  ❌ Emojis found in EventsList\n');
  checks.push({ name: 'No Emojis', status: 'FAIL' });
}

// Check 7: Environment configuration
console.log('⚙️  Checking environment config...');
const envExample = fs.readFileSync('.env.example', 'utf8');
const hasGatewayUrl = /VITE_API_BASE_URL.*8080/i.test(envExample);

if (hasGatewayUrl) {
  console.log('  ✅ Gateway URL configured correctly\n');
  checks.push({ name: 'Environment Config', status: 'PASS' });
} else {
  console.log('  ❌ Gateway URL not configured\n');
  checks.push({ name: 'Environment Config', status: 'FAIL' });
}

// Check 8: Documentation
console.log('📚 Checking documentation...');
const readmeExists = fs.existsSync('FRONTEND_README.md');
const summaryExists = fs.existsSync('IMPLEMENTATION_SUMMARY.md');

if (readmeExists && summaryExists) {
  console.log('  ✅ Documentation complete\n');
  checks.push({ name: 'Documentation', status: 'PASS' });
} else {
  console.log('  ❌ Documentation missing\n');
  checks.push({ name: 'Documentation', status: 'FAIL' });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50) + '\n');

const passed = checks.filter(c => c.status === 'PASS').length;
const total = checks.length;

checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${check.name}: ${check.status}`);
});

console.log('\n' + '='.repeat(50));
console.log(`Result: ${passed}/${total} checks passed`);
console.log('='.repeat(50) + '\n');

if (passed === total) {
  console.log('✅ Frontend Part 1 is ready!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Copy .env.example to .env');
  console.log('3. Run: npm run dev');
  console.log('4. Access: http://localhost:5173');
  console.log('\nSee FRONTEND_README.md for testing instructions.');
} else {
  console.log('❌ Some checks failed. Please review the output above.');
  process.exit(1);
}
