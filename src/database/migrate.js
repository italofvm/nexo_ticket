const { sql } = require('./index');
const logger = require('../utils/logger');

const migrations = [
  // Phase 2: Panels
  `CREATE TABLE IF NOT EXISTS panels (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL UNIQUE,
    message_id VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    button_label VARCHAR(80),
    button_emoji VARCHAR(100),
    category_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,
  
  // Phase 3: Tickets & Config
  `CREATE TABLE IF NOT EXISTS guild_config (
    guild_id VARCHAR(20) PRIMARY KEY,
    ticket_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL UNIQUE,
    user_id VARCHAR(20) NOT NULL,
    panel_id INTEGER REFERENCES panels(id) ON DELETE SET NULL,
    ticket_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    claimed_by VARCHAR(20),
    category_id VARCHAR(20),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS staff_roles (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL REFERENCES guild_config(guild_id) ON DELETE CASCADE,
    role_id VARCHAR(20) NOT NULL,
    UNIQUE(guild_id, role_id)
  );`,

  // Phase 4: Transcripts
  `CREATE TABLE IF NOT EXISTS transcripts (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    channel_id VARCHAR(20) NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    generated_by VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    format VARCHAR(10) DEFAULT 'html',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Phase 5: Advanced (Expansion)
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS log_channel_id VARCHAR(20);`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS rating_enabled BOOLEAN DEFAULT TRUE;`,
  `ALTER TABLE guild_config ADD COLUMN IF NOT EXISTS welcome_message TEXT;`,

  `CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    staff_id VARCHAR(20),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS ticket_logs (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    performer_id VARCHAR(20) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Production Indices
  `CREATE INDEX IF NOT EXISTS idx_tickets_guild_status ON tickets(guild_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON tickets(user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_panels_guild_channel ON panels(guild_id, channel_id);`,
  `CREATE INDEX IF NOT EXISTS idx_ratings_ticket_id ON ratings(ticket_id);`
];

async function runMigrations() {
  logger.info('Starting database migrations...');
  
  try {
    for (const migration of migrations) {
      await sql.unsafe(migration);
    }
    logger.info('Migrations completed successfully.');
  } catch (err) {
    logger.error('Migration failed: %o', err);
    process.exit(1);
  }
}

// Allow running directly
if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = { runMigrations };
