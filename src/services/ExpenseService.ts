import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { formatINR } from "@/lib/format";
import { 
  notifyExpenseVerified, 
  notifyExpenseApproved, 
  notifyExpenseSubmitted,
  notifyEngineerExpenseApproved,
  notifyExpenseRejected,
  notifyExpenseVerifiedToAdmin
} from "./NotificationService";

// Helper function to get user's organization_id
async function getUserOrganizationId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.organization_id;
}

/**
 * Prefer over `.single()` on `profiles`: missing or duplicate rows cause PostgREST 406
 * "Cannot coerce the result to a single JSON object".
 */
async function selectFirstProfileRow(
  userId: string,
  columns: string
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
  const { data, error } = await supabase
    .from("profiles")
    .select(columns)
    .eq("user_id", userId)
    .limit(1);
  if (error) return { data: null, error };
  const row = data && data.length > 0 ? (data[0] as Record<string, unknown>) : null;
  return { data: row, error: null };
}

async function selectFirstOrgSettingsRow(
  organizationId: string,
  columns: string
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
  const { data, error } = await supabase
    .from("organization_settings")
    .select(columns)
    .eq("organization_id", organizationId)
    .limit(1);
  if (error) return { data: null, error };
  const row = data && data.length > 0 ? (data[0] as Record<string, unknown>) : null;
  return { data: row, error: null };
}

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];
type LineItem = Database["public"]["Tables"]["expense_line_items"]["Row"];
type LineItemInsert = Database["public"]["Tables"]["expense_line_items"]["Insert"];

export interface ExpenseWithLineItems extends Expense {
  expense_line_items: LineItem[];
}

export interface CreateExpenseData {
  title: string;
  destination: string;
  trip_start: string;
  trip_end: string;
  purpose?: string;
  amount: number;
  category: string;
}

export interface UpdateExpenseData {
  title?: string;
  destination?: string;
  trip_start?: string;
  trip_end?: string;
  purpose?: string;
  status?: "submitted" | "verified" | "approved";
  admin_comment?: string;
  assigned_engineer_id?: string;
  amount?: number;
  category?: string;
}

export class ExpenseService {
  /**
   * Create a new expense with line items
   * Automatically computes total amount from line items
   */
  static async createExpense(
    userId: string,
    data: CreateExpenseData
  ): Promise<ExpenseWithLineItems> {
    // Get user's organization_id
    const organizationId = await getUserOrganizationId(userId);
    if (!organizationId) {
      throw new Error("User is not associated with an organization");
    }

    // No line items in creation flow; use provided amount as total
    const totalAmount = Number(data.amount || 0);

    // Start transaction
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title: data.title,
        destination: data.destination,
        trip_start: data.trip_start,
        trip_end: data.trip_end,
        purpose: data.purpose,
        category: data.category,
        total_amount: totalAmount,
        // Create first, then submitExpense() will move it to "submitted" and write the submitted audit log.
        // This avoids UI showing "Submitted" while audit logs/attachments are still being finalized.
        status: "draft",
      })
      .select()
      .maybeSingle();

    if (expenseError) {
      console.error("Expense creation error:", expenseError);
      throw new Error(`Failed to create expense: ${expenseError.message || 'Unknown error'}`);
    }
    if (!expense) {
      throw new Error("Failed to create expense: no row returned");
    }

    // No line items to insert
    const lineItems: LineItem[] = [];

    // Log the action
    await this.logAction(expense.id, userId, organizationId, "expense_created", "Expense created");

    return {
      ...expense,
      expense_line_items: lineItems,
    };
  }

  /**
   * Update an existing expense
   * Recalculates total amount if line items are updated
   */
  static async updateExpense(
    expenseId: string,
    userId: string,
    data: UpdateExpenseData
  ): Promise<ExpenseWithLineItems> {
    // Get user's organization_id
    const organizationId = await getUserOrganizationId(userId);
    if (!organizationId) {
      throw new Error("User is not associated with an organization");
    }

    // Check if user can edit this expense
    const canEdit = await this.canUserEditExpense(expenseId, userId, organizationId);
    console.log('🔍 [ExpenseService] Can edit check:', {
      expenseId,
      userId,
      organizationId,
      canEdit
    });
    if (!canEdit) {
      // Get expense details for better error message
      const { data: expenseCheck } = await supabase
        .from("expenses")
        .select("user_id, status, organization_id")
        .eq("id", expenseId)
        .maybeSingle();
      console.error('❌ [ExpenseService] Cannot edit expense:', {
        expenseUserId: expenseCheck?.user_id,
        expenseStatus: expenseCheck?.status,
        expenseOrgId: expenseCheck?.organization_id,
        currentUserId: userId,
        currentOrgId: organizationId
      });
      throw new Error("You don't have permission to edit this expense");
    }

    // Get current expense (filtered by organization)
    const { data: currentExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!currentExpense) throw new Error("Expense not found or you don't have access");

    // Check if expense can be edited (submitted or rejected expenses can be edited, not verified or approved)
    if (currentExpense.status !== "submitted" && currentExpense.status !== "rejected" && currentExpense.status !== "draft" && !data.status) {
      throw new Error("Only draft, submitted, or rejected expenses can be edited. Verified or approved expenses cannot be modified.");
    }

    const totalAmount = typeof data.amount === 'number' ? data.amount : currentExpense.total_amount;

    // Update expense - exclude 'amount' from spread since expenses table uses 'total_amount'
    const { amount, ...dataWithoutAmount } = data;
    const updateData: ExpenseUpdate = {
      ...dataWithoutAmount,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedExpense) throw new Error("Failed to update expense (no row returned)");

    // No line item updates; fetch none
    const lineItems: LineItem[] = [];

    // Log the action
    const action = data.status ? `status_changed_to_${data.status}` : "expense_updated";
    await this.logAction(expenseId, userId, organizationId, action, data.admin_comment);

    return {
      ...updatedExpense,
      expense_line_items: lineItems,
    };
  }

  /**
   * Submit an expense for review
   * If user is admin, automatically approves and deducts from their balance
   */
  static async submitExpense(expenseId: string, userId: string): Promise<Expense> {
    // Fetch the expense first so we can use its actual organization_id.
    // This avoids update mismatches when a user has multiple org memberships.
    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!expense) throw new Error("Expense not found or you don't have access");

    const organizationId = expense.organization_id as string | null;
    if (!organizationId) throw new Error("Expense is missing organization_id");

    // Check if attachments are required based on amount (from organization_settings)
    const { data: orgSettings, error: orgSettingsSelectError } = await selectFirstOrgSettingsRow(
      organizationId,
      "attachment_required_above_amount"
    );
    if (orgSettingsSelectError) throw orgSettingsSelectError;

    const rawLimit = orgSettings?.attachment_required_above_amount;
    const attachmentLimit =
      rawLimit !== null && rawLimit !== undefined && !Number.isNaN(Number(rawLimit))
        ? Number(rawLimit)
        : 50;
    const expenseAmount = Number(expense.total_amount);
    const requiresAttachment = expenseAmount > attachmentLimit;

    if (requiresAttachment) {
      // Check if expense has attachments (filtered by organization_id)
      const { data: attachments, error: attachmentsError } = await supabase
        .from("attachments")
        .select("id")
        .eq("expense_id", expenseId)
        .eq("organization_id", organizationId)
        .limit(1);

      if (attachmentsError) {
        console.error("Error checking attachments:", attachmentsError);
        throw new Error(
          `Failed to verify attachments. Please try again or contact support.`
        );
      } else if (!attachments || attachments.length === 0) {
        throw new Error(
          `Bill photos are required for expenses above ₹${attachmentLimit}. ` +
          `This expense (₹${expenseAmount}) exceeds the limit. Please upload at least one photo of your receipt or bill.`
        );
      }
    }

    // Check if user is an admin and this is their own expense - if so, auto-approve and auto-deduct
    const isAdmin = await this.hasOrgRole(userId, organizationId, "admin");
    
    if (isAdmin && expense.user_id === userId) {
      // Admin's own expense - auto-approve and auto-deduct (allows negative balance)
      // First ensure status is "submitted" so approveExpense can handle it
      if (expense.status !== "submitted") {
        await supabase
          .from("expenses")
          .update({ status: "submitted" })
          .eq("id", expenseId);
      }
      // Auto-approve admin expenses (this will deduct from their balance, allowing negative)
      return await this.approveExpense(expenseId, userId, "Auto-approved: Admin expense");
    }

    // Check if user can submit this expense
    const canEdit = await this.canUserEditExpense(expenseId, userId, organizationId);
    if (!canEdit) {
      throw new Error("You don't have permission to submit this expense");
    }

    // Allow resubmitting rejected expenses
    const isResubmission = expense.status === "rejected";
    if (expense.status !== "submitted" && expense.status !== "rejected" && expense.status !== "draft") {
      throw new Error("Only draft, submitted, or rejected expenses can be submitted");
    }

    // Line items are not required anymore for submission

    // Check if user is an engineer
    const isEngineer = await this.hasOrgRole(userId, organizationId, "engineer");

    if (isEngineer) {
      // Engineers' expenses go directly to admin (no engineer assignment)
      const updatePayload: any = {
        status: "submitted",
        assigned_engineer_id: null, // No engineer assignment - goes to admin
        updated_at: new Date().toISOString(),
      };

      const { data: updatedExpense, error: updateError } = await supabase
        .from("expenses")
        .update(updatePayload)
        .eq("id", expenseId)
        .eq("organization_id", organizationId)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;
      // Some orgs/environments may block "UPDATE ... returning" via RLS/select policies.
      // Treat it as success if the row can be refetched.
      let submittedExpense = updatedExpense;
      if (!submittedExpense) {
        const { data: refetched, error: refetchErr } = await supabase
          .from("expenses")
          .select("id, status, title")
          .eq("id", expenseId)
          .eq("organization_id", organizationId)
          .maybeSingle();
        if (refetchErr) throw refetchErr;
        submittedExpense = refetched ?? null;
      }
      if (!submittedExpense) throw new Error("Failed to submit expense (row not found after update)");
      if (submittedExpense.status !== "submitted") {
        throw new Error(
          `Submission failed: expense status is still "${submittedExpense.status}". Please try again or contact support.`
        );
      }

      // Log the action
      const actionType = isResubmission ? "expense_resubmitted" : "expense_submitted";
      const logMsg = isResubmission
        ? `Expense resubmitted after rejection by engineer - sent directly to admin`
        : `Expense submitted by engineer - sent directly to admin`;
      await this.logAction(expenseId, userId, organizationId, actionType, logMsg);

      // Get expense title and employee name (filtered by organization)
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("title")
        .eq("id", expenseId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      const { data: employeeProfileRow, error: employeeProfileErr } = await selectFirstProfileRow(
        userId,
        "name"
      );
      if (employeeProfileErr) throw employeeProfileErr;
      const employeeName = (employeeProfileRow?.name as string | undefined) || "Engineer";

      // Get all admin user IDs in this organization
      const { data: adminMemberships } = await supabase
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("role", "admin")
        .eq("is_active", true);

      const adminUserIds = adminMemberships?.map(m => m.user_id) || [];

      // Notify all admins
      if (expenseData && adminUserIds.length > 0) {
        // Do not block the submission flow on notification delivery.
        void notifyExpenseSubmitted(
          expenseId,
          expenseData.title,
          employeeName,
          null, // No engineer assigned
          adminUserIds
        ).catch((e) => console.error("notifyExpenseSubmitted failed (admin notifications):", e));
      }

      return submittedExpense as Expense;
    }

    // For employees: Find employee's reporting engineer
    const { data: profileRow, error: profileError } = await selectFirstProfileRow(
      userId,
      "reporting_engineer_id"
    );
    if (profileError) throw profileError;

    const reportingEngineerId =
      (profileRow?.reporting_engineer_id as string | null | undefined) ?? null;

    // If employee has a reporting engineer, assign to them
    // If not, send directly to admin (assigned_engineer_id = null)
    const updatePayload: any = {
      status: "submitted",
      assigned_engineer_id: reportingEngineerId, // null if no engineer assigned
      updated_at: new Date().toISOString(),
    };

    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update(updatePayload)
      .eq("id", expenseId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    let submittedExpense = updatedExpense;
    if (!submittedExpense) {
      const { data: refetched, error: refetchErr } = await supabase
        .from("expenses")
        .select("id, status, title")
        .eq("id", expenseId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (refetchErr) throw refetchErr;
      submittedExpense = refetched ?? null;
    }
    if (!submittedExpense) throw new Error("Failed to submit expense (row not found after update)");
    if (submittedExpense.status !== "submitted") {
      throw new Error(
        `Submission failed: expense status is still "${submittedExpense.status}". Please try again or contact support.`
      );
    }

    // Get expense title and employee name
    const { data: expenseData } = await supabase
      .from("expenses")
      .select("title")
      .eq("id", expenseId)
      .maybeSingle();

    const { data: employeeProfileRow2, error: employeeProfileErr2 } = await selectFirstProfileRow(
      userId,
      "name"
    );
    if (employeeProfileErr2) throw employeeProfileErr2;
    const employeeName =
      (employeeProfileRow2?.name as string | undefined) || "Employee";

    // Log resubmission if this was a rejected expense
    const actionType = isResubmission ? "expense_resubmitted" : "expense_submitted";
    
    if (reportingEngineerId) {
      // Employee has reporting engineer - assign to engineer and notify them
      const logMsg = isResubmission 
        ? `Expense resubmitted after rejection and auto-assigned to engineer ${reportingEngineerId}`
        : `Expense submitted and auto-assigned to engineer ${reportingEngineerId}`;
      await this.logAction(expenseId, userId, organizationId, actionType, logMsg);

      // Notify assigned engineer
      if (expenseData) {
        void notifyExpenseSubmitted(
          expenseId,
          expenseData.title,
          employeeName,
          reportingEngineerId
        ).catch((e) => console.error("notifyExpenseSubmitted failed (engineer notifications):", e));
      }
    } else {
      // Employee has no reporting engineer - send directly to admin
      const logMsg = isResubmission
        ? `Expense resubmitted after rejection by employee without assigned engineer - sent directly to admin`
        : `Expense submitted by employee without assigned engineer - sent directly to admin`;
      await this.logAction(expenseId, userId, organizationId, actionType, logMsg);

      // Get all admin user IDs in this organization
      const { data: adminMemberships } = await supabase
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("role", "admin")
        .eq("is_active", true);

      const adminUserIds = adminMemberships?.map(m => m.user_id) || [];

      // Notify all admins
      if (expenseData && adminUserIds.length > 0) {
        void notifyExpenseSubmitted(
          expenseId,
          expenseData.title,
          employeeName,
          null, // No engineer assigned
          adminUserIds
        ).catch((e) => console.error("notifyExpenseSubmitted failed (admin notifications no engineer):", e));
      }
    }

    return submittedExpense as Expense;
  }

  /**
   * Assign expense to an engineer
   */
  static async assignToEngineer(
    expenseId: string,
    engineerId: string,
    adminId: string
  ): Promise<Expense> {
    // Get admin's organization_id
    const organizationId = await getUserOrganizationId(adminId);
    if (!organizationId) {
      throw new Error("Admin is not associated with an organization");
    }

    // Check if admin has permission
    const isAdmin = await this.hasOrgRole(adminId, organizationId, "admin");
    if (!isAdmin) {
      throw new Error("Only administrators can assign expenses to engineers");
    }

    // Check if engineer exists and has engineer role in same organization
    const isEngineer = await this.hasOrgRole(engineerId, organizationId, "engineer");
    if (!isEngineer) {
      throw new Error("Assigned user must have engineer role in your organization");
    }

    // Update expense (filtered by organization)
    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update({
        assigned_engineer_id: engineerId,
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedExpense) throw new Error("Failed to assign expense (no row returned)");

    // Log the action
    await this.logAction(expenseId, adminId, organizationId, "expense_assigned", `Assigned to engineer ${engineerId}`);

    return updatedExpense;
  }

  /**
   * Verify expense (engineer action)
   */
  static async verifyExpense(
    expenseId: string,
    engineerId: string,
    comment?: string
  ): Promise<Expense> {
    // Get engineer's organization_id
    const organizationId = await getUserOrganizationId(engineerId);
    if (!organizationId) {
      throw new Error("Engineer is not associated with an organization");
    }

    // Check if engineer has permission
    const canReview = await this.canEngineerReviewExpense(expenseId, engineerId, organizationId);
    if (!canReview) {
      throw new Error("You don't have permission to review this expense");
    }

    // Ensure expense is not finalized (filtered by organization)
    const { data: current, error: curErr } = await supabase
      .from("expenses")
      .select("status")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (curErr) throw curErr;
    if (!current) throw new Error("Expense not found or you don't have access");
    if (current.status === "approved") {
      throw new Error("This expense is already approved and cannot be updated");
    }
    if (current.status !== "submitted") {
      throw new Error("Only submitted expenses can be verified");
    }

    // Update expense status to verified (filtered by organization)
    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update({
        status: "verified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedExpense) throw new Error("Failed to verify (no row returned)");

    // Log the action
    await this.logAction(expenseId, engineerId, organizationId, "expense_verified", comment);

    // Get expense details and employee info for notification (filtered by organization)
    const { data: expenseData, error: expenseFetchError } = await supabase
      .from("expenses")
      .select("title, user_id, total_amount")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!expenseFetchError && expenseData) {
      // Get engineer name
      const { data: engineerRow, error: engProfErr } = await selectFirstProfileRow(engineerId, "name");
      if (engProfErr) console.error("verifyExpense: engineer profile", engProfErr);
      const engineerName = (engineerRow?.name as string | undefined) || "Engineer";

      // Get employee name
      const { data: employeeRow, error: empProfErr } = await selectFirstProfileRow(
        expenseData.user_id,
        "name"
      );
      if (empProfErr) console.error("verifyExpense: employee profile", empProfErr);
      const employeeName = (employeeRow?.name as string | undefined) || "Employee";

      // Create notification for employee
      await notifyExpenseVerified(
        expenseId,
        expenseData.title,
        expenseData.user_id,
        engineerName
      );

      // Check if expense is above threshold - if so, notify admins (from organization_settings)
      const { data: orgSettings, error: orgLimErr } = await selectFirstOrgSettingsRow(
        organizationId,
        "engineer_approval_limit"
      );
      if (orgLimErr) console.error("verifyExpense: organization_settings", orgLimErr);

      const approvalLimit = Number(orgSettings?.engineer_approval_limit ?? 50000) || 50000;
      const expenseAmount = Number(expenseData.total_amount);
      
      // If expense is at or above threshold, notify all admins in organization
      if (expenseAmount >= approvalLimit) {
        const { data: adminMemberships } = await supabase
          .from("organization_memberships")
          .select("user_id")
          .eq("organization_id", organizationId)
          .eq("role", "admin")
          .eq("is_active", true);
        
        const adminUserIds = adminMemberships?.map(m => m.user_id) || [];
        
        if (adminUserIds.length > 0) {
          await notifyExpenseVerifiedToAdmin(
            expenseId,
            expenseData.title,
            employeeName,
            engineerName,
            expenseAmount,
            adminUserIds
          );
        }
      }
    }

    return updatedExpense;
  }

  /**
   * Approve expense (admin or engineer action)
   */
  static async approveExpense(
    expenseId: string,
    approverId: string,
    comment?: string
  ): Promise<Expense> {
    // Get approver's organization_id
    const organizationId = await getUserOrganizationId(approverId);
    if (!organizationId) {
      throw new Error("Approver is not associated with an organization");
    }

    // Check if approver has permission (admin or engineer) in this organization
    const isAdmin = await this.hasOrgRole(approverId, organizationId, "admin");
    const isEngineer = await this.hasOrgRole(approverId, organizationId, "engineer");
    if (!isAdmin && !isEngineer) {
      throw new Error("Only administrators or engineers can approve expenses");
    }

    // Fetch expense first for amount and user_id (filtered by organization)
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, user_id, total_amount, title, status')
      .eq('id', expenseId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!expense) throw new Error("Expense not found or you don't have access");

    // Check if expense is already approved
    if (expense.status === "approved") {
      throw new Error("This expense is already approved");
    }
    
    // Engineers can approve submitted expenses (below limit)
    // Admins can approve both submitted and verified expenses (auto-verifies submitted expenses)
    if (isEngineer && expense.status !== "submitted") {
      throw new Error("Engineers can only approve submitted expenses");
    }
    
    // Check engineer approval limit if engineer is trying to approve
    if (isEngineer) {
      const { data: engineerLimitRow, error: limitError } = await selectFirstOrgSettingsRow(
        organizationId,
        "engineer_approval_limit"
      );

      if (limitError) {
        console.error("Error fetching engineer approval limit:", limitError);
        throw new Error("Unable to verify approval limit. Please contact administrator.");
      }

      const rawLimit = engineerLimitRow?.engineer_approval_limit;
      const approvalLimit =
        rawLimit !== null && rawLimit !== undefined && !Number.isNaN(Number(rawLimit))
          ? Number(rawLimit)
          : 50000;
      const expenseAmount = Number(expense.total_amount);
      
      console.log("Manager approval check:", { 
        expenseAmount, 
        approvalLimit, 
        exceeds: expenseAmount > approvalLimit,
        expenseId: expense.id
      });
      
      // Engineers can only approve if expense amount <= limit
      // If expense amount > limit, they must verify instead
      if (expenseAmount > approvalLimit) {
        throw new Error(
          `This expense (${formatINR(expenseAmount)}) exceeds the manager approval limit of ${formatINR(approvalLimit)}. ` +
          `Please verify this expense instead. It will be sent to admin for final approval.`
        );
      }
    }
    
    if (isAdmin && expense.status !== "submitted" && expense.status !== "verified") {
      throw new Error("Admins can only approve submitted or verified expenses");
    }
    
    // If admin is approving a submitted expense, auto-verify it first
    if (isAdmin && expense.status === "submitted") {
      // Auto-verify: Update status to verified first (filtered by organization)
      const { error: verifyError } = await supabase
        .from("expenses")
        .update({
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", expenseId)
        .eq("organization_id", organizationId);
      
      if (verifyError) throw verifyError;
      
      // Log the auto-verification
      await this.logAction(expenseId, approverId, organizationId, "expense_verified", "Auto-verified by admin during approval");
      
      // Get admin name for notification
      const { data: adminProfileRow, error: adminProfErr } = await selectFirstProfileRow(
        approverId,
        "name"
      );
      if (adminProfErr) console.error("approveExpense (auto-verify): admin profile", adminProfErr);
      const adminProfile = adminProfileRow ? { name: adminProfileRow.name as string | undefined } : null;
      
      // Send verification notification to employee
      await notifyExpenseVerified(
        expenseId,
        expense.title,
        expense.user_id,
        adminProfile?.name || "Admin"
      );
      
      // Update expense status for the rest of the function
      expense.status = "verified";
    }

    // Get current balance before approval
    const { data: profile, error: profError } = await selectFirstProfileRow(expense.user_id, "balance, name");

    if (profError) throw profError;
    if (!profile) {
      throw new Error(
        "Could not load your profile to update balance. Please contact support if this continues."
      );
    }

    const currentBalance = Number(profile.balance ?? 0);
    const expenseAmount = Number(expense.total_amount);
    
    // Allow negative balances - expense can be approved even if balance is insufficient
    // The balance will go negative and can be compensated later when balance is added

    // Update expense (filtered by organization)
    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update({
        status: "approved",
        admin_comment: comment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedExpense) throw new Error("Failed to approve (no row returned)");

    // Deduct employee balance (allows negative balance)
    const newBalance = currentBalance - expenseAmount;
    const { error: balanceUpdateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', expense.user_id);

    if (balanceUpdateError) {
      // If balance update fails, revert expense status
      await supabase
        .from("expenses")
        .update({
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", expenseId);
      
      throw new Error("Failed to deduct balance. Expense approval reverted.");
    }

    // Log the action with balance information (handles negative balances)
    const balanceStatus = newBalance < 0 ? `Negative balance: ${formatINR(Math.abs(newBalance))}` : `Remaining balance: ${formatINR(newBalance)}`;
    const logComment = `${comment || ''} Balance deducted: ${formatINR(expenseAmount)}. ${balanceStatus}`.trim();
    await this.logAction(expenseId, approverId, organizationId, "expense_approved", logComment);

    // Get approver name for notification
    const { data: approverRow, error: approverProfErr } = await selectFirstProfileRow(approverId, "name");
    if (approverProfErr) console.error("approveExpense: approver profile", approverProfErr);
    const approverProfile = approverRow
      ? { name: approverRow.name as string | undefined }
      : null;

    // Check if the expense owner is an engineer in this organization
    const expenseOwnerIsEngineer = await this.hasOrgRole(expense.user_id, organizationId, "engineer");

    if (expenseOwnerIsEngineer) {
      // Notify engineer that their expense was approved
      await notifyEngineerExpenseApproved(
        expenseId,
        expense.title,
        expense.user_id,
        approverProfile?.name || (isAdmin ? "Admin" : "Engineer"),
        expenseAmount
      );
    } else {
      // Notify employee that their expense was approved
      await notifyExpenseApproved(
        expenseId,
        expense.title,
        expense.user_id,
        approverProfile?.name || (isAdmin ? "Admin" : "Engineer"),
        expenseAmount
      );
    }

    return updatedExpense;
  }

  /**
   * Reject expense (admin or engineer action)
   */
  static async rejectExpense(
    expenseId: string,
    rejectorId: string,
    comment?: string
  ): Promise<Expense> {
    // Get rejector's organization_id
    const organizationId = await getUserOrganizationId(rejectorId);
    if (!organizationId) {
      throw new Error("Rejector is not associated with an organization");
    }

    // Check if rejector has permission (admin or engineer) in this organization
    const isAdmin = await this.hasOrgRole(rejectorId, organizationId, "admin");
    const isEngineer = await this.hasOrgRole(rejectorId, organizationId, "engineer");
    if (!isAdmin && !isEngineer) {
      throw new Error("Only administrators or engineers can reject expenses");
    }

    // Fetch expense to check status and get user_id (filtered by organization)
    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("id, user_id, title, status")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!expense) throw new Error("Expense not found or you don't have access");

    // Check if expense can be rejected (not already approved or rejected)
    if (expense.status === "approved") {
      throw new Error("Approved expenses cannot be rejected");
    }
    if (expense.status === "rejected") {
      throw new Error("This expense is already rejected");
    }

    // For engineers, check if they can review this expense
    if (isEngineer) {
      const canReview = await this.canEngineerReviewExpense(expenseId, rejectorId, organizationId);
      if (!canReview) {
        throw new Error("You don't have permission to reject this expense");
      }
    }

    // Update expense (filtered by organization)
    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update({
        status: "rejected",
        admin_comment: comment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedExpense) throw new Error("Failed to reject (no row returned)");

    // Log the action
    await this.logAction(expenseId, rejectorId, organizationId, "expense_rejected", comment);

    // Get rejector name for notification
    const { data: rejectorRow, error: rejectorProfErr } = await selectFirstProfileRow(rejectorId, "name");
    if (rejectorProfErr) console.error("rejectExpense: rejector profile", rejectorProfErr);
    const rejectorProfile = rejectorRow
      ? { name: rejectorRow.name as string | undefined }
      : null;

    // Send notification to expense owner
    await notifyExpenseRejected(
      expenseId,
      expense.title,
      expense.user_id,
      rejectorProfile?.name || (isAdmin ? "Admin" : "Engineer"),
      comment
    );

    return updatedExpense;
  }

  /**
   * Get expense with line items
   */
  static async getExpense(expenseId: string, userId: string): Promise<ExpenseWithLineItems | null> {
    // Get user's organization_id
    const organizationId = await getUserOrganizationId(userId);
    if (!organizationId) return null;

    // Get expense (filtered by organization)
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (expenseError) return null;
    if (!expense) return null;

    // Get line items (filtered by organization)
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("expense_line_items")
      .select("*")
      .eq("expense_id", expenseId)
      .eq("organization_id", organizationId);

    if (lineItemsError) return null;

    return {
      ...expense,
      expense_line_items: lineItems || [],
    };
  }

  /**
   * Check if user can edit expense
   */
  private static async canUserEditExpense(expenseId: string, userId: string, organizationId?: string): Promise<boolean> {
    // Get organization_id if not provided
    if (!organizationId) {
      organizationId = await getUserOrganizationId(userId);
      if (!organizationId) return false;
    }

    // Check if user is admin in this organization
    const isAdmin = await this.hasOrgRole(userId, organizationId, "admin");
    if (isAdmin) return true;

    // Check if user is engineer (manager) - they can submit their own expenses
    const isEngineer = await this.hasOrgRole(userId, organizationId, "engineer");
    
    // Check if user owns the expense (filtered by organization)
    const { data: expense, error } = await supabase
      .from("expenses")
      .select("user_id, status, organization_id")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      console.error('❌ [ExpenseService] Error fetching expense for edit check:', error);
      return false;
    }

    if (!expense) {
      console.error('❌ [ExpenseService] Expense not found:', expenseId);
      return false;
    }

    console.log('🔍 [ExpenseService] Expense ownership check:', {
      expenseUserId: expense.user_id,
      currentUserId: userId,
      expenseStatus: expense.status,
      expenseOrgId: expense.organization_id,
      currentOrgId: organizationId,
      isOwner: expense.user_id === userId,
      allowedStatuses: ['submitted', 'draft', 'rejected'],
      statusMatches: ['submitted', 'draft', 'rejected'].includes(expense.status)
    });

    // Users can edit/submit their own expenses if:
    // 1. They own it AND status is "submitted" or "rejected" (for editing/resubmitting)
    // 2. They own it AND status is "draft" (for editing)
    // 3. They are engineer/admin (already checked above)
    const canEdit = expense.user_id === userId && (expense.status === "submitted" || expense.status === "draft" || expense.status === "rejected");
    console.log('✅ [ExpenseService] Final canEdit result:', canEdit);
    return canEdit;
  }

  /**
   * Check if manager can review expense
   */
  private static async canEngineerReviewExpense(expenseId: string, engineerId: string, organizationId: string): Promise<boolean> {
    const { data: expense, error } = await supabase
      .from("expenses")
      .select("assigned_engineer_id")
      .eq("id", expenseId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) return false;
    if (!expense) return false;

    return expense.assigned_engineer_id === engineerId;
  }

  /**
   * Check if user has specific role in organization
   */
  private static async hasOrgRole(userId: string, organizationId: string, role: "admin" | "engineer" | "employee" | "cashier"): Promise<boolean> {
    // Return false if userId is empty or invalid
    if (!userId || userId.trim() === "") {
      return false;
    }

    const { data, error } = await supabase
      .from("organization_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("role", role)
      .eq("is_active", true)
      .maybeSingle();

    if (error) return false;

    return !!data;
  }

  /**
   * Log action in audit trail
   */
  private static async logAction(
    expenseId: string,
    userId: string,
    organizationId: string,
    action: string,
    comment?: string
  ): Promise<void> {
    // Some deployments have `audit_logs` without `organization_id`. Try the richer insert first,
    // then fall back to the minimal payload.
    const payload: any = {
      expense_id: expenseId,
      user_id: userId,
      action,
      comment,
    };

    try {
      await supabase
        .from("audit_logs")
        .insert({
          ...payload,
          organization_id: organizationId,
        });
    } catch (e) {
      await supabase
        .from("audit_logs")
        .insert(payload);
    }
  }
}
