export type TutorialRole = "admin" | "cashier" | "engineer" | "employee";

export interface TutorialSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface TutorialManual {
  role: TutorialRole;
  displayName: string;
  summary: string;
  lastUpdated: string;
  quickLinks: Array<{ label: string; route?: string }>;
  sections: TutorialSection[];
}

export const tutorialManuals: Record<TutorialRole, TutorialManual> = {
  admin: {
    role: "admin",
    displayName: "Admin Manual",
    summary: "Run organization operations end-to-end: user control, approvals, policy settings, and reporting.",
    lastUpdated: "May 2026",
    quickLinks: [
      { label: "User Management", route: "/admin/users" },
      { label: "Category Management", route: "/admin/categories" },
      { label: "Expense Review", route: "/admin/expenses" },
      { label: "Reports", route: "/admin/reports" },
      { label: "Balances", route: "/balances" },
      { label: "Settings", route: "/settings" },
      { label: "Notifications", route: "/notifications" },
    ],
    sections: [
      {
        id: "admin-getting-started",
        title: "Step 1: Login and Understand Admin Scope",
        paragraphs: [
          "Login to PesoWise and open your dashboard.",
          "As admin, you manage users, categories, form rules, approval workflow, balances, reporting, and organization settings.",
          "Your key goal is to keep the process accurate, auditable, and policy-aligned.",
        ],
      },
      {
        id: "admin-add-own-expense",
        title: "Step 2: Add Your Own Expense",
        paragraphs: [
          "Go to My Expenses and click Add Expense.",
          "Fill required fields, attach receipt/proof, and submit.",
          "Track status exactly like other users (Pending / Approved / Rejected).",
        ],
      },
      {
        id: "admin-user-management",
        title: "Step 3: Add and Manage Users",
        paragraphs: [
          "Open User Management to create and maintain users by role: admin, manager, cashier, employee.",
          "Assign reporting structures correctly (employee -> manager, cashier mappings, location links where applicable).",
          "Use bulk upload for large onboarding and verify org capacity before import.",
          "Deactivate or correct misconfigured users quickly to prevent approval delays.",
        ],
      },
      {
        id: "admin-category-management",
        title: "Step 4: Add and Maintain Categories",
        paragraphs: [
          "Open Category Management to create expense categories used by users in forms and reports.",
          "Keep category names clean and consistent to avoid duplicate analytics buckets.",
          "Use category controls to standardize how spending is tagged across departments.",
        ],
      },
      {
        id: "admin-custom-form-fields",
        title: "Step 5: Configure Custom Form Fields",
        paragraphs: [
          "Go to Settings and configure base/custom expense form fields as per your process.",
          "Set visibility, required status, and where fields appear (submit/review/detail).",
          "Use this to enforce policy-specific data capture (for example project code, travel mode, vendor details).",
        ],
      },
      {
        id: "admin-review-approvals",
        title: "Step 6: Review and Approve Expenses",
        paragraphs: [
          "Use Expense Review to inspect submitted and escalated requests.",
          "Validate business purpose, category correctness, amount-to-receipt match, and comments/history.",
          "Approve valid claims and reject incomplete/incorrect claims with clear action comments.",
        ],
      },
      {
        id: "admin-approval-rules-governance",
        title: "Step 7: Manage Approval Rules",
        paragraphs: [
          "Monitor manager threshold logic and policy settings from organization settings.",
          "Ensure high-value claims route correctly to admin for final decision.",
          "Update limits and related controls as policy evolves.",
        ],
      },
      {
        id: "admin-balances-settlement",
        title: "Step 8: Manage Balances and Transfers",
        paragraphs: [
          "Use Balances to fund users/cashiers, track movement, and maintain accountability.",
          "Record notes for manual adjustments and use transfer history for audit trails.",
          "Review exceptional balance edits to prevent reconciliation gaps.",
        ],
      },
      {
        id: "admin-reports-analytics",
        title: "Step 9: Reports and Analytics",
        paragraphs: [
          "Use Reports to analyze spend by category, user, and time period.",
          "Export reports for finance review and compliance checks.",
          "Use trend analysis to detect unusual patterns and optimize controls.",
        ],
      },
      {
        id: "admin-notifications-ops",
        title: "Step 10: Notifications and Operational Monitoring",
        paragraphs: [
          "Monitor notifications for submissions, escalations, approvals, and rejections.",
          "Use notifications to prioritize urgent actions and reduce pending queue time.",
          "Encourage users to follow role manuals for faster first-pass approvals.",
        ],
      },
      {
        id: "admin-daily-governance-checklist",
        title: "Admin Daily Governance Checklist",
        paragraphs: [
          "Check pending approvals and stale items first.",
          "Verify user-role assignments for any onboarding/offboarding changes.",
          "Review balances/transfers and key exceptions before day close.",
          "Run report spot-checks weekly for policy and budget alignment.",
        ],
      },
    ],
  },
  cashier: {
    role: "cashier",
    displayName: "Cashier / Finance Guide",
    summary: "Monitor, manage, and settle expenses across employees and managers.",
    lastUpdated: "May 2026",
    quickLinks: [
      { label: "Balances", route: "/balances" },
      { label: "Cashier Transactions", route: "/cashier/transactions" },
      { label: "Transfer History", route: "/cash-transfer-history" },
    ],
    sections: [
      {
        id: "cashier-getting-started",
        title: "Step 1: Login to PesoWise",
        paragraphs: [
          "Open PesoWise and enter your login credentials.",
          "You will land directly on the dashboard after successful login.",
        ],
      },
      {
        id: "cashier-dashboard-overview",
        title: "Part 1: Dashboard Overview",
        paragraphs: [
          "From the dashboard, you can view the overall expense summary.",
          "Track balances across employees and managers.",
          "Monitor recent transactions and access analytics insights for cash planning.",
        ],
      },
      {
        id: "cashier-add-own-expense",
        title: "Part 2: Add Your Own Expense",
        paragraphs: [
          "Go to My Expenses from the sidebar.",
          "Click Add Expense and fill Category, Title, Location, Amount, and receipt (if applicable).",
          "Click Submit to record the expense in the system.",
        ],
      },
      {
        id: "cashier-track-all-expenses",
        title: "Part 3: View & Track All Expenses",
        paragraphs: [
          "Cashier can view expenses of all employees and managers.",
          "Track submitted expenses, approved expenses, and pending items.",
        ],
      },
      {
        id: "cashier-settlement-balance",
        title: "Part 4: Settlement & Balance Tracking",
        paragraphs: [
          "Review approved expenses and compare approved amount vs actual expense.",
          "Example: Approved INR 149,999 and actual INR 100,000 means balance INR 49,999.",
          "Collect the remaining amount from employee via cash or transfer.",
          "Update the system with actual expense, returned amount, and mark as Settled/Closed.",
          "Always add notes for exceptions (late submission, partial return, receipt mismatch) for audit clarity.",
        ],
      },
      {
        id: "cashier-analytics",
        title: "Part 5: Analytics & Insights",
        paragraphs: [
          "Use analytics to track highest-spend categories, department-wise spending, and overall financial trends.",
        ],
      },
      {
        id: "cashier-notifications",
        title: "Part 6: Notifications",
        paragraphs: [
          "Monitor notifications for new expenses and manager/admin approvals.",
          "Use these updates to stay current in real time.",
        ],
      },
      {
        id: "cashier-settings",
        title: "Part 7: Settings",
        paragraphs: [
          "Open Settings to manage available platform preferences and operational controls.",
        ],
      },
      {
        id: "cashier-end-of-day-check",
        title: "End-of-Day Check",
        paragraphs: [
          "Ensure all collected returns are recorded and matched against transfer history.",
          "Review any pending settlement items and carry forward action notes for next day follow-up.",
        ],
      },
    ],
  },
  engineer: {
    role: "engineer",
    displayName: "Manager Manual",
    summary: "Add your own expenses, review employee requests, and approve within manager limits.",
    lastUpdated: "May 2026",
    quickLinks: [
      { label: "Manager Review", route: "/review" },
      { label: "Notifications", route: "/notifications" },
    ],
    sections: [
      {
        id: "manager-getting-started",
        title: "Step 1: Login to PesoWise",
        paragraphs: [
          "Open PesoWise and enter your login credentials.",
          "After login, you will land on the dashboard.",
        ],
      },
      {
        id: "manager-add-own-expense",
        title: "Part 1: Adding Your Own Expense (Manager)",
        paragraphs: [
          "Go to My Expenses from the left sidebar.",
          "Click Add Expense and fill Category, Title, Location, Amount, and upload receipt.",
          "Click Submit. Your expense appears in My Expenses with status Pending / Approved / Rejected.",
        ],
      },
      {
        id: "manager-review-employee-expenses",
        title: "Part 2: Reviewing Employee Expenses",
        paragraphs: [
          "Check Notifications on the dashboard for newly submitted expenses.",
          "Go to Review Expenses from the sidebar to view employee requests.",
          "Open View / Approve to review full details, amount, and receipt attachment.",
          "Verify (approve) or reject with remarks when needed.",
          "Use clear rejection comments so employees can correct and resubmit without delay.",
        ],
      },
      {
        id: "manager-approval-rules",
        title: "Approval Rules",
        paragraphs: [
          "If amount is less than or equal to INR 50,000, manager can approve directly.",
          "If amount is greater than INR 50,000, request is sent for admin approval.",
        ],
      },
      {
        id: "manager-status-updates",
        title: "Status Updates",
        paragraphs: [
          "After manager action, expense status updates immediately in the workflow.",
          "Employees can track latest status in their dashboard.",
        ],
      },
      {
        id: "manager-review-checklist",
        title: "Manager Review Checklist",
        paragraphs: [
          "Check amount reasonability against trip purpose and category.",
          "Confirm receipt quality (readable amount/date/vendor) before verification.",
          "Escalate policy exceptions to admin instead of force-approving unclear claims.",
        ],
      },
    ],
  },
  employee: {
    role: "employee",
    displayName: "Employee Guide",
    summary: "Add, submit, and track your expenses from dashboard to final approval.",
    lastUpdated: "May 2026",
    quickLinks: [
      { label: "My Expenses", route: "/expenses" },
      { label: "Create Expense", route: "/expenses/new" },
      { label: "Notifications", route: "/notifications" },
    ],
    sections: [
      {
        id: "employee-getting-started",
        title: "Step 1: Login to PesoWise",
        paragraphs: [
          "Open PesoWise and enter your login credentials.",
          "Once logged in, you will land on the dashboard.",
        ],
      },
      {
        id: "employee-my-expenses",
        title: "Step 2: Go to My Expenses",
        paragraphs: [
          "From the left sidebar, click My Expenses.",
          "This section shows all your submitted expenses.",
        ],
      },
      {
        id: "employee-add-expense",
        title: "Step 3: Add a New Expense",
        paragraphs: [
          "Click Add Expense to open the expense form.",
        ],
      },
      {
        id: "employee-fill-details",
        title: "Step 4: Fill in Expense Details",
        paragraphs: [
          "Enter category (for example, Airfare), title (for example, Business Meeting Travel), location, and total amount.",
          "Upload the receipt or supporting proof before submitting.",
          "Make sure amount entered in the form matches the receipt total.",
        ],
      },
      {
        id: "employee-submit-expense",
        title: "Step 5: Submit Expense",
        paragraphs: [
          "After filling all required fields, click Submit.",
          "Your expense is recorded in the system.",
        ],
      },
      {
        id: "employee-track-status",
        title: "Step 6: View Your Expenses",
        paragraphs: [
          "Return to My Expenses to see your submitted entries.",
          "Track status updates as Pending / Approved / Rejected.",
        ],
      },
      {
        id: "employee-best-practices",
        title: "Good Practices",
        paragraphs: [
          "Upload clear receipts and use descriptive titles so manager/admin can review faster.",
          "Check notifications regularly for remarks or action needed on rejected expenses.",
          "Submit expenses early to avoid period-end approval delays.",
          "If rejected, edit the same expense with corrected details and resubmit promptly.",
        ],
      },
    ],
  },
};
