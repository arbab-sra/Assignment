const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting syncbits Watch Party System (Backend & Frontend)...\n');

// Spawn server dev process
const server = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

// Spawn client dev process
const client = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\n🛑 Shutting down server and client...');
  if (server) server.kill();
  if (client) client.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
