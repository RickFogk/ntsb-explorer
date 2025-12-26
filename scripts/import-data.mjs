import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function importData() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('Reading JSONL file...');
  const fileStream = createReadStream('/home/ubuntu/ntsb_data/llm_database/ntsb_accidents.jsonl');
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  let errors = 0;

  // Prepare statement
  const insertSQL = `
    INSERT INTO accidents (
      eventId, ntsbNumber, eventDate, city, state, country, latitude, longitude,
      aircraftMake, aircraftModel, aircraftCategory, farPart, damage,
      weather, lightCondition, flightPhase, highestSeverity,
      fatalCount, seriousCount, minorCount,
      probableCause, narrativePreliminary, narrativeFactual,
      findings, causeCount, factorCount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE eventId = eventId
  `;

  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const r = JSON.parse(line);
      
      // Extract contributing_factors properly
      const cf = r.contributing_factors || {};
      
      const values = [
        r.event_id,
        r.ntsb_number || null,
        r.event_date || null,
        r.location?.city || null,
        r.location?.state || null,
        r.location?.country || null,
        r.location?.latitude?.toString() || null,
        r.location?.longitude?.toString() || null,
        r.aircraft?.make || null,
        r.aircraft?.model || null,
        r.aircraft?.category || null,
        r.aircraft?.far_part || null,
        r.aircraft?.damage || null,
        r.conditions?.weather || null,
        r.conditions?.light || null,
        r.flight_phase || null,
        r.injuries?.highest_severity || null,
        r.injuries?.fatal || 0,
        r.injuries?.serious || 0,
        r.injuries?.minor || 0,
        r.probable_cause || null,
        r.narrative_preliminary || null,
        r.narrative_factual || null,
        cf.findings || null,
        cf.cause_count || 0,
        cf.factor_count || 0
      ];

      await connection.execute(insertSQL, values);
      count++;

      if (count % 1000 === 0) {
        console.log(`Imported ${count} records...`);
      }
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error('Error:', err.message);
      }
    }
  }

  console.log(`Import complete! Total records: ${count}, Errors: ${errors}`);
  await connection.end();
}

importData().catch(console.error);
