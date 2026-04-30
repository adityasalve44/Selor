import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Simple .env parser
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowlistStr = process.env.ADMIN_EMAIL_ALLOWLIST || "";

async function checkAdmins() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const allowlist = allowlistStr
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  console.log("🔍 Checking allowlist:", allowlist);

  if (allowlist.length === 0) {
    console.warn("⚠️ Allowlist is empty. Check your .env file for ADMIN_EMAIL_ALLOWLIST.");
    return;
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, role")
    .in("email", allowlist);

  if (error) {
    console.error("❌ Error fetching users:", error.message);
    return;
  }

  console.log("\n--- Database Status ---");
  allowlist.forEach((email) => {
    const user = users?.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      console.log(`❌ ${email}: Not found in public.users table.`);
    } else if (user.role === "admin") {
      console.log(`✅ ${email}: Is Admin`);
    } else {
      console.log(`⚠️ ${email}: Exists but role is "${user.role}"`);
    }
  });

  // Check if they exist in auth.users but not public.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
     console.error("❌ Error fetching auth users:", authError.message);
  } else {
    console.log("\n--- Auth Status ---");
    allowlist.forEach(email => {
        const authUser = authUsers.users.find(u => u.email?.toLowerCase() === email);
        if (authUser) {
            console.log(`✅ ${email}: Exists in Supabase Auth (ID: ${authUser.id})`);
        } else {
            console.log(`❌ ${email}: Not found in Supabase Auth. Did you sign up?`);
        }
    });
  }
}

checkAdmins();
