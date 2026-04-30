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

async function seedData() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("🌱 Seeding initial data...");

  // 1. Create a Service
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .insert({
      name: "Signature Shave",
      duration_minutes: 45,
      price: 800,
      is_active: true
    })
    .select()
    .single();

  if (serviceError) {
    console.error("❌ Failed to create service:", serviceError.message);
  } else {
    console.log("✅ Created Service:", service.name);
  }

  // 2. Create a Staff Member (Barber)
  const staffEmail = `staff-${Math.floor(Math.random() * 10000)}@selor.local`;
  
  // Create in Auth first
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: staffEmail,
    email_confirm: true,
    user_metadata: { full_name: "John Doe" }
  });

  if (authError) {
    console.error("❌ Failed to create auth user for staff:", authError.message);
    return;
  }

  // The trigger might have already created the user record, so we use upsert
  const { data: userData, error: userError } = await supabase
    .from("users")
    .upsert({
      id: authUser.user?.id,
      email: staffEmail,
      name: "John Doe",
      role: "barber"
    })
    .select()
    .single();

  if (userError) {
    console.error("❌ Failed to sync user for staff:", userError.message);
  } else if (userData) {
    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .insert({
        user_id: userData.id,
        is_active: true
      })
      .select()
      .single();

    if (barberError) {
      console.error("❌ Failed to create barber record:", barberError.message);
    } else {
      console.log("✅ Created Staff Member:", userData.name, `(${staffEmail})`);
    }
  }
}

seedData();
