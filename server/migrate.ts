import { db, migrationDb, tableExists, enumExists } from './db';

async function createEnums() {
  try {
    console.log('Crearea enum-urilor...');
    
    // Verificăm dacă enum-urile există deja
    const organizationTypeExists = await enumExists('organization_type');
    const userRoleExists = await enumExists('user_role');
    const subscriptionPlanExists = await enumExists('subscription_plan');
    
    console.log('Status enum-uri:', {
      organizationTypeExists,
      userRoleExists,
      subscriptionPlanExists
    });
    
    // Cream enum-urile utilizând codul PL/pgSQL
    await migrationDb`
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
    console.log('Verificarea și crearea tabelelor...');
    
    // Verificăm dacă tabelele există folosind noua funcție din db.ts
    const organizationsExists = await tableExists('organizations');
    const usersExists = await tableExists('users');
    
    console.log('Status tabele:', {
      organizationsExists,
      usersExists
    });
    
    // Creăm tabelul organizations dacă nu există
    if (!organizationsExists) {
      console.log('Crearea tabelului organizations...');
      await migrationDb`
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
      
      // Verificăm schema tabelului existent
      const columnsOrg = await migrationDb`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        ORDER BY ordinal_position;
      `;
      console.log('Structura tabelului organizations:', columnsOrg);
    }
    
    // Creăm tabelul users dacă nu există
    if (!usersExists) {
      console.log('Crearea tabelului users...');
      await migrationDb`
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
      
      // Verificăm schema tabelului existent
      const columnsUsers = await migrationDb`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `;
      console.log('Structura tabelului users:', columnsUsers);
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
    // Închiderea conexiunilor
    await db.end();
    await migrationDb.end();
    console.log('Conexiunile au fost închise.');
  }
}

// Rulăm migrarea
migrate();