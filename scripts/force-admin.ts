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
const TARGET_EMAIL = "adityasalve4167@gmail.com";

async function forceAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`🚀 Forcing admin status for ${TARGET_EMAIL}...`);

  // 1. Find user in Auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users.find(u => u.email?.toLowerCase() === TARGET_EMAIL);

  if (!authUser) {
    console.error(`❌ User ${TARGET_EMAIL} not found in Supabase Auth. Please sign up first.`);
    return;
  }

  console.log(`✅ Found Auth User: ${authUser.id}`);

  // 2. Insert or Update public.users
  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: authUser.id,
      email: authUser.email,
      role: "admin",
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Admin",
      updated_at: new Date().toISOString()
    }, { onConflict: "id" })
    .select();

  if (error) {
    console.error("❌ Failed to sync user to public.users table:", error.message);
  } else {
    console.log("✅ Success! User is now an Admin in public.users table.");
    console.log(data);
  }
}

forceAdmin();
