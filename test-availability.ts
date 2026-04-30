import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually load env before anything else
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
});

// Now import the service
import { getAvailabilityForDay } from "./lib/services/availability";

async function testAvailability() {
  const barberId = "ece32c0c-37d7-4148-80df-d80386968f10"; // Adi
  const today = new Date().toISOString().split("T")[0];
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: services } = await supabase.from("services").select("id").limit(1);
  
  if (!services || services.length === 0) {
    console.error("❌ No services found to test with.");
    return;
  }

  console.log(`🔍 Testing availability for ${today} with service ${services[0].id}...`);
  
  try {
    const slots = await getAvailabilityForDay({
      barberId,
      serviceIds: [services[0].id],
      date: today
    });
    
    console.log(`✅ Result: ${slots.length} total slots.`);
    const availableSlots = slots.filter(s => s.available);
    console.log(`✅ Available: ${availableSlots.length} slots.`);
    
    if (slots.length > 0) {
        console.log("First slot:", slots[0]);
        console.log("Last slot:", slots[slots.length-1]);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testAvailability();
