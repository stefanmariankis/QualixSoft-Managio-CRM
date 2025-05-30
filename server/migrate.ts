import { db, migrationDb, tableExists, enumExists } from './db';

// Importăm schema completă din fișierul atașat
async function createEnums() {
  try {
    console.log('Crearea enum-urilor...');

    // Lista enum-urilor din schema atașată
    const enumsToCreate = [
      {
        name: 'automation_action_type',
        values: ['send_notification', 'change_status', 'assign_user', 'send_email', 'create_task', 'add_tag']
      },
      {
        name: 'automation_execution_status',
        values: ['success', 'failed', 'pending']
      },
      {
        name: 'automation_trigger_type',
        values: ['task_status_change', 'deadline_approaching', 'invoice_overdue', 'time_threshold_reached', 'new_comment', 'file_upload']
      },
      {
        name: 'checklist_visibility',
        values: ['internal_only', 'visible_to_client']
      },
      {
        name: 'email_event_type',
        values: ['sent', 'delivered', 'opened', 'clicked', 'bounced']
      },
      {
        name: 'email_recipient_type',
        values: ['to', 'cc', 'bcc']
      },
      {
        name: 'email_status',
        values: ['draft', 'scheduled', 'sent', 'failed', 'delivered', 'opened']
      },
      {
        name: 'evaluation_visibility',
        values: ['manager', 'ceo_only', 'self_visible', 'private', 'team']
      },
      {
        name: 'file_access_level',
        values: ['all', 'managers_only', 'ceo_only', 'client_and_team']
      },
      {
        name: 'invoice_status',
        values: ['draft', 'sent', 'paid', 'overdue']
      },
      {
        name: 'notification_type',
        values: ['comment', 'task_update', 'reminder', 'invoice', 'system']
      },
      {
        name: 'organization_type',
        values: ['freelancer', 'agency', 'company']
      },
      {
        name: 'project_status',
        values: ['planned', 'active', 'completed', 'blocked', 'on_hold']
      },
      {
        name: 'project_type',
        values: ['one_time', 'retainer', 'hourly']
      },
      {
        name: 'project_visibility',
        values: ['all', 'team_only', 'managers_only']
      },
      {
        name: 'reminder_frequency',
        values: ['daily', 'weekly', 'monthly']
      },
      {
        name: 'report_type',
        values: ['project_progress', 'financial', 'employee_performance', 'client_history', 'time_tracking', 'invoice_details', 'custom']
      },
      {
        name: 'schedule_frequency',
        values: ['daily', 'weekly', 'monthly', 'quarterly']
      },
      {
        name: 'subscription_plan',
        values: ['trial', 'basic', 'pro', 'pro_yearly']
      },
      {
        name: 'task_priority',
        values: ['low', 'medium', 'high', 'urgent']
      },
      {
        name: 'task_status',
        values: ['todo', 'in_progress', 'review', 'done', 'blocked']
      },
      {
        name: 'task_visibility',
        values: ['all', 'assignee_only', 'managers_only']
      },
      {
        name: 'time_log_source',
        values: ['manual', 'tracker']
      },
      {
        name: 'user_role',
        values: ['super_admin', 'ceo', 'manager', 'director', 'employee', 'client']
      }
    ];

    for (const enumType of enumsToCreate) {
      const enumExists = await checkEnumExists(enumType.name);
      if (!enumExists) {
        console.log(`Creez enum-ul ${enumType.name}...`);
        const valuesString = enumType.values.map(v => `'${v}'`).join(', ');
        await migrationDb`
          CREATE TYPE ${migrationDb(enumType.name)} AS ENUM (${migrationDb.unsafe(valuesString)});
        `;
      } else {
        console.log(`Enum-ul ${enumType.name} există deja.`);
      }
    }

    console.log('Toate enum-urile au fost create cu succes!');
  } catch (error) {
    console.error('Eroare la crearea enum-urilor:', error);
    throw error;
  }
}

// Funcție helper pentru a verifica dacă un enum există
async function checkEnumExists(enumName: string): Promise<boolean> {
  try {
    const result = await migrationDb`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = ${enumName}
      );
    `;
    return result[0]?.exists || false;
  } catch (error) {
    console.error(`Eroare la verificarea enum-ului ${enumName}:`, error);
    return false;
  }
}

async function createBasicTables() {
  try {
    console.log('Crearea tabelelor de bază...');

    // Verificăm dacă tabelele există
    const organizationsExists = await tableExists('organizations');
    const usersExists = await tableExists('users');
    
    console.log('Status tabele de bază:', {
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
    }
  } catch (error) {
    console.error('Eroare la crearea tabelelor de bază:', error);
    throw error;
  }
}

async function createRemainingTables() {
  try {
    // Lista tabelelor deja create (primele sunt organizations și users)
    const existingTables = ['organizations', 'users'];
    const tablesToCreate = [
      /* Tabele din fișierul atașat */
      `
      CREATE TABLE IF NOT EXISTS activity_log (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id integer,
        metadata jsonb,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS automation_actions (
        id serial PRIMARY KEY NOT NULL,
        automation_id integer NOT NULL,
        action_type automation_action_type NOT NULL,
        action_config jsonb NOT NULL,
        order_index integer DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS automation_logs (
        id serial PRIMARY KEY NOT NULL,
        automation_id integer NOT NULL,
        trigger_id integer,
        entity_type text NOT NULL,
        entity_id integer NOT NULL,
        execution_status automation_execution_status NOT NULL,
        error_message text,
        executed_at timestamp NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS automation_triggers (
        id serial PRIMARY KEY NOT NULL,
        automation_id integer NOT NULL,
        trigger_type automation_trigger_type NOT NULL,
        entity_type text NOT NULL,
        conditions jsonb NOT NULL,
        order_index integer DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS automations (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        name text NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_by integer,
        updated_by integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS calendar_events (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        user_id integer NOT NULL,
        title text NOT NULL,
        description text,
        start_time timestamp NOT NULL,
        end_time timestamp NOT NULL,
        location text,
        is_all_day boolean DEFAULT false,
        google_event_id text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_history_metrics (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        client_id integer NOT NULL,
        period_start date NOT NULL,
        period_end date NOT NULL,
        projects_count integer DEFAULT 0,
        active_projects_count integer DEFAULT 0,
        completed_projects_count integer DEFAULT 0,
        total_revenue real DEFAULT 0,
        average_project_value real DEFAULT 0,
        total_hours_spent real DEFAULT 0,
        invoices_count integer DEFAULT 0,
        invoices_paid_count integer DEFAULT 0,
        average_payment_days integer DEFAULT 0,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_insights (
        id serial PRIMARY KEY NOT NULL,
        client_id integer NOT NULL,
        organization_id integer NOT NULL,
        metric_type text NOT NULL,
        score real NOT NULL,
        calculation_period text NOT NULL,
        metadata jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_notes (
        id serial PRIMARY KEY NOT NULL,
        client_id integer NOT NULL,
        organization_id integer NOT NULL,
        user_id integer NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        note_type text NOT NULL,
        visibility text DEFAULT 'all',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_portal_activity_logs (
        id serial PRIMARY KEY NOT NULL,
        client_portal_user_id integer NOT NULL,
        activity_type text NOT NULL,
        entity_type text,
        entity_id integer,
        details text,
        ip_address text,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_portal_feedbacks (
        id serial PRIMARY KEY NOT NULL,
        client_portal_user_id integer NOT NULL,
        organization_id integer NOT NULL,
        project_id integer,
        rating integer NOT NULL,
        comment text,
        feedback_type text NOT NULL,
        is_public boolean DEFAULT false,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_portal_notifications (
        id serial PRIMARY KEY NOT NULL,
        client_portal_id integer NOT NULL,
        client_portal_user_id integer,
        title text NOT NULL,
        message text NOT NULL,
        notification_type text NOT NULL,
        is_read boolean DEFAULT false,
        entity_type text,
        entity_id integer,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_portal_sessions (
        id serial PRIMARY KEY NOT NULL,
        client_portal_user_id integer NOT NULL,
        session_token text NOT NULL,
        ip_address text,
        user_agent text,
        login_time timestamp NOT NULL,
        last_activity timestamp NOT NULL,
        expires_at timestamp NOT NULL,
        is_active boolean DEFAULT true
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_portal_users (
        id serial PRIMARY KEY NOT NULL,
        client_portal_id integer NOT NULL,
        email text NOT NULL,
        full_name text NOT NULL,
        password_hash text NOT NULL,
        role text DEFAULT 'viewer',
        is_active boolean DEFAULT true,
        last_login timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS client_portals (
        id serial PRIMARY KEY NOT NULL,
        client_id integer NOT NULL,
        organization_id integer NOT NULL,
        access_key text NOT NULL,
        is_active boolean DEFAULT false,
        access_level text DEFAULT 'standard',
        custom_settings jsonb,
        last_login timestamp,
        created_by integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        CONSTRAINT client_portals_access_key_unique UNIQUE(access_key)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS clients (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        company_name text NOT NULL,
        contact_person text,
        email text,
        phone text,
        registration_number text,
        address text,
        timezone text DEFAULT 'Europe/Bucharest',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS comments (
        id serial PRIMARY KEY NOT NULL,
        entity_type text NOT NULL,
        entity_id integer NOT NULL,
        user_id integer NOT NULL,
        content text NOT NULL,
        is_internal boolean DEFAULT false,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS contract_milestones (
        id serial PRIMARY KEY NOT NULL,
        contract_id integer NOT NULL,
        title text NOT NULL,
        description text,
        due_date date,
        value real,
        status text NOT NULL,
        completed_at timestamp,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS contracts (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        client_id integer NOT NULL,
        project_id integer,
        title text NOT NULL,
        contract_number text,
        start_date date NOT NULL,
        end_date date,
        value real,
        currency text DEFAULT 'RON',
        status text NOT NULL,
        contract_type text NOT NULL,
        file_url text,
        renewal_reminder_days integer,
        auto_renewal boolean DEFAULT false,
        terms text,
        created_by integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS departments (
        id serial PRIMARY KEY NOT NULL,
        name text NOT NULL,
        organization_id integer NOT NULL,
        manager_id integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS email_attachments (
        id serial PRIMARY KEY NOT NULL,
        email_id integer NOT NULL,
        file_id integer,
        file_name text NOT NULL,
        file_path text,
        file_size integer,
        mime_type text,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS email_recipients (
        id serial PRIMARY KEY NOT NULL,
        email_id integer NOT NULL,
        recipient_type email_recipient_type NOT NULL,
        recipient_email text NOT NULL,
        recipient_name text,
        user_id integer,
        client_id integer,
        status text DEFAULT 'pending',
        opened_at timestamp,
        opened_count integer DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS email_templates (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer,
        name text NOT NULL,
        description text,
        subject text NOT NULL,
        body text NOT NULL,
        template_type text NOT NULL,
        placeholders jsonb,
        is_html boolean DEFAULT true,
        created_by integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS email_tracking (
        id serial PRIMARY KEY NOT NULL,
        email_id integer NOT NULL,
        recipient_id integer,
        event_type email_event_type NOT NULL,
        event_time timestamp NOT NULL,
        ip_address text,
        user_agent text,
        link_clicked text,
        created_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS emails (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        sender_id integer,
        sender_email text NOT NULL,
        reply_to text,
        subject text NOT NULL,
        body text NOT NULL,
        is_html boolean DEFAULT true,
        email_template_id integer,
        related_entity_type text,
        related_entity_id integer,
        status email_status DEFAULT 'draft',
        scheduled_for timestamp,
        sent_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS employee_evaluations (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        employee_id integer NOT NULL,
        evaluator_id integer NOT NULL,
        evaluation_period text NOT NULL,
        performance_score real,
        strengths text,
        areas_for_improvement text,
        goals text,
        visibility evaluation_visibility DEFAULT 'manager',
        status text DEFAULT 'draft',
        completed_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS employee_goals (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        employee_id integer NOT NULL,
        manager_id integer,
        title text NOT NULL,
        description text,
        goal_type text NOT NULL,
        priority text DEFAULT 'medium',
        start_date date,
        end_date date,
        progress_percentage integer DEFAULT 0,
        status text DEFAULT 'active',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS files (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        uploader_id integer NOT NULL,
        file_name text NOT NULL,
        original_name text NOT NULL,
        file_path text NOT NULL,
        mime_type text,
        file_size integer,
        entity_type text,
        entity_id integer,
        is_public boolean DEFAULT false,
        access_level file_access_level DEFAULT 'all',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `
    ];

    // Verificăm și creăm tabelele care nu există încă
    for (const createTableSQL of tablesToCreate) {
      // Extragem numele tabelului din SQL
      const tableNameMatch = createTableSQL.match(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/i);
      if (!tableNameMatch) continue;
      
      const tableName = tableNameMatch[1];
      if (existingTables.includes(tableName)) {
        console.log(`Tabelul ${tableName} există deja în lista de tabele verificate.`);
        continue;
      }
      
      const tableExist = await tableExists(tableName);
      if (!tableExist) {
        console.log(`Crearea tabelului ${tableName}...`);
        await migrationDb.unsafe(createTableSQL);
        console.log(`Tabelul ${tableName} a fost creat cu succes!`);
      } else {
        console.log(`Tabelul ${tableName} există deja.`);
      }
      
      // Adăugăm tabelul în lista de tabele verificate
      existingTables.push(tableName);
    }
    
    console.log('Toate tabelele au fost create sau verificate cu succes!');
  } catch (error) {
    console.error('Eroare la crearea tabelelor adiționale:', error);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('Începerea migrării...');
    
    // Creare enum-uri
    await createEnums();
    
    // Creare tabele de bază (organizations și users)
    await createBasicTables();
    
    // Creare celelalte tabele
    await createRemainingTables();
    
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
