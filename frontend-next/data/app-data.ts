export type NavLink = {
  label: string;
  href: string;
  icon: string;
  children?: NavLink[];
};

export type TileItem = {
  title: string;
  description: string;
  href?: string;
  kicker?: string;
};

export type DashboardSection = {
  title: string;
  description: string;
  items: TileItem[];
};

export type TestCase = {
  id: string;
  title: string;
  module: string;
  transaction: string;
  processStep: string;
  status: "Manual" | "Automated";
  scriptPath: string;
};

export type Flow = {
  id: string;
  name: string;
  description: string;
  module: string;
  status: "Draft" | "Ready" | "Active";
};

export type FlowStep = {
  id: string;
  flowId: string;
  sequence: number;
  transaction: string;
  description: string;
};

export type ScriptDefinition = {
  id: string;
  name: string;
  module: string;
  transaction: string;
  status: "Draft" | "Ready" | "Active";
};

export type ScriptStep = {
  id: string;
  scriptId: string;
  sequence: number;
  action: string;
  parameterName: string;
  parameterValue: string;
};

export const menuLinks: NavLink[] = [
  { label: "Dashboard", href: "/", icon: "▣" },
  { label: "Test Cases", href: "/test-cases", icon: "✓" },
  { label: "Flow Library", href: "/flow-library", icon: "≣" },
  { label: "Repository", href: "/repository", icon: "⌘" },
  { label: "AI Assistant", href: "/ai", icon: "◌" },
  { label: "Reports", href: "/reports", icon: "◫" },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: "⚙",
    children: [
      { label: "Update", href: "/maintenance/update", icon: "⟳" },
      { label: "Licence", href: "/maintenance/license", icon: "⚿" }
    ]
  }
];

export const dashboardSections: DashboardSection[] = [
  {
    title: "Test Management",
    description: "Planning, traceability, and requirement coverage.",
    items: [
      { title: "Business Requirements", description: "Requirements management workspace.", kicker: "Govern" },
      { title: "Test Coverage", description: "Coverage dashboards by module and automation depth.", href: "/coverage", kicker: "Measure" },
      { title: "Partner Test Management", description: "Coordinate shared execution ownership and approvals.", kicker: "Collaborate" },
      { title: "Test Plan Management", description: "Prepare scope, releases, and execution waves.", kicker: "Plan" }
    ]
  },
  {
    title: "Test Suite",
    description: "Design flows, author scripts, and manage executable assets.",
    items: [
      { title: "Test Suite Preparation", description: "Business flow designer and lifecycle setup.", href: "/flow-library", kicker: "Design" },
      { title: "Test Cases", description: "Capture and maintain reusable functional coverage.", href: "/test-cases", kicker: "Curate" },
      { title: "Test Repository", description: "Browse module assets and automation inventory.", href: "/repository", kicker: "Catalog" },
      { title: "Scripts Studio", description: "Templates, builder, recorder, and script library.", href: "/script-studio", kicker: "Build" },
      { title: "AI Assistant", description: "Guided support for planning scripts, flows, and execution paths.", href: "/ai", kicker: "Assist" }
    ]
  },
  {
    title: "Reporting",
    description: "Execution outcomes, risk visibility, and coverage insights.",
    items: [
      { title: "Analytics", description: "Operational reporting and pipeline trends.", kicker: "Observe" },
      { title: "Coverage", description: "Coverage analysis across SAP modules.", href: "/coverage", kicker: "Inspect" },
      { title: "Reports", description: "Execution results and linked Allure reports.", href: "/reports", kicker: "Review" },
      { title: "Risk Assessment", description: "Module-by-module risk prioritization.", href: "/risk", kicker: "Prioritize" }
    ]
  }
];

export const pmSections: DashboardSection[] = [
  {
    title: "Maintenance Order Lifecycle",
    description: "Core order creation and maintenance transactions.",
    items: [
      { title: "IW31", description: "Create Order", kicker: "Create" },
      { title: "IW32", description: "Change Order", kicker: "Maintain" },
      { title: "IW33", description: "Display Order", kicker: "Inspect" }
    ]
  },
  {
    title: "Processing",
    description: "Downstream operational and confirmation activities.",
    items: [
      { title: "IW39", description: "Display Orders", kicker: "Track" },
      { title: "IW40", description: "Order Processing", kicker: "Process" },
      { title: "IW41", description: "Confirmation", kicker: "Confirm" },
      { title: "IW23", description: "Notification", kicker: "Notify" }
    ]
  },
  {
    title: "Purchasing",
    description: "Related procurement steps used in PM scenarios.",
    items: [{ title: "ME51N", description: "Purchase Requisition", kicker: "Request" }]
  },
  {
    title: "Execution Center",
    description: "Launch end-to-end PM lifecycle automation.",
    items: [
      {
        title: "Execute PM Lifecycle",
        description: "Full automated business process execution path.",
        href: "/pm/execution",
        kicker: "Run"
      }
    ]
  }
];

export const repositoryModules = ["PM", "MM", "FI", "CO", "SD", "WM", "QM", "PP", "SCM", "TR", "LO", "PLM", "PROC"];

export const studioSections: DashboardSection[] = [
  {
    title: "Automation Templates",
    description: "Standardized building blocks for SAP script flows.",
    items: [
      { title: "Login", description: "SAP login template and session bootstrap.", href: "/script-studio/login", kicker: "Template" },
      { title: "Start Transaction", description: "Launch a transaction into a ready state.", href: "/script-studio/transaction", kicker: "Template" },
      { title: "Logout", description: "Close the SAP session cleanly.", href: "/script-studio/logout", kicker: "Template" }
    ]
  },
  {
    title: "Script Builder",
    description: "Author, capture, and organize generated automation scripts.",
    items: [
      { title: "Create Script", description: "Build automation scripts step by step.", href: "/script-studio/builder", kicker: "Author" },
      { title: "SAP Recorder", description: "Capture repeatable SAP interaction sequences.", href: "/script-studio/recorder", kicker: "Capture" },
      { title: "Script Library", description: "Manage generated scripts and reusable assets.", href: "/script-studio/library", kicker: "Manage" }
    ]
  }
];

export const coverageSummary = [
  { label: "Total Test Steps", value: "1,248", note: "Based on the current repository snapshot." },
  { label: "Automated Steps", value: "1,046", note: "High reuse across PM and CO flows." },
  { label: "Coverage", value: "84%", note: "Weighted across active module inventory." },
  { label: "SAP Modules", value: "12", note: "Tracked in the current rollout model." }
];

export const moduleCoverage = [
  { module: "Plant Maintenance (PM)", percent: 92 },
  { module: "Material Management (MM)", percent: 78 },
  { module: "Finance & Accounting (FI)", percent: 65 },
  { module: "Controlling (CO)", percent: 87 },
  { module: "Sales & Distribution (SD)", percent: 48 },
  { module: "Warehouse Management (WM)", percent: 60 },
  { module: "Treasury (TR)", percent: 60 },
  { module: "Logistics (LO)", percent: 60 },
  { module: "Production Planning (PP)", percent: 60 },
  { module: "Product Lifecycle Management (PLM)", percent: 60 }
];

export const riskSummary = [
  { label: "Overall Risk Score", value: "62", note: "Weighted by coverage, frequency, and change volume." },
  { label: "High Risk", value: "6", note: "Immediate attention recommended." },
  { label: "Medium Risk", value: "3", note: "Monitor for upcoming releases." },
  { label: "Low Risk", value: "3", note: "Sustained through stable automation." }
];

export const riskItems = [
  { module: "PM", risk: "Low", severity: "success" as const },
  { module: "CO", risk: "Low", severity: "success" as const },
  { module: "MM", risk: "Medium", severity: "warning" as const },
  { module: "FI", risk: "Medium", severity: "warning" as const },
  { module: "SD", risk: "High", severity: "danger" as const },
  { module: "WM", risk: "High", severity: "danger" as const },
  { module: "TR", risk: "High", severity: "danger" as const },
  { module: "LO", risk: "High", severity: "danger" as const },
  { module: "PP", risk: "High", severity: "danger" as const },
  { module: "PLM", risk: "High", severity: "danger" as const },
  { module: "QM", risk: "High", severity: "danger" as const },
  { module: "SCM", risk: "High", severity: "danger" as const },
  { module: "PROC", risk: "High", severity: "danger" as const }
];

export const recommendations = [
  "Increase SCM automation coverage.",
  "Increase PROC automation coverage.",
  "Increase QM automation coverage.",
  "Increase PLM automation coverage.",
  "Increase PP automation coverage.",
  "Increase LO automation coverage.",
  "Increase TR automation coverage.",
  "Increase SD automation coverage.",
  "Increase WM test execution frequency.",
  "Review FI regression scope.",
  "Maintain PM and CO coverage levels."
];

export const testCases: TestCase[] = [
  {
    id: "TC-1001",
    title: "PM Order Creation",
    module: "PM",
    transaction: "IW31",
    processStep: "Create maintenance order with planner group and work center defaults.",
    status: "Automated",
    scriptPath: "tests/test_iw31_flow.py"
  },
  {
    id: "TC-1002",
    title: "PM Confirmation Validation",
    module: "PM",
    transaction: "IW41",
    processStep: "Confirm order operations and validate time posting outcomes.",
    status: "Automated",
    scriptPath: "tests/test_iw41_flow.py"
  },
  {
    id: "TC-1003",
    title: "MM Purchase Requisition",
    module: "MM",
    transaction: "ME51N",
    processStep: "Create purchase requisition from PM-triggered material request.",
    status: "Automated",
    scriptPath: "tests/test_me51n_flow.py"
  },
  {
    id: "TC-1004",
    title: "CO Cost Center Creation",
    module: "CO",
    transaction: "KS01",
    processStep: "Create cost center and validate lifecycle completion fields.",
    status: "Automated",
    scriptPath: "tests/CO/KS01_CREATE_COST_CENTER.py"
  },
  {
    id: "TC-1005",
    title: "FI Journal Posting Smoke Test",
    module: "FI",
    transaction: "FB50",
    processStep: "Journal posting smoke validation for regression pack.",
    status: "Manual",
    scriptPath: "pending"
  }
];

export const flows: Flow[] = [
  {
    id: "FL-001",
    name: "PM Order Lifecycle",
    description: "Create, release, confirm, and review a maintenance order with purchasing integration.",
    module: "PM",
    status: "Active"
  },
  {
    id: "FL-002",
    name: "Cost Center Lifecycle",
    description: "Create, update, display, and block cost centers across CO validations.",
    module: "CO",
    status: "Ready"
  },
  {
    id: "FL-003",
    name: "ME51N Requisition Pack",
    description: "Purchase requisition coverage for child rows, item details, and validation rules.",
    module: "MM",
    status: "Draft"
  }
];

export const flowSteps: FlowStep[] = [
  {
    id: "STEP-001",
    flowId: "FL-001",
    sequence: 1,
    transaction: "IW31",
    description: "Create a maintenance order with planner group, work center, and core header details."
  },
  {
    id: "STEP-002",
    flowId: "FL-001",
    sequence: 2,
    transaction: "IW32",
    description: "Update the order with downstream changes and validate maintenance processing fields."
  },
  {
    id: "STEP-003",
    flowId: "FL-001",
    sequence: 3,
    transaction: "IW41",
    description: "Confirm operations and capture execution completion details for the PM lifecycle."
  },
  {
    id: "STEP-004",
    flowId: "FL-002",
    sequence: 1,
    transaction: "KS01",
    description: "Create the cost center baseline record with controlling area and master data fields."
  },
  {
    id: "STEP-005",
    flowId: "FL-002",
    sequence: 2,
    transaction: "KS02",
    description: "Adjust cost center master data and verify the expected field-level updates."
  },
  {
    id: "STEP-006",
    flowId: "FL-002",
    sequence: 3,
    transaction: "KS04",
    description: "Block the cost center and confirm lifecycle closure for the scenario."
  },
  {
    id: "STEP-007",
    flowId: "FL-003",
    sequence: 1,
    transaction: "ME51N",
    description: "Create the initial purchase requisition with header and item-level validations."
  },
  {
    id: "STEP-008",
    flowId: "FL-003",
    sequence: 2,
    transaction: "ME51N",
    description: "Validate child-row behavior, line item details, and follow-up save actions."
  }
];

export const scripts: ScriptDefinition[] = [
  {
    id: "SCR-001",
    name: "PM Lifecycle Driver",
    module: "PM",
    transaction: "IW31",
    status: "Active"
  },
  {
    id: "SCR-002",
    name: "Cost Center Lifecycle",
    module: "CO",
    transaction: "KS01",
    status: "Ready"
  },
  {
    id: "SCR-003",
    name: "ME51N Requisition Builder",
    module: "MM",
    transaction: "ME51N",
    status: "Draft"
  }
];

export const scriptSteps: ScriptStep[] = [
  {
    id: "SCRIPT-STEP-001",
    scriptId: "SCR-001",
    sequence: 1,
    action: "LOGIN",
    parameterName: "system",
    parameterValue: "S4Q"
  },
  {
    id: "SCRIPT-STEP-002",
    scriptId: "SCR-001",
    sequence: 2,
    action: "START_TRANSACTION",
    parameterName: "transaction_code",
    parameterValue: "IW31"
  },
  {
    id: "SCRIPT-STEP-003",
    scriptId: "SCR-001",
    sequence: 3,
    action: "EXECUTE_FLOW",
    parameterName: "flow_name",
    parameterValue: "PM Lifecycle"
  },
  {
    id: "SCRIPT-STEP-004",
    scriptId: "SCR-001",
    sequence: 4,
    action: "LOGOUT",
    parameterName: "session",
    parameterValue: "default"
  },
  {
    id: "SCRIPT-STEP-005",
    scriptId: "SCR-002",
    sequence: 1,
    action: "LOGIN",
    parameterName: "system",
    parameterValue: "S4Q"
  },
  {
    id: "SCRIPT-STEP-006",
    scriptId: "SCR-002",
    sequence: 2,
    action: "START_TRANSACTION",
    parameterName: "transaction_code",
    parameterValue: "KS01"
  },
  {
    id: "SCRIPT-STEP-007",
    scriptId: "SCR-002",
    sequence: 3,
    action: "VERIFY_TEXT",
    parameterName: "status_bar",
    parameterValue: "Cost center created"
  },
  {
    id: "SCRIPT-STEP-008",
    scriptId: "SCR-003",
    sequence: 1,
    action: "LOGIN",
    parameterName: "system",
    parameterValue: "S4Q"
  },
  {
    id: "SCRIPT-STEP-009",
    scriptId: "SCR-003",
    sequence: 2,
    action: "START_TRANSACTION",
    parameterName: "transaction_code",
    parameterValue: "ME51N"
  }
];
