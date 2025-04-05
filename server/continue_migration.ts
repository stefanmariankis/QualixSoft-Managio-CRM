import { db, migrationDb, tableExists } from './db';

// Importăm doar funcția de creare tabele suplimentare
async function createRemainingTables() {
  try {
    console.log('Continuăm crearea tabelelor care lipsesc...');
    
    // Obținem lista tabelelor existente pentru a le ignora
    const existingTablesResult = await migrationDb`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    
    const existingTables = existingTablesResult.map(row => row.table_name);
    console.log('Tabele existente:', existingTables);

    // Definim tabelele care trebuie create
    const tablesToCheck = [
      'activity_log',
      'automation_actions',
      'automation_logs',
      'automation_triggers',
      'automations',
      'calendar_events',
      'client_history_metrics',
      'client_insights',
      'client_notes',
      'client_portal_activity_logs',
      'client_portal_feedbacks',
      'client_portal_notifications',
      'client_portal_sessions',
      'client_portal_users',
      'client_portals',
      'clients',
      'comments',
      'contract_milestones',
      'contracts',
      'departments',
      'email_attachments',
      'email_recipients',
      'email_templates',
      'email_tracking',
      'emails',
      'employee_evaluations',
      'employee_goals',
      'evaluations',
      'files',
      'invoice_items',
      'invoices',
      'notifications',
      'payments',
      'projects',
      'task_assignees',
      'task_checklists',
      'task_tags',
      'tasks',
      'time_logs',
      'user_preferences',
      'user_profiles'
    ];

    // Verificăm care tabele lipsesc
    const missingTables = tablesToCheck.filter(table => !existingTables.includes(table));
    console.log('Tabele care lipsesc și trebuie create:', missingTables);
    
    // Creăm un map cu script-urile SQL pentru tabelele care lipsesc
    const tableScripts = {
      'client_history_metrics': `
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
      'client_insights': `
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
      'client_notes': `
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
      'client_portal_activity_logs': `
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
      'client_portal_feedbacks': `
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
      'client_portal_notifications': `
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
      'client_portal_sessions': `
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
      'client_portal_users': `
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
      'client_portals': `
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
      'clients': `
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
      'comments': `
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
      'contract_milestones': `
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
      'contracts': `
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
      'departments': `
      CREATE TABLE IF NOT EXISTS departments (
        id serial PRIMARY KEY NOT NULL,
        name text NOT NULL,
        organization_id integer NOT NULL,
        manager_id integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      'email_attachments': `
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
      'email_recipients': `
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
      'email_templates': `
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
      'email_tracking': `
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
      'emails': `
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
      'employee_evaluations': `
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
      'employee_goals': `
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
      'files': `
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
      `,
      'invoices': `
      CREATE TABLE IF NOT EXISTS invoices (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        client_id integer NOT NULL,
        project_id integer,
        invoice_number text NOT NULL,
        issue_date date NOT NULL,
        due_date date NOT NULL,
        status invoice_status DEFAULT 'draft',
        amount real NOT NULL,
        tax_amount real DEFAULT 0,
        currency text DEFAULT 'RON',
        notes text,
        payment_date date,
        payment_method text,
        created_by integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        CONSTRAINT invoices_invoice_number_organization_id_unique UNIQUE(invoice_number, organization_id)
      );
      `,
      'notifications': `
      CREATE TABLE IF NOT EXISTS notifications (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        organization_id integer NOT NULL,
        notification_type notification_type NOT NULL,
        title text NOT NULL,
        message text NOT NULL,
        is_read boolean DEFAULT false,
        entity_type text,
        entity_id integer,
        action_url text,
        created_at timestamp DEFAULT now()
      );
      `,
      'projects': `
      CREATE TABLE IF NOT EXISTS projects (
        id serial PRIMARY KEY NOT NULL,
        organization_id integer NOT NULL,
        client_id integer NOT NULL,
        name text NOT NULL,
        description text,
        project_type project_type NOT NULL,
        status project_status DEFAULT 'planned',
        start_date date,
        deadline date,
        budget real,
        currency text DEFAULT 'RON',
        hourly_rate real,
        visibility project_visibility DEFAULT 'all',
        slug text,
        created_by integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      'tasks': `
      CREATE TABLE IF NOT EXISTS tasks (
        id serial PRIMARY KEY NOT NULL,
        project_id integer NOT NULL,
        organization_id integer NOT NULL,
        title text NOT NULL,
        description text,
        status task_status DEFAULT 'todo',
        priority task_priority DEFAULT 'medium',
        parent_task_id integer,
        assignee_id integer,
        reporter_id integer,
        estimated_hours real,
        actual_hours real,
        due_date timestamp,
        visibility task_visibility DEFAULT 'all',
        tags jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      'time_logs': `
      CREATE TABLE IF NOT EXISTS time_logs (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        organization_id integer NOT NULL,
        task_id integer,
        project_id integer,
        description text,
        start_time timestamp NOT NULL,
        end_time timestamp,
        duration_minutes integer NOT NULL,
        is_billable boolean DEFAULT true,
        source time_log_source DEFAULT 'manual',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      'activity_log': `
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
      'automation_actions': `
      CREATE TABLE IF NOT EXISTS automation_actions (
        id serial PRIMARY KEY NOT NULL,
        automation_id integer NOT NULL,
        action_type automation_action_type NOT NULL,
        action_config jsonb NOT NULL,
        order_index integer DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
      `,
      'automation_logs': `
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
      'automation_triggers': `
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
      'automations': `
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
      'calendar_events': `
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
      'evaluations': `
      CREATE TABLE IF NOT EXISTS evaluations (
        id serial PRIMARY KEY NOT NULL,
        evaluated_user_id integer NOT NULL,
        evaluator_id integer NOT NULL,
        organization_id integer NOT NULL,
        score integer,
        criteria jsonb,
        comments text,
        visibility evaluation_visibility DEFAULT 'private',
        is_submitted boolean DEFAULT false,
        date date NOT NULL,
        created_at timestamp DEFAULT now()
      );
      `,
      'invoice_items': `
      CREATE TABLE IF NOT EXISTS invoice_items (
        id serial PRIMARY KEY NOT NULL,
        invoice_id integer NOT NULL,
        description text NOT NULL,
        quantity real NOT NULL,
        unit_price real NOT NULL,
        total_price real NOT NULL,
        order_index integer DEFAULT 0
      );
      `,
      'payments': `
      CREATE TABLE IF NOT EXISTS payments (
        id serial PRIMARY KEY NOT NULL,
        invoice_id integer NOT NULL,
        amount_paid real NOT NULL,
        date_paid timestamp NOT NULL,
        payment_method text NOT NULL,
        transaction_id text,
        notes text,
        created_by integer,
        created_at timestamp DEFAULT now()
      );
      `,
      'task_assignees': `
      CREATE TABLE IF NOT EXISTS task_assignees (
        id serial PRIMARY KEY NOT NULL,
        task_id integer NOT NULL,
        user_id integer NOT NULL,
        is_primary boolean DEFAULT false,
        assigned_at timestamp DEFAULT now()
      );
      `,
      'task_checklists': `
      CREATE TABLE IF NOT EXISTS task_checklists (
        id serial PRIMARY KEY NOT NULL,
        task_id integer NOT NULL,
        title text NOT NULL,
        is_completed boolean DEFAULT false,
        completed_at timestamp,
        completed_by integer,
        is_required boolean DEFAULT false,
        visibility checklist_visibility DEFAULT 'internal_only',
        order_index integer DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
      `,
      'task_tags': `
      CREATE TABLE IF NOT EXISTS task_tags (
        id serial PRIMARY KEY NOT NULL,
        task_id integer NOT NULL,
        tag_id integer NOT NULL
      );
      `,
      'user_preferences': `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        theme text DEFAULT 'light',
        language text DEFAULT 'ro',
        dashboard_layout jsonb,
        notification_settings jsonb,
        email_settings jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      `,
      'user_profiles': `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        full_name text NOT NULL,
        avatar_url text,
        phone text,
        position text,
        skills jsonb,
        bio text,
        preferred_language text DEFAULT 'ro',
        hourly_rate real,
        role user_role DEFAULT 'employee' NOT NULL,
        organization_id integer,
        department_id integer,
        stripe_customer_id text,
        stripe_subscription_id text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        CONSTRAINT user_profiles_user_id_unique UNIQUE(user_id)
      );
      `
    };

    // Creăm tabelele care lipsesc
    for (const tableName of missingTables) {
      const createTableSQL = tableScripts[tableName];
      if (!createTableSQL) {
        console.log(`Nu am găsit script pentru tabelul ${tableName}, îl omitem.`);
        continue;
      }

      console.log(`Crearea tabelului ${tableName}...`);
      try {
        await migrationDb.unsafe(createTableSQL);
        console.log(`Tabelul ${tableName} a fost creat cu succes!`);
      } catch (error) {
        console.error(`Eroare la crearea tabelului ${tableName}:`, error);
      }
    }

    console.log('Toate tabelele lipsă au fost create!');
  } catch (error) {
    console.error('Eroare la crearea tabelelor adiționale:', error);
    throw error;
  }
}

async function migrate() {
  try {
    console.log('Continuarea migrării pentru tabelele lipsă...');
    
    // Creare tabele lipsă
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
