/**
 * Ported from services/ai_skills/*.py in the legacy app. Each function
 * mirrors the original SQL against sap_process_library / sap_process_steps
 * / repository_assets so the AI Assistant answers from real data instead
 * of static template text.
 */
import { getPool } from "@/lib/db";

export type ModuleCoverageResult = {
  module: string;
  processes: number;
  steps: number;
  processList: string[];
};

export async function analyzeModule(moduleName: string): Promise<ModuleCoverageResult> {
  const pool = getPool();

  const processCountResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM sap_process_library WHERE module = $1`,
    [moduleName]
  );

  const stepCountResult = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM sap_process_steps s
      JOIN sap_process_library p ON s.process_id = p.process_id
      WHERE p.module = $1
    `,
    [moduleName]
  );

  const processListResult = await pool.query(
    `SELECT process_name FROM sap_process_library WHERE module = $1 ORDER BY process_name LIMIT 15`,
    [moduleName]
  );

  return {
    module: moduleName,
    processes: Number(processCountResult.rows[0]?.count ?? 0),
    steps: Number(stepCountResult.rows[0]?.count ?? 0),
    processList: processListResult.rows.map((row) => row.process_name as string)
  };
}

async function findProcess(processName: string): Promise<{ id: number; name: string; module: string } | null> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT process_id, process_name, module
      FROM sap_process_library
      WHERE UPPER(process_name) = $1
      ORDER BY process_id
      LIMIT 1
    `,
    [processName.toUpperCase()]
  );

  if (!result.rows.length) {
    return null;
  }

  const row = result.rows[0];
  return { id: Number(row.process_id), name: row.process_name as string, module: row.module as string };
}

export type ProcessStepsResult = {
  processName: string;
  module: string;
  steps: { sequence: number; transaction: string; stepName: string }[];
};

export async function getProcessSteps(processName: string): Promise<ProcessStepsResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT DISTINCT sequence_no, transaction_code, step_name
      FROM sap_process_steps
      WHERE process_id = $1
      ORDER BY sequence_no
    `,
    [process.id]
  );

  return {
    processName: process.name,
    module: process.module,
    steps: result.rows.map((row) => ({
      sequence: Number(row.sequence_no),
      transaction: row.transaction_code as string,
      stepName: row.step_name as string
    }))
  };
}

export type ProcessCoverageResult = {
  processName: string;
  module: string;
  required: number;
  available: string[];
  missing: string[];
  coverage: number;
};

export async function analyzeProcessCoverage(processName: string): Promise<ProcessCoverageResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const stepsResult = await pool.query(
    `SELECT DISTINCT transaction_code FROM sap_process_steps WHERE process_id = $1 ORDER BY transaction_code`,
    [process.id]
  );

  const available: string[] = [];
  const missing: string[] = [];

  for (const row of stepsResult.rows) {
    const transactionCode = row.transaction_code as string;
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM repository_assets WHERE transaction_code = $1`,
      [transactionCode]
    );
    if (Number(countResult.rows[0]?.count ?? 0) > 0) {
      available.push(transactionCode);
    } else {
      missing.push(transactionCode);
    }
  }

  const total = stepsResult.rows.length;
  const coverage = total ? Math.round((available.length / total) * 100) : 0;

  return { processName: process.name, module: process.module, required: total, available, missing, coverage };
}

export type MissingAssetsResult = { processName: string; module: string; missing: string[] };

export async function getMissingAssets(processName: string): Promise<MissingAssetsResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const stepsResult = await pool.query(
    `SELECT DISTINCT transaction_code FROM sap_process_steps WHERE process_id = $1 ORDER BY transaction_code`,
    [process.id]
  );

  const missing: string[] = [];
  for (const row of stepsResult.rows) {
    const transactionCode = row.transaction_code as string;
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM repository_assets WHERE transaction_code = $1`,
      [transactionCode]
    );
    if (Number(countResult.rows[0]?.count ?? 0) === 0) {
      missing.push(transactionCode);
    }
  }

  return { processName: process.name, module: process.module, missing };
}

export type AutomationRecommendation = { process: string; module: string; coverage: number; gap: number };

export async function getAutomationRecommendations(): Promise<AutomationRecommendation[]> {
  const pool = getPool();

  const groupedResult = await pool.query(
    `
      SELECT p.process_name, p.module, COUNT(DISTINCT s.transaction_code)::int AS required_steps
      FROM sap_process_library p
      JOIN sap_process_steps s ON p.process_id = s.process_id
      GROUP BY p.process_name, p.module
    `
  );

  const recommendations: AutomationRecommendation[] = [];

  for (const row of groupedResult.rows) {
    const processName = row.process_name as string;
    const moduleName = row.module as string;
    const requiredSteps = Number(row.required_steps ?? 0);

    const stepsResult = await pool.query(
      `
        SELECT DISTINCT s.transaction_code
        FROM sap_process_steps s
        JOIN sap_process_library p ON s.process_id = p.process_id
        WHERE p.process_name = $1
      `,
      [processName]
    );

    let available = 0;
    for (const stepRow of stepsResult.rows) {
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM repository_assets WHERE transaction_code = $1`,
        [stepRow.transaction_code]
      );
      if (Number(countResult.rows[0]?.count ?? 0) > 0) {
        available += 1;
      }
    }

    const coverage = requiredSteps ? Math.round((available / requiredSteps) * 100) : 0;
    recommendations.push({ process: processName, module: moduleName, coverage, gap: 100 - coverage });
  }

  recommendations.sort((a, b) => b.gap - a.gap);
  return recommendations.slice(0, 10);
}

export type TestStrategyResult = {
  process: string;
  module: string;
  steps: { transaction: string; stepName: string }[];
};

export async function buildTestStrategy(processName: string): Promise<TestStrategyResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const result = await pool.query(
    `SELECT transaction_code, step_name FROM sap_process_steps WHERE process_id = $1 ORDER BY sequence_no`,
    [process.id]
  );

  return {
    process: process.name,
    module: process.module,
    steps: result.rows.map((row) => ({ transaction: row.transaction_code as string, stepName: row.step_name as string }))
  };
}

export type TestPlanResult = {
  process: string;
  module: string;
  steps: { sequence: number; transaction: string; stepName: string }[];
};

export async function buildTestPlan(processName: string): Promise<TestPlanResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT DISTINCT ON (transaction_code) sequence_no, transaction_code, step_name
      FROM sap_process_steps
      WHERE process_id = $1
      ORDER BY transaction_code, sequence_no
    `,
    [process.id]
  );

  const steps = result.rows
    .map((row) => ({
      sequence: Number(row.sequence_no),
      transaction: row.transaction_code as string,
      stepName: row.step_name as string
    }))
    .sort((a, b) => a.sequence - b.sequence);

  return { process: process.name, module: process.module, steps };
}

export type ProcessDependenciesResult = {
  processName: string;
  module: string;
  steps: { sequence: number; transaction: string; stepName: string }[];
};

export async function getProcessDependencies(processName: string): Promise<ProcessDependenciesResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT DISTINCT ON (transaction_code) sequence_no, transaction_code, step_name
      FROM sap_process_steps
      WHERE process_id = $1
      ORDER BY transaction_code, sequence_no
    `,
    [process.id]
  );

  const steps = result.rows
    .map((row) => ({
      sequence: Number(row.sequence_no),
      transaction: row.transaction_code as string,
      stepName: row.step_name as string
    }))
    .sort((a, b) => a.sequence - b.sequence);

  return { processName: process.name, module: process.module, steps };
}

const E2E_PROCESSES: Record<string, string[]> = {
  "PROCURE TO PAY": ["Purchase Requisition", "Purchase Order", "Goods Receipt", "Vendor Invoice", "Vendor Payment"],
  "ORDER TO CASH": ["Quotation", "Sales Order", "Delivery", "Billing", "Incoming Payment"],
  "RECORD TO REPORT": ["Journal Entry", "General Ledger", "Financial Closing", "Financial Reporting"],
  "HIRE TO RETIRE": ["Recruitment", "Hiring", "Employee Administration", "Payroll", "Retirement"]
};

export function getE2EProcess(processName: string): string[] | null {
  return E2E_PROCESSES[processName.toUpperCase()] ?? null;
}

export type TestCasesResult = {
  process: string;
  module: string;
  steps: { sequence: number; transaction: string; stepName: string }[];
};

export async function buildTestCases(processName: string): Promise<TestCasesResult | null> {
  const process = await findProcess(processName);
  if (!process) return null;

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT DISTINCT ON (transaction_code) sequence_no, transaction_code, step_name
      FROM sap_process_steps
      WHERE process_id = $1
      ORDER BY transaction_code, sequence_no
    `,
    [process.id]
  );

  const steps = result.rows
    .map((row) => ({
      sequence: Number(row.sequence_no),
      transaction: row.transaction_code as string,
      stepName: row.step_name as string
    }))
    .sort((a, b) => a.sequence - b.sequence);

  return { process: process.name, module: process.module, steps };
}

export async function recordCommand(commandText: string): Promise<void> {
  const pool = getPool();
  await pool.query(`INSERT INTO ai_command_history (command_text) VALUES ($1)`, [commandText]);
}

export async function getRecentCommands(limit = 15): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query(`SELECT command_text FROM ai_command_history ORDER BY id DESC LIMIT $1`, [limit]);
  return result.rows.map((row) => row.command_text as string);
}
