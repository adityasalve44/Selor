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

async function checkTableExistence() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log("🔍 Checking barber_availability_overrides existence...");
  const { data, error } = await supabase.from("barber_availability_overrides").select("id").limit(1);
  
  if (error) {
    console.error("❌ Error querying barber_availability_overrides:", error.message);
    console.error("   Code:", error.code);
  } else {
    console.log("✅ Table barber_availability_overrides exists.");
  }
}

checkTableExistence();
