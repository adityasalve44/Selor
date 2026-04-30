import { createAdminSupabaseClient } from '../lib/supabase/admin';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not initialized');
    process.exit(1);
  }

  const schemaPath = path.join(process.cwd(), 'db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Extract just the create_booking function
  const startRegex = /create or replace function public\.create_booking/i;
  const match = schema.match(startRegex);
  
  if (!match) {
    console.error('Could not find create_booking in schema.sql');
    process.exit(1);
  }

  // This is a bit hacky, but let's try to find the end of the function (ends with $$;)
  const startIndex = match.index!;
  const rest = schema.substring(startIndex);
  const endMatch = rest.match(/\$\$;/);
  
  if (!endMatch) {
    console.error('Could not find end of function in schema.sql');
    process.exit(1);
  }

  const functionSql = rest.substring(0, endMatch.index! + 3);
  console.log('Executing SQL:');
  console.log(functionSql);

  const { error } = await supabase.rpc('exec_sql', { sql: functionSql });
  
  if (error) {
    // If exec_sql doesn't exist, we might have to use another way or ask user
    console.error('Error executing SQL via RPC:', error);
    console.log('Falling back to direct SQL might not be possible via client SDK.');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(functionSql);
  } else {
    console.log('Function recreated successfully!');
  }
}

main();
