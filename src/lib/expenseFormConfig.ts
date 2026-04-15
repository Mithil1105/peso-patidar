export type BaseExpenseFieldKey =
  | "category"
  | "title"
  | "destination"
  | "expense_date"
  | "purpose"
  | "amount";

export type BaseFieldConfig = {
  field_key: BaseExpenseFieldKey;
  label: string;
  help_text?: string | null;
  is_visible: boolean;
  is_required: boolean;
  display_order: number;
  show_on_submit: boolean;
  show_on_review: boolean;
  show_on_detail: boolean;
};

export const DEFAULT_BASE_FIELD_CONFIG: Record<BaseExpenseFieldKey, BaseFieldConfig> = {
  category: {
    field_key: "category",
    label: "Category",
    is_visible: true,
    is_required: true,
    display_order: 10,
    show_on_submit: true,
    show_on_review: true,
    show_on_detail: true,
  },
  title: {
    field_key: "title",
    label: "Title",
    is_visible: true,
    is_required: true,
    display_order: 20,
    show_on_submit: true,
    show_on_review: true,
    show_on_detail: true,
  },
  destination: {
    field_key: "destination",
    label: "Vendor / Location",
    is_visible: true,
    is_required: true,
    display_order: 30,
    show_on_submit: true,
    show_on_review: true,
    show_on_detail: true,
  },
  expense_date: {
    field_key: "expense_date",
    label: "Expense Date",
    is_visible: true,
    is_required: true,
    display_order: 40,
    show_on_submit: true,
    show_on_review: true,
    show_on_detail: true,
  },
  purpose: {
    field_key: "purpose",
    label: "Purpose",
    is_visible: true,
    is_required: false,
    display_order: 50,
    show_on_submit: true,
    show_on_review: true,
    show_on_detail: true,
  },
  amount: {
    field_key: "amount",
    label: "Amount",
    is_visible: true,
    is_required: true,
    display_order: 60,
    show_on_submit: true,
    show_on_review: true,
    show_on_detail: true,
  },
};

export function resolveBaseFieldConfig(
  rows: Partial<BaseFieldConfig>[] | null | undefined
): Record<BaseExpenseFieldKey, BaseFieldConfig> {
  const resolved = { ...DEFAULT_BASE_FIELD_CONFIG };
  for (const row of rows || []) {
    const key = row.field_key as BaseExpenseFieldKey | undefined;
    if (!key || !(key in resolved)) continue;
    resolved[key] = {
      ...resolved[key],
      ...row,
      field_key: key,
    };
  }
  return resolved;
}

export function slugifyFieldKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}
