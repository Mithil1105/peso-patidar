export type BulkUserCsvRole = "admin" | "engineer" | "employee" | "cashier";

export type BulkUserCsvRow = {
  name: string;
  email: string;
  role: BulkUserCsvRole;
  password: string;
  assigned_manager_email?: string;
  location?: string;
};

const headerAliasMap: Record<string, keyof BulkUserCsvRow | "position"> = {
  name: "name",
  full_name: "name",
  employee_name: "name",
  email: "email",
  email_address: "email",
  role: "role",
  position: "position",
  password: "password",
  assigned_manager: "assigned_manager_email",
  assigned_manager_email: "assigned_manager_email",
  manager_email: "assigned_manager_email",
  location: "location",
  location_name: "location",
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let curr = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        curr += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(curr.trim());
      curr = "";
      continue;
    }
    curr += ch;
  }
  out.push(curr.trim());
  return out;
}

function mapPositionToRole(value: string): BulkUserCsvRole | null {
  const v = value.trim().toLowerCase();
  if (["admin", "administrator"].includes(v)) return "admin";
  if (["engineer", "manager"].includes(v)) return "engineer";
  if (["employee", "staff", "user"].includes(v)) return "employee";
  if (["cashier"].includes(v)) return "cashier";
  return null;
}

export function parseBulkUsersCsv(text: string): { rows: BulkUserCsvRow[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { rows: [], errors: ["CSV is empty"] };

  const rawHeaders = parseCsvLine(lines[0]);
  const mappedHeaders = rawHeaders.map((h) => headerAliasMap[normalizeHeader(h)] || null);
  const errors: string[] = [];
  const rows: BulkUserCsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const rowObj: Record<string, string> = {};
    mappedHeaders.forEach((key, idx) => {
      if (!key) return;
      rowObj[key] = (values[idx] || "").trim();
    });

    const name = rowObj.name || "";
    const email = (rowObj.email || "").toLowerCase();
    const password = rowObj.password || "";
    const resolvedRole = (rowObj.role as BulkUserCsvRole) || mapPositionToRole(rowObj.position || "") || null;

    if (!name || !email || !password || !resolvedRole) {
      errors.push(`Row ${i + 1}: name, email, role/position, and password are required`);
      continue;
    }

    rows.push({
      name,
      email,
      password,
      role: resolvedRole,
      assigned_manager_email: rowObj.assigned_manager_email || undefined,
      location: rowObj.location || undefined,
    });
  }

  return { rows, errors };
}

export function resolveManagerUserId(
  assignedManagerEmail: string | undefined,
  importedByEmail: Map<string, string>,
  existingByEmail: Map<string, string>
): string | undefined {
  const emailKey = normalizeHeader(String(assignedManagerEmail || ""));
  if (emailKey) {
    const exactEmail = String(assignedManagerEmail || "").trim().toLowerCase();
    const byEmail = importedByEmail.get(exactEmail) || existingByEmail.get(exactEmail);
    if (byEmail) return byEmail;
  }
  return undefined;
}
