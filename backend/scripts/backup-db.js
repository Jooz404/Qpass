const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const DB_NAME = 'qpass_bitung';
const DB_USER = 'postgres';
const DB_HOST = 'localhost';
const DB_PORT = '5432';
const BACKUP_DIR = path.join(__dirname, '../backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(BACKUP_DIR, `qpass-bitung-backup-${timestamp}.sql`);

// PostgreSQL backup command
const pgDumpCommand = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -f "${backupFile}"`;

console.log(`🗄️  Starting backup of ${DB_NAME}...`);
console.log(`📁 Backup file: ${backupFile}`);

// Execute backup
exec(pgDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error);
    console.error('stderr:', stderr);
    process.exit(1);
  }

  console.log('✅ Backup completed successfully!');
  console.log(`📦 Backup saved to: ${backupFile}`);

  // Get file size
  const stats = fs.statSync(backupFile);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Backup size: ${fileSizeInMB} MB`);

  // Clean up old backups (keep last 7 days)
  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files.filter(f => f.startsWith('qpass-bitung-backup-') && f.endsWith('.sql'));
  
  // Sort by modification time (oldest first)
  backupFiles.sort((a, b) => {
    const statA = fs.statSync(path.join(BACKUP_DIR, a));
    const statB = fs.statSync(path.join(BACKUP_DIR, b));
    return statA.mtime - statB.mtime;
  });

  // Keep only last 7 backups
  if (backupFiles.length > 7) {
    const filesToDelete = backupFiles.slice(0, backupFiles.length - 7);
    console.log(`🗑️  Cleaning up ${filesToDelete.length} old backup(s)...`);
    
    filesToDelete.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`   Deleted: ${file}`);
    });
  }

  console.log('✨ Backup process completed!');
});
