import { supabase, pgClient } from './db';

async function createEnums() {
  try {
    console.log('Crearea enum-urilor...');
    await pgClient`
      DO $$ 
      BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
              CREATE TYPE organization_type AS ENUM ('freelancer', 'agency', 'company');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
              CREATE TYPE user_role AS ENUM ('super_admin', 'ceo', 'manager', 'director', 'employee', 'client');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
              CREATE TYPE subscription_plan AS ENUM ('trial', 'basic', 'pro', 'pro_yearly');
          END IF;
      END $$;
    `;
    console.log('Enum-urile au fost create cu succes!');
  } catch (error) {
    console.error('Eroare la crearea enum-urilor:', error);
    throw error;
  }
}

async function createTables() {
  try {
    console.log('Crearea tabelelor...');
    
    // Verificăm mai întâi dacă tabelele există deja
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['organizations', 'users']);
    
    const existingTables = new Set(tables?.map(t => t.table_name) || []);
    console.log('Tabele existente:', existingTables);
    
    // Creăm tabelul organizations dacă nu există
    if (!existingTables.has('organizations')) {
      console.log('Crearea tabelului organizations...');
      await pgClient`
        CREATE TABLE IF NOT EXISTS organizations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          logo VARCHAR(255),
          organization_type organization_type NOT NULL,
          subscription_plan subscription_plan NOT NULL DEFAULT 'trial',
          trial_expires_at TIMESTAMP,
          subscription_started_at TIMESTAMP,
          subscription_expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('Tabelul organizations a fost creat cu succes!');
    } else {
      console.log('Tabelul organizations există deja.');
    }
    
    // Creăm tabelul users dacă nu există
    if (!existingTables.has('users')) {
      console.log('Crearea tabelului users...');
      await pgClient`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          role user_role DEFAULT 'ceo',
          organization_id INTEGER REFERENCES organizations(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('Tabelul users a fost creat cu succes!');
    } else {
      console.log('Tabelul users există deja.');
    }
    
    console.log('Toate tabelele au fost create sau verificate cu succes!');
  } catch (error) {
    console.error('Eroare la crearea tabelelor:', error);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('Începerea migrării...');
    
    // Creare enum-uri
    await createEnums();
    
    // Creare tabele
    await createTables();
    
    console.log('Migrarea a fost finalizată cu succes!');
    process.exit(0);
  } catch (error) {
    console.error('Eroare la migrare:', error);
    process.exit(1);
  } finally {
    if (pgClient) {
      await pgClient.end();
    }
  }
}

// Rulăm migrarea
migrate();