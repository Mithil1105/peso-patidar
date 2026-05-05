import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type UserRole = "admin" | "engineer" | "employee" | "cashier";
type UserRow = {
  name?: string;
  email?: string;
  role?: UserRole;
  position?: string;
  password?: string;
  assigned_manager_email?: string;
  location?: string;
};
type Body = { organization_id?: string; dry_run?: boolean; rows?: UserRow[] };
const MAX_ROWS = 500;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_LIMIT_ERROR =
  "The user limit for this organization has been reached. Please remove some existing users or contact us to upgrade your plan.";

async function resolveAdminOrg(client: any, callerId: string, requestedOrgId?: string) {
  const { data, error } = await client
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .eq("is_active", true);
  if (error || !data?.length) throw new Error("Only organization admins can run bulk imports.");
  if (requestedOrgId) {
    const allowed = data.some((m: any) => m.organization_id === requestedOrgId);
    if (!allowed) throw new Error("You are not an admin of the requested organization.");
    return requestedOrgId;
  }
  return data[0].organization_id as string;
}

function randomPassword(): string {
  return `Pw!${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}aA1`;
}

function normalize(value: string | undefined | null): string {
  return String(value || "").trim().toLowerCase();
}

function resolveRole(row: UserRow): UserRole | null {
  if (row.role) return row.role;
  const p = normalize(row.position);
  if (p === "admin" || p === "administrator") return "admin";
  if (p === "engineer" || p === "manager") return "engineer";
  if (p === "employee" || p === "staff" || p === "user") return "employee";
  if (p === "cashier") return "cashier";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Server misconfiguration");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization token");
    const jwt = authHeader.replace("Bearer ", "");

    const body = (await req.json()) as Body;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) throw new Error("rows[] is required");
    if (rows.length > MAX_ROWS) throw new Error(`rows[] exceeds max allowed size (${MAX_ROWS})`);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authUserData, error: authUserError } = await serviceClient.auth.getUser(jwt);
    if (authUserError || !authUserData.user) throw new Error("Invalid or expired token");
    const organizationId = await resolveAdminOrg(serviceClient, authUserData.user.id, body.organization_id);
    const dryRun = body.dry_run === true;
    const { data: organizationData, error: organizationError } = await serviceClient
      .from("organizations")
      .select("max_users")
      .eq("id", organizationId)
      .maybeSingle();
    if (organizationError) throw new Error(`Failed to read organization limits: ${organizationError.message}`);

    const { count: activeMemberCount, error: activeCountError } = await serviceClient
      .from("organization_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true);
    if (activeCountError) throw new Error(`Failed to read active member count: ${activeCountError.message}`);

    const orgMaxUsers =
      organizationData?.max_users === null || organizationData?.max_users === undefined
        ? null
        : Number(organizationData.max_users);
    const activeMembersBefore = Number(activeMemberCount || 0);
    let projectedActiveMembers = activeMembersBefore;

    type RowResult = {
      index: number;
      ok: boolean;
      email?: string;
      user_id?: string;
      action?: string;
      warnings?: string[];
      error?: string;
    };
    const results: RowResult[] = [];
    const pass1: Array<{ index: number; email: string; role: UserRole; name: string; user_id: string; assigned_manager_email?: string; location?: string }> = [];

    // Pass 1: validate + create/lookup + assign role
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const name = String(row.name || "").trim().slice(0, 120);
      const email = normalize(row.email);
      const role = resolveRole(row);
      if (!name || !email || !role || !EMAIL_REGEX.test(email)) {
        results.push({ index: i, ok: false, email, error: "name, email, and role/position are required" });
        continue;
      }

      if (dryRun) {
        results.push({
          index: i,
          ok: true,
          email,
          action: "would_create_or_link",
          warnings: [],
        });
        pass1.push({
          index: i,
          email,
          role,
          name,
          user_id: `dry-run-${i}`,
          assigned_manager_email: normalize(row.assigned_manager_email) || undefined,
          location: String(row.location || "").trim() || undefined,
        });
        continue;
      }

      let userId: string | null = null;
      let existingMembership = false;
      let consumesNewSeat = false;

      // 1) Check if auth user already exists by profile email
      const { data: existingProfile } = await serviceClient
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();
      if (existingProfile?.user_id) {
        userId = existingProfile.user_id as string;

        const { data: membershipRow, error: membershipError } = await serviceClient
          .from("organization_memberships")
          .select("is_active")
          .eq("organization_id", organizationId)
          .eq("user_id", userId)
          .maybeSingle();
        if (membershipError) {
          results.push({ index: i, ok: false, email, user_id: userId, error: membershipError.message });
          continue;
        }
        existingMembership = Boolean(membershipRow);
        consumesNewSeat = !existingMembership;
      } else {
        // New auth user always consumes a seat once assigned to this organization.
        consumesNewSeat = true;
      }

      if (consumesNewSeat && orgMaxUsers !== null && projectedActiveMembers >= orgMaxUsers) {
        results.push({ index: i, ok: false, email, error: USER_LIMIT_ERROR });
        continue;
      }

      if (!existingProfile?.user_id) {
        // 2) Create new auth user
        const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
          email,
          password: (row.password && String(row.password).length >= 8 ? row.password : randomPassword()),
          email_confirm: true,
          user_metadata: { name, organization_id: organizationId },
        });
        if (createError || !created.user?.id) {
          const createMessage = createError?.message || "Failed to create auth user";
          // In some environments, org limit violations happen in DB triggers during auth user creation
          // and surface as a generic database error from GoTrue.
          if (
            createMessage.toLowerCase().includes("database error creating new user") &&
            orgMaxUsers !== null &&
            projectedActiveMembers >= orgMaxUsers
          ) {
            results.push({ index: i, ok: false, email, error: USER_LIMIT_ERROR });
          } else {
            results.push({ index: i, ok: false, email, error: createMessage });
          }
          continue;
        }
        userId = created.user.id;
      }

      // 3) Assign to org using existing RPC (enforces limits)
      const { error: assignError } = await serviceClient.rpc("assign_user_to_organization", {
        p_user_id: userId,
        p_organization_id: organizationId,
        p_role: role,
      });
      if (assignError) {
        results.push({ index: i, ok: false, email, user_id: userId, error: assignError.message });
        continue;
      }

      if (consumesNewSeat) projectedActiveMembers += 1;

      // 4) Best-effort name update
      await serviceClient
        .from("profiles")
        .update({ name })
        .eq("user_id", userId);

      results.push({ index: i, ok: true, email, user_id: userId, action: "assigned", warnings: [] });
      pass1.push({
        index: i,
        email,
        role,
        name,
        user_id: userId,
        assigned_manager_email: normalize(row.assigned_manager_email) || undefined,
        location: String(row.location || "").trim() || undefined,
      });
    }

    // Pass 2: resolve manager + optional location
    const importedByEmail = new Map<string, string>();
    pass1.forEach((r) => {
      importedByEmail.set(r.email, r.user_id);
    });

    // Existing users in org for manager-email fallback
    const { data: existingUsers } = await serviceClient
      .from("profiles")
      .select("user_id, email")
      .eq("organization_id", organizationId);
    const existingByEmail = new Map<string, string>((existingUsers || []).map((u: any) => [normalize(u.email), u.user_id]));

    // Optional location lookup
    const { data: orgLocations } = await serviceClient
      .from("locations")
      .select("id, name")
      .eq("organization_id", organizationId);
    const locationsByName = new Map<string, string>((orgLocations || []).map((l: any) => [normalize(l.name), l.id]));

    for (const row of pass1) {
      const result = results.find((r) => r.index === row.index);
      if (!result || !result.ok) continue;
      const warnings = result.warnings || [];

      // Manager resolution by email
      let managerId: string | undefined;
      if (row.assigned_manager_email) {
        managerId = importedByEmail.get(row.assigned_manager_email) || existingByEmail.get(row.assigned_manager_email);
      }

      if (row.assigned_manager_email) {
        if (managerId) {
          if (!dryRun) {
            if (row.role === "cashier") {
              await serviceClient
                .from("profiles")
                .update({ cashier_assigned_engineer_id: managerId })
                .eq("user_id", row.user_id);
            } else {
              await serviceClient
                .from("profiles")
                .update({ reporting_engineer_id: managerId })
                .eq("user_id", row.user_id);
            }
          } else {
            warnings.push(`would_link_manager:${managerId}`);
          }
        } else {
          warnings.push("manager_not_resolved");
        }
      }

      // Optional location handling
      if (row.location) {
        const locationId = locationsByName.get(normalize(row.location));
        if (!locationId) {
          warnings.push("location_not_found_skipped");
        } else if (!dryRun) {
          if (row.role === "cashier") {
            await serviceClient
              .from("profiles")
              .update({ cashier_assigned_location_id: locationId })
              .eq("user_id", row.user_id);
          } else if (row.role === "engineer") {
            await serviceClient
              .from("engineer_locations")
              .upsert(
                { engineer_id: row.user_id, location_id: locationId, organization_id: organizationId },
                { onConflict: "engineer_id,location_id" }
              );
          } else {
            warnings.push("location_provided_but_not_applicable_for_role");
          }
        } else {
          warnings.push(`would_link_location:${row.location}`);
        }
      }

      result.warnings = warnings;
    }

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: organizationId,
        max_users: orgMaxUsers,
        active_members_before: activeMembersBefore,
        active_members_after: projectedActiveMembers,
        dry_run: dryRun,
        total: rows.length,
        ok: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
