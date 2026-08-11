/**
 * Ported from the command dispatch chain in api/ai_assistant.py. Preserves
 * the original command grammar and branch order so existing muscle-memory
 * commands ("SHOW <process>", "BUILD TEST PLAN FOR <process>", etc.) keep
 * working. The legacy multi-turn "CREATE FLOW" chat wizard (which relied on
 * a global, cross-request mutable dict) is intentionally not ported —
 * flows are created through the Flow Library UI instead.
 */
import { getPool } from "@/lib/db";
import {
  analyzeModule,
  analyzeProcessCoverage,
  buildTestCases,
  buildTestPlan,
  buildTestStrategy,
  getAutomationRecommendations,
  getE2EProcess,
  getMissingAssets,
  getProcessDependencies,
  getProcessSteps
} from "@/lib/ai-skills";

const MODULES = ["CO", "FI", "MM", "PM", "PP", "QM", "SD", "SCM", "TR", "WM"];
const REPOSITORY_MODULES = ["PM", "MM", "FI", "CO", "SD", "WM", "QM", "PP", "SCM", "LO", "TR", "PLM", "PROC"];

function stripPrefix(text: string, pattern: RegExp): string {
  return text.replace(pattern, "").trim();
}

export async function runCommand(question: string): Promise<string> {
  const trimmed = question.trim();
  const upper = trimmed.toUpperCase();

  // Module coverage: "<MODULE> COVERAGE" (not prefixed with SHOW)
  if (upper.includes("COVERAGE") && !upper.startsWith("SHOW ")) {
    const words = upper.split(/\s+/);
    const detectedModule = MODULES.find((mod) => words.includes(mod));

    if (detectedModule) {
      const result = await analyzeModule(detectedModule);
      let answer = `Coverage Analysis\n\nModule: ${result.module}\n\nProcesses: ${result.processes}\nProcess Steps: ${result.steps}\n\nProcesses:\n\n`;
      result.processList.forEach((name) => {
        answer += `- ${name}\n`;
      });
      return answer;
    }

    return "Coverage Analysis\n\nPlease specify a module.\n\nExamples:\n- Analyze CO Coverage\n- Analyze MM Coverage\n- Analyze SD Coverage\n- Analyze FI Coverage";
  }

  // Missing assets: "SHOW MISSING ASSETS FOR <process>"
  if (upper.startsWith("SHOW MISSING ASSETS FOR ")) {
    const processName = stripPrefix(trimmed, /^show\s+missing\s+assets\s+for\s+/i);
    const result = await getMissingAssets(processName);

    if (!result) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Missing Assets Analysis\n\nProcess: ${result.processName}\nModule: ${result.module}\n\nMissing Assets:\n\n`;
    if (result.missing.length) {
      result.missing.forEach((tx) => {
        answer += `❌ ${tx}\n`;
      });
      answer += "\nRecommendation:\n\nCreate automation assets for the missing transactions.";
    } else {
      answer += "No missing assets found.\n\nCoverage appears complete.";
    }
    return answer;
  }

  // Process viewer: "SHOW <process>" (excluding coverage / missing-assets / dependencies / "... PROCESS")
  if (
    upper.startsWith("SHOW ") &&
    !upper.includes("COVERAGE") &&
    !upper.startsWith("SHOW MISSING ASSETS FOR ") &&
    !upper.startsWith("SHOW PROCESS DEPENDENCIES FOR ") &&
    !upper.endsWith(" PROCESS")
  ) {
    const processName = trimmed.replace(/show/gi, "").replace(/process/gi, "").trim();
    const process = await getProcessSteps(processName);

    if (!process) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Process: ${process.processName}\n\nModule: ${process.module}\n\nSteps:\n\n`;
    process.steps.forEach((step) => {
      answer += `${step.sequence}. ${step.transaction} - ${step.stepName}\n`;
    });
    return answer;
  }

  // Process coverage: "SHOW <process> COVERAGE"
  if (upper.startsWith("SHOW ") && upper.includes("COVERAGE")) {
    const processName = stripPrefix(trimmed, /^show\s+/i).replace(/\s+coverage$/i, "").trim();
    const result = await analyzeProcessCoverage(processName);

    if (!result) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Coverage Analysis\n\nProcess: ${result.processName}\nModule: ${result.module}\n\nRequired Transactions: ${result.required}\n\nAvailable:\n\n`;
    result.available.forEach((tx) => {
      answer += `✅ ${tx}\n`;
    });
    answer += "\nMissing:\n\n";
    result.missing.forEach((tx) => {
      answer += `❌ ${tx}\n`;
    });
    answer += `\nCoverage: ${result.coverage}%`;
    return answer;
  }

  // Automation recommendations (ranked)
  if (upper === "WHAT SHOULD WE AUTOMATE NEXT?") {
    const recommendations = await getAutomationRecommendations();
    let answer = "Automation Recommendations\n\n";
    recommendations.forEach((item, index) => {
      answer += `${index + 1}. ${item.process}\nModule: ${item.module}\nCoverage: ${item.coverage}%\nGap: ${item.gap}%\n\n`;
    });
    return answer;
  }

  // Automation recommendations (flat)
  if (upper === "TOP AUTOMATION OPPORTUNITIES") {
    const recommendations = await getAutomationRecommendations();
    let answer = "Top Automation Opportunities\n\n";
    recommendations.forEach((item) => {
      answer += `Process: ${item.process}\nModule: ${item.module}\nCoverage: ${item.coverage}%\n\n`;
    });
    return answer;
  }

  // Test strategy: "BUILD TEST STRATEGY FOR <process>"
  if (upper.startsWith("BUILD TEST STRATEGY FOR ")) {
    const processName = stripPrefix(trimmed, /^build test strategy for\s+/i);
    const result = await buildTestStrategy(processName);

    if (!result) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Test Strategy\n\nProcess: ${result.process}\nModule: ${result.module}\n\nScope:\n\n`;
    result.steps.forEach((step) => {
      answer += `- ${step.transaction} ${step.stepName}\n`;
    });
    return answer;
  }

  // Test plan: "BUILD TEST PLAN FOR <process>"
  if (upper.startsWith("BUILD TEST PLAN FOR ")) {
    const processName = stripPrefix(trimmed, /^build test plan for\s+/i);
    const result = await buildTestPlan(processName);

    if (!result) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Test Plan\n\nProcess: ${result.process}\nModule: ${result.module}\n\n`;
    result.steps.forEach((step, index) => {
      answer += `TC${String(index + 1).padStart(3, "0")}\nTransaction: ${step.transaction}\nAction: ${step.stepName}\n\n`;
    });
    return answer;
  }

  // Process dependencies: "SHOW PROCESS DEPENDENCIES FOR <process>"
  if (upper.startsWith("SHOW PROCESS DEPENDENCIES FOR ")) {
    const processName = stripPrefix(trimmed, /^show process dependencies for\s+/i);
    const result = await getProcessDependencies(processName);

    if (!result) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Process Dependencies\n\nProcess: ${result.processName}\nModule: ${result.module}\n\n`;
    result.steps.forEach((step, index) => {
      answer += `${step.transaction} - ${step.stepName}`;
      if (index < result.steps.length - 1) {
        answer += "\n↓\n";
      }
    });
    return answer;
  }

  // End-to-end process: "SHOW <name> PROCESS"
  if (upper.startsWith("SHOW ") && upper.endsWith(" PROCESS")) {
    const processName = stripPrefix(trimmed, /^show\s+/i).replace(/\s+process$/i, "").trim();
    const steps = getE2EProcess(processName);

    if (!steps) {
      return `End-to-End Process not found:\n\n${processName}`;
    }

    let answer = `${processName}\n\n`;
    steps.forEach((step, index) => {
      answer += step;
      if (index < steps.length - 1) {
        answer += "\n↓\n";
      }
    });
    return answer;
  }

  // Test cases: "BUILD TEST CASES FOR <process>"
  if (upper.startsWith("BUILD TEST CASES FOR ")) {
    const processName = stripPrefix(trimmed, /^build test cases for\s+/i);
    const result = await buildTestCases(processName);

    if (!result) {
      return `Process not found:\n\n${processName}`;
    }

    let answer = `Test Cases\n\nProcess: ${result.process}\nModule: ${result.module}\n\n`;
    result.steps.forEach((step, index) => {
      answer += `TC${String(index + 1).padStart(3, "0")}\n\nTransaction: ${step.transaction}\nDescription: ${step.stepName}\n\nExpected Result:\n${step.stepName} executed successfully.\n\n${"-".repeat(40)}\n\n`;
    });
    return answer;
  }

  // Transaction code lookup
  const transactionMatch = upper.match(/\b[A-Z]{2,5}[0-9]{2,3}[A-Z]?\b/);
  if (transactionMatch) {
    const transactionCode = transactionMatch[0];
    const pool = getPool();
    const result = await pool.query(
      `SELECT asset_name, module, transaction_code, script_name FROM repository_assets WHERE transaction_code = $1`,
      [transactionCode]
    );

    if (result.rows.length) {
      const asset = result.rows[0];
      return `Yes.\n\nTransaction: ${asset.transaction_code}\nModule: ${asset.module}\nAsset Name: ${asset.asset_name}\nScript: ${asset.script_name ?? ""}`;
    }

    return `No repository asset found for transaction ${transactionCode}.`;
  }

  // Module asset listing fallback
  const detectedModule = REPOSITORY_MODULES.find((mod) => upper.includes(mod));
  if (detectedModule) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT asset_name FROM repository_assets WHERE module = $1 ORDER BY asset_name`,
      [detectedModule]
    );

    if (result.rows.length) {
      let answer = `${detectedModule} Repository Assets:\n\n`;
      result.rows.forEach((row) => {
        answer += `- ${row.asset_name}\n`;
      });
      return answer;
    }

    return `Module ${detectedModule} recognized.\n\nNo repository assets found yet.`;
  }

  return "I could not understand the question.";
}
