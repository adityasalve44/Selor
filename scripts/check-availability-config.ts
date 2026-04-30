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

async function checkSettingsAndAvailability() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("🔍 Checking Shop Settings...");
  const { data: settings, error: settingsError } = await supabase
    .from("shop_settings")
    .select("*")
    .single();

  if (settingsError) {
    console.error("❌ Error fetching settings:", settingsError.message);
  } else {
    console.log("✅ Shop Name:", settings.shop_name);
    console.log("✅ Timezone:", settings.timezone);
    console.log("✅ Slot Interval:", settings.slot_interval_minutes);
    console.log("✅ Buffer Before:", settings.default_buffer_before_minutes);
    console.log("✅ Buffer After:", settings.default_buffer_after_minutes);
    console.log("✅ Weekly Hours:", JSON.stringify(settings.weekly_hours, null, 2));
  }

  console.log("\n🔍 Checking Active Barbers...");
  const { data: barbers, error: barbersError } = await supabase
    .from("barbers")
    .select("*, users(name)")
    .eq("is_active", true);

  if (barbersError) {
    console.error("❌ Error fetching barbers:", barbersError.message);
  } else {
    console.log(`✅ Found ${barbers.length} active barbers:`);
    barbers.forEach(b => console.log(`   - ${b.users?.name} (ID: ${b.id})`));
  }
}

checkSettingsAndAvailability();
