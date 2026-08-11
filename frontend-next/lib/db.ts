import fs from "fs";
import path from "path";

import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __mcstapPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __mcstapSchemaReady: Promise<void> | undefined;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? "";
}

export function getPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.__mcstapPool) {
    global.__mcstapPool = new Pool({
      connectionString: databaseUrl
    });
  }

  return global.__mcstapPool;
}

export async function ensureSchema() {
  if (!global.__mcstapSchemaReady) {
    global.__mcstapSchemaReady = (async () => {
      const pool = getPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_cases (
          id SERIAL PRIMARY KEY,
          test_case_id VARCHAR(40) NOT NULL UNIQUE,
          title VARCHAR(255) NOT NULL,
          module VARCHAR(40) NOT NULL,
          transaction_code VARCHAR(40),
          process_step TEXT NOT NULL,
          automation_status VARCHAR(40) NOT NULL,
          script_path TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS repository_assets (
          asset_id SERIAL PRIMARY KEY,
          asset_name VARCHAR(255) NOT NULL,
          module VARCHAR(40) NOT NULL,
          transaction_code VARCHAR(40) NOT NULL UNIQUE,
          script_name TEXT,
          description TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'Active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS flow_master (
          id SERIAL PRIMARY KEY,
          flow_id VARCHAR(40) NOT NULL UNIQUE,
          flow_name VARCHAR(255) NOT NULL,
          description TEXT,
          module VARCHAR(40) NOT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'Draft',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS flow_steps (
          step_id SERIAL PRIMARY KEY,
          flow_id VARCHAR(40) NOT NULL,
          sequence_no INTEGER NOT NULL,
          transaction_code VARCHAR(40) NOT NULL,
          description TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_flow_steps_flow_id
            FOREIGN KEY (flow_id) REFERENCES flow_master(flow_id)
            ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS script_master (
          script_id SERIAL PRIMARY KEY,
          script_name VARCHAR(255) NOT NULL,
          module VARCHAR(40) NOT NULL,
          transaction_code VARCHAR(40),
          description TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'Draft',
          created_by VARCHAR(120) NOT NULL DEFAULT 'Next.js',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS script_steps (
          id SERIAL PRIMARY KEY,
          script_id INTEGER NOT NULL,
          step_sequence INTEGER NOT NULL,
          action_type VARCHAR(80) NOT NULL,
          parameter_name VARCHAR(120) NOT NULL DEFAULT '',
          parameter_value TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_script_steps_script_id
            FOREIGN KEY (script_id) REFERENCES script_master(script_id)
            ON DELETE CASCADE,
          CONSTRAINT uq_script_step_sequence UNIQUE (script_id, step_sequence)
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS license_status (
          id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
          install_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          license_key VARCHAR(64),
          activated BOOLEAN NOT NULL DEFAULT FALSE,
          activated_at TIMESTAMP
        )
      `);

      await pool.query(`
        INSERT INTO license_status (id) VALUES (1)
        ON CONFLICT (id) DO NOTHING
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS sap_process_library (
          process_id SERIAL PRIMARY KEY,
          process_name VARCHAR(255) NOT NULL,
          module VARCHAR(40) NOT NULL,
          flow_type VARCHAR(40),
          description TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'Active'
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS sap_process_steps (
          process_step_id SERIAL PRIMARY KEY,
          process_id INTEGER NOT NULL REFERENCES sap_process_library(process_id) ON DELETE CASCADE,
          sequence_no INTEGER NOT NULL,
          transaction_code VARCHAR(40) NOT NULL,
          step_name VARCHAR(255),
          description TEXT
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_command_history (
          id SERIAL PRIMARY KEY,
          command_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const processLibraryCount = await pool.query(`SELECT COUNT(*)::int AS count FROM sap_process_library`);
      if (Number(processLibraryCount.rows[0]?.count ?? 0) === 0) {
        const seedPath = path.join(process.cwd(), "db", "sap_process_seed.sql");
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, "utf-8");
          await pool.query(seedSql);
        }
      }
    })().catch((error) => {
      global.__mcstapSchemaReady = undefined;
      throw error;
    });
  }

  await global.__mcstapSchemaReady;
}
