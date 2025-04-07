--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: automation_action_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.automation_action_type AS ENUM (
    'send_notification',
    'change_status',
    'assign_user',
    'send_email',
    'create_task',
    'add_tag'
);


ALTER TYPE public.automation_action_type OWNER TO neondb_owner;

--
-- Name: automation_execution_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.automation_execution_status AS ENUM (
    'success',
    'failed',
    'pending'
);


ALTER TYPE public.automation_execution_status OWNER TO neondb_owner;

--
-- Name: automation_trigger_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.automation_trigger_type AS ENUM (
    'task_status_change',
    'deadline_approaching',
    'invoice_overdue',
    'time_threshold_reached',
    'new_comment',
    'file_upload'
);


ALTER TYPE public.automation_trigger_type OWNER TO neondb_owner;

--
-- Name: checklist_visibility; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.checklist_visibility AS ENUM (
    'internal_only',
    'visible_to_client'
);


ALTER TYPE public.checklist_visibility OWNER TO neondb_owner;

--
-- Name: email_event_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.email_event_type AS ENUM (
    'sent',
    'delivered',
    'opened',
    'clicked',
    'bounced'
);


ALTER TYPE public.email_event_type OWNER TO neondb_owner;

--
-- Name: email_recipient_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.email_recipient_type AS ENUM (
    'to',
    'cc',
    'bcc'
);


ALTER TYPE public.email_recipient_type OWNER TO neondb_owner;

--
-- Name: email_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.email_status AS ENUM (
    'draft',
    'scheduled',
    'sent',
    'failed',
    'delivered',
    'opened'
);


ALTER TYPE public.email_status OWNER TO neondb_owner;

--
-- Name: evaluation_visibility; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.evaluation_visibility AS ENUM (
    'manager',
    'ceo_only',
    'self_visible',
    'private',
    'team'
);


ALTER TYPE public.evaluation_visibility OWNER TO neondb_owner;

--
-- Name: file_access_level; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.file_access_level AS ENUM (
    'all',
    'managers_only',
    'ceo_only',
    'client_and_team'
);


ALTER TYPE public.file_access_level OWNER TO neondb_owner;

--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue'
);


ALTER TYPE public.invoice_status OWNER TO neondb_owner;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.notification_type AS ENUM (
    'comment',
    'task_update',
    'reminder',
    'invoice',
    'system'
);


ALTER TYPE public.notification_type OWNER TO neondb_owner;

--
-- Name: organization_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.organization_type AS ENUM (
    'freelancer',
    'agency',
    'company'
);


ALTER TYPE public.organization_type OWNER TO neondb_owner;

--
-- Name: project_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_status AS ENUM (
    'planned',
    'active',
    'completed',
    'blocked',
    'on_hold'
);


ALTER TYPE public.project_status OWNER TO neondb_owner;

--
-- Name: project_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_type AS ENUM (
    'one_time',
    'retainer',
    'hourly'
);


ALTER TYPE public.project_type OWNER TO neondb_owner;

--
-- Name: project_visibility; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_visibility AS ENUM (
    'all',
    'team_only',
    'managers_only'
);


ALTER TYPE public.project_visibility OWNER TO neondb_owner;

--
-- Name: reminder_frequency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.reminder_frequency AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE public.reminder_frequency OWNER TO neondb_owner;

--
-- Name: report_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.report_type AS ENUM (
    'project_progress',
    'financial',
    'employee_performance',
    'client_history',
    'time_tracking',
    'invoice_details',
    'custom'
);


ALTER TYPE public.report_type OWNER TO neondb_owner;

--
-- Name: schedule_frequency; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.schedule_frequency AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'quarterly'
);


ALTER TYPE public.schedule_frequency OWNER TO neondb_owner;

--
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.subscription_plan AS ENUM (
    'trial',
    'basic',
    'pro',
    'pro_yearly'
);


ALTER TYPE public.subscription_plan OWNER TO neondb_owner;

--
-- Name: task_priority; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.task_priority OWNER TO neondb_owner;

--
-- Name: task_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.task_status AS ENUM (
    'todo',
    'in_progress',
    'review',
    'done',
    'blocked'
);


ALTER TYPE public.task_status OWNER TO neondb_owner;

--
-- Name: task_visibility; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.task_visibility AS ENUM (
    'all',
    'assignee_only',
    'managers_only'
);


ALTER TYPE public.task_visibility OWNER TO neondb_owner;

--
-- Name: time_log_source; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.time_log_source AS ENUM (
    'manual',
    'tracker'
);


ALTER TYPE public.time_log_source OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'ceo',
    'manager',
    'director',
    'employee',
    'client'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_log (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_log OWNER TO neondb_owner;

--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_log_id_seq OWNER TO neondb_owner;

--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization_id integer NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: automation_actions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.automation_actions (
    id integer NOT NULL,
    automation_id integer NOT NULL,
    action_type public.automation_action_type NOT NULL,
    action_config jsonb NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.automation_actions OWNER TO neondb_owner;

--
-- Name: automation_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.automation_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_actions_id_seq OWNER TO neondb_owner;

--
-- Name: automation_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.automation_actions_id_seq OWNED BY public.automation_actions.id;


--
-- Name: automation_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.automation_logs (
    id integer NOT NULL,
    automation_id integer NOT NULL,
    trigger_id integer,
    entity_type text NOT NULL,
    entity_id integer NOT NULL,
    execution_status public.automation_execution_status NOT NULL,
    error_message text,
    executed_at timestamp without time zone NOT NULL
);


ALTER TABLE public.automation_logs OWNER TO neondb_owner;

--
-- Name: automation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.automation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_logs_id_seq OWNER TO neondb_owner;

--
-- Name: automation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.automation_logs_id_seq OWNED BY public.automation_logs.id;


--
-- Name: automation_triggers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.automation_triggers (
    id integer NOT NULL,
    automation_id integer NOT NULL,
    trigger_type public.automation_trigger_type NOT NULL,
    entity_type text NOT NULL,
    conditions jsonb NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.automation_triggers OWNER TO neondb_owner;

--
-- Name: automation_triggers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.automation_triggers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_triggers_id_seq OWNER TO neondb_owner;

--
-- Name: automation_triggers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.automation_triggers_id_seq OWNED BY public.automation_triggers.id;


--
-- Name: automations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.automations (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.automations OWNER TO neondb_owner;

--
-- Name: automations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.automations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automations_id_seq OWNER TO neondb_owner;

--
-- Name: automations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.automations_id_seq OWNED BY public.automations.id;


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    location text,
    is_all_day boolean DEFAULT false,
    google_event_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.calendar_events OWNER TO neondb_owner;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO neondb_owner;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: client_history_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_history_metrics (
    id integer NOT NULL,
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
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_history_metrics OWNER TO neondb_owner;

--
-- Name: client_history_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_history_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_history_metrics_id_seq OWNER TO neondb_owner;

--
-- Name: client_history_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_history_metrics_id_seq OWNED BY public.client_history_metrics.id;


--
-- Name: client_insights; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_insights (
    id integer NOT NULL,
    client_id integer NOT NULL,
    organization_id integer NOT NULL,
    metric_type text NOT NULL,
    score real NOT NULL,
    calculation_period text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_insights OWNER TO neondb_owner;

--
-- Name: client_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_insights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_insights_id_seq OWNER TO neondb_owner;

--
-- Name: client_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_insights_id_seq OWNED BY public.client_insights.id;


--
-- Name: client_notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_notes (
    id integer NOT NULL,
    client_id integer NOT NULL,
    organization_id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    note_type text NOT NULL,
    visibility text DEFAULT 'all'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_notes OWNER TO neondb_owner;

--
-- Name: client_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_notes_id_seq OWNER TO neondb_owner;

--
-- Name: client_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_notes_id_seq OWNED BY public.client_notes.id;


--
-- Name: client_portal_activity_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_portal_activity_logs (
    id integer NOT NULL,
    client_portal_user_id integer NOT NULL,
    activity_type text NOT NULL,
    entity_type text,
    entity_id integer,
    details text,
    ip_address text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_portal_activity_logs OWNER TO neondb_owner;

--
-- Name: client_portal_activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_portal_activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_portal_activity_logs_id_seq OWNER TO neondb_owner;

--
-- Name: client_portal_activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_portal_activity_logs_id_seq OWNED BY public.client_portal_activity_logs.id;


--
-- Name: client_portal_feedbacks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_portal_feedbacks (
    id integer NOT NULL,
    client_portal_user_id integer NOT NULL,
    organization_id integer NOT NULL,
    project_id integer,
    rating integer NOT NULL,
    comment text,
    feedback_type text NOT NULL,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_portal_feedbacks OWNER TO neondb_owner;

--
-- Name: client_portal_feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_portal_feedbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_portal_feedbacks_id_seq OWNER TO neondb_owner;

--
-- Name: client_portal_feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_portal_feedbacks_id_seq OWNED BY public.client_portal_feedbacks.id;


--
-- Name: client_portal_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_portal_notifications (
    id integer NOT NULL,
    client_portal_id integer NOT NULL,
    client_portal_user_id integer,
    title text NOT NULL,
    message text NOT NULL,
    notification_type text NOT NULL,
    is_read boolean DEFAULT false,
    entity_type text,
    entity_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_portal_notifications OWNER TO neondb_owner;

--
-- Name: client_portal_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_portal_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_portal_notifications_id_seq OWNER TO neondb_owner;

--
-- Name: client_portal_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_portal_notifications_id_seq OWNED BY public.client_portal_notifications.id;


--
-- Name: client_portal_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_portal_sessions (
    id integer NOT NULL,
    client_portal_user_id integer NOT NULL,
    session_token text NOT NULL,
    ip_address text,
    user_agent text,
    login_time timestamp without time zone NOT NULL,
    last_activity timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.client_portal_sessions OWNER TO neondb_owner;

--
-- Name: client_portal_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_portal_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_portal_sessions_id_seq OWNER TO neondb_owner;

--
-- Name: client_portal_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_portal_sessions_id_seq OWNED BY public.client_portal_sessions.id;


--
-- Name: client_portal_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_portal_users (
    id integer NOT NULL,
    client_portal_id integer NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'viewer'::text,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_portal_users OWNER TO neondb_owner;

--
-- Name: client_portal_users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_portal_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_portal_users_id_seq OWNER TO neondb_owner;

--
-- Name: client_portal_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_portal_users_id_seq OWNED BY public.client_portal_users.id;


--
-- Name: client_portals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_portals (
    id integer NOT NULL,
    client_id integer NOT NULL,
    organization_id integer NOT NULL,
    access_key text NOT NULL,
    is_active boolean DEFAULT false,
    access_level text DEFAULT 'standard'::text,
    custom_settings jsonb,
    last_login timestamp without time zone,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.client_portals OWNER TO neondb_owner;

--
-- Name: client_portals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_portals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_portals_id_seq OWNER TO neondb_owner;

--
-- Name: client_portals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_portals_id_seq OWNED BY public.client_portals.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    company_name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    registration_number text,
    address text,
    timezone text DEFAULT 'Europe/Bucharest'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    name text,
    city text,
    county text,
    country text DEFAULT 'România'::text,
    postal_code text,
    vat_number text,
    bank_name text,
    bank_account text,
    notes text,
    status text DEFAULT 'active'::text,
    source text DEFAULT 'direct'::text,
    industry text,
    assigned_to integer,
    created_by integer,
    website text,
    logo text
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    entity_type text NOT NULL,
    entity_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO neondb_owner;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO neondb_owner;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: contract_milestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contract_milestones (
    id integer NOT NULL,
    contract_id integer NOT NULL,
    title text NOT NULL,
    description text,
    due_date date,
    value real,
    status text NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contract_milestones OWNER TO neondb_owner;

--
-- Name: contract_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contract_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_milestones_id_seq OWNER TO neondb_owner;

--
-- Name: contract_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contract_milestones_id_seq OWNED BY public.contract_milestones.id;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contracts (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    client_id integer NOT NULL,
    project_id integer,
    title text NOT NULL,
    contract_number text,
    start_date date NOT NULL,
    end_date date,
    value real,
    currency text DEFAULT 'RON'::text,
    status text NOT NULL,
    contract_type text NOT NULL,
    file_url text,
    renewal_reminder_days integer,
    auto_renewal boolean DEFAULT false,
    terms text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contracts OWNER TO neondb_owner;

--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_id_seq OWNER TO neondb_owner;

--
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- Name: department_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.department_members (
    id integer NOT NULL,
    department_id integer NOT NULL,
    team_member_id integer NOT NULL,
    is_manager boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.department_members OWNER TO neondb_owner;

--
-- Name: department_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.department_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_members_id_seq OWNER TO neondb_owner;

--
-- Name: department_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.department_members_id_seq OWNED BY public.department_members.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    organization_id integer NOT NULL,
    manager_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    description text,
    created_by integer
);


ALTER TABLE public.departments OWNER TO neondb_owner;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO neondb_owner;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: email_attachments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_attachments (
    id integer NOT NULL,
    email_id integer NOT NULL,
    file_id integer,
    file_name text NOT NULL,
    file_path text,
    file_size integer,
    mime_type text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_attachments OWNER TO neondb_owner;

--
-- Name: email_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_attachments_id_seq OWNER TO neondb_owner;

--
-- Name: email_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_attachments_id_seq OWNED BY public.email_attachments.id;


--
-- Name: email_recipients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_recipients (
    id integer NOT NULL,
    email_id integer NOT NULL,
    recipient_type public.email_recipient_type NOT NULL,
    recipient_email text NOT NULL,
    recipient_name text,
    user_id integer,
    client_id integer,
    status text DEFAULT 'pending'::text,
    opened_at timestamp without time zone,
    opened_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_recipients OWNER TO neondb_owner;

--
-- Name: email_recipients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_recipients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_recipients_id_seq OWNER TO neondb_owner;

--
-- Name: email_recipients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_recipients_id_seq OWNED BY public.email_recipients.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    organization_id integer,
    name text NOT NULL,
    description text,
    subject text NOT NULL,
    body text NOT NULL,
    template_type text NOT NULL,
    placeholders jsonb,
    is_html boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_templates OWNER TO neondb_owner;

--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_templates_id_seq OWNER TO neondb_owner;

--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: email_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_tracking (
    id integer NOT NULL,
    email_id integer NOT NULL,
    recipient_id integer,
    event_type public.email_event_type NOT NULL,
    event_time timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    link_clicked text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_tracking OWNER TO neondb_owner;

--
-- Name: email_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_tracking_id_seq OWNER TO neondb_owner;

--
-- Name: email_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_tracking_id_seq OWNED BY public.email_tracking.id;


--
-- Name: emails; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.emails (
    id integer NOT NULL,
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
    status public.email_status DEFAULT 'draft'::public.email_status,
    scheduled_for timestamp without time zone,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.emails OWNER TO neondb_owner;

--
-- Name: emails_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.emails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emails_id_seq OWNER TO neondb_owner;

--
-- Name: emails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.emails_id_seq OWNED BY public.emails.id;


--
-- Name: employee_evaluations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employee_evaluations (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    employee_id integer NOT NULL,
    evaluator_id integer NOT NULL,
    evaluation_period text NOT NULL,
    performance_score real,
    strengths text,
    areas_for_improvement text,
    goals text,
    visibility public.evaluation_visibility DEFAULT 'manager'::public.evaluation_visibility,
    status text DEFAULT 'draft'::text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_evaluations OWNER TO neondb_owner;

--
-- Name: employee_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.employee_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_evaluations_id_seq OWNER TO neondb_owner;

--
-- Name: employee_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.employee_evaluations_id_seq OWNED BY public.employee_evaluations.id;


--
-- Name: employee_goals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employee_goals (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    employee_id integer NOT NULL,
    manager_id integer,
    title text NOT NULL,
    description text,
    goal_type text NOT NULL,
    priority text DEFAULT 'medium'::text,
    start_date date,
    end_date date,
    progress_percentage integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_goals OWNER TO neondb_owner;

--
-- Name: employee_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.employee_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_goals_id_seq OWNER TO neondb_owner;

--
-- Name: employee_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.employee_goals_id_seq OWNED BY public.employee_goals.id;


--
-- Name: employee_performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employee_performance_metrics (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    user_id integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    tasks_assigned integer DEFAULT 0,
    tasks_completed integer DEFAULT 0,
    tasks_completed_on_time integer DEFAULT 0,
    completion_rate real DEFAULT 0,
    on_time_rate real DEFAULT 0,
    total_hours_logged real DEFAULT 0,
    billable_hours real DEFAULT 0,
    billable_ratio real DEFAULT 0,
    avg_task_completion_time real DEFAULT 0,
    projects_contributed integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_performance_metrics OWNER TO neondb_owner;

--
-- Name: employee_performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.employee_performance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_performance_metrics_id_seq OWNER TO neondb_owner;

--
-- Name: employee_performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.employee_performance_metrics_id_seq OWNED BY public.employee_performance_metrics.id;


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.evaluations (
    id integer NOT NULL,
    evaluated_user_id integer NOT NULL,
    evaluator_id integer NOT NULL,
    organization_id integer NOT NULL,
    score integer,
    criteria jsonb,
    comments text,
    visibility public.evaluation_visibility DEFAULT 'private'::public.evaluation_visibility,
    is_submitted boolean DEFAULT false,
    date date NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.evaluations OWNER TO neondb_owner;

--
-- Name: evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.evaluations_id_seq OWNER TO neondb_owner;

--
-- Name: evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.evaluations_id_seq OWNED BY public.evaluations.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.files (
    id integer NOT NULL,
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
    access_level public.file_access_level DEFAULT 'all'::public.file_access_level,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.files OWNER TO neondb_owner;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.files_id_seq OWNER TO neondb_owner;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: financial_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.financial_metrics (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_revenue real DEFAULT 0,
    total_expenses real DEFAULT 0,
    profit real DEFAULT 0,
    invoiced_amount real DEFAULT 0,
    paid_amount real DEFAULT 0,
    outstanding_amount real DEFAULT 0,
    billable_hours real DEFAULT 0,
    non_billable_hours real DEFAULT 0,
    billable_rate_avg real DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.financial_metrics OWNER TO neondb_owner;

--
-- Name: financial_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.financial_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_metrics_id_seq OWNER TO neondb_owner;

--
-- Name: financial_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.financial_metrics_id_seq OWNED BY public.financial_metrics.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description text NOT NULL,
    quantity real NOT NULL,
    unit_price real NOT NULL,
    total_price real NOT NULL,
    order_index integer DEFAULT 0
);


ALTER TABLE public.invoice_items OWNER TO neondb_owner;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO neondb_owner;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoice_payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoice_payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_date timestamp without time zone NOT NULL,
    payment_method character varying(100) NOT NULL,
    reference text,
    notes text,
    created_by integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.invoice_payments OWNER TO neondb_owner;

--
-- Name: invoice_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoice_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_payments_id_seq OWNER TO neondb_owner;

--
-- Name: invoice_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoice_payments_id_seq OWNED BY public.invoice_payments.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    client_id integer NOT NULL,
    project_id integer,
    invoice_number text NOT NULL,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status,
    total_amount real NOT NULL,
    tax_amount real DEFAULT 0,
    currency text DEFAULT 'RON'::text,
    notes text,
    payment_date date,
    payment_terms text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    subtotal real,
    discount_rate real,
    discount_amount real,
    paid_amount real DEFAULT 0,
    remaining_amount real,
    tax_rate real DEFAULT 19
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization_id integer NOT NULL,
    notification_type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    entity_type text,
    entity_id integer,
    action_url text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    logo character varying(255),
    organization_type public.organization_type NOT NULL,
    subscription_plan public.subscription_plan DEFAULT 'trial'::public.subscription_plan NOT NULL,
    trial_expires_at timestamp without time zone,
    subscription_started_at timestamp without time zone,
    subscription_expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    has_departments boolean DEFAULT false
);


ALTER TABLE public.organizations OWNER TO neondb_owner;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO neondb_owner;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    amount_paid real NOT NULL,
    date_paid timestamp without time zone NOT NULL,
    payment_method text NOT NULL,
    transaction_id text,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO neondb_owner;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    client_id integer NOT NULL,
    name text NOT NULL,
    description text,
    project_type public.project_type NOT NULL,
    status public.project_status DEFAULT 'planned'::public.project_status,
    start_date date,
    deadline date,
    budget real,
    currency text DEFAULT 'RON'::text,
    hourly_rate real,
    visibility public.project_visibility DEFAULT 'all'::public.project_visibility,
    slug text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    due_date date,
    end_date date,
    priority text DEFAULT 'medium'::text,
    category text,
    estimated_hours numeric,
    completion_percentage integer DEFAULT 0,
    manager_id integer,
    is_fixed_price boolean DEFAULT true,
    notes text
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: task_assignees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_assignees (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    is_primary boolean DEFAULT false,
    assigned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.task_assignees OWNER TO neondb_owner;

--
-- Name: task_assignees_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_assignees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_assignees_id_seq OWNER TO neondb_owner;

--
-- Name: task_assignees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_assignees_id_seq OWNED BY public.task_assignees.id;


--
-- Name: task_checklists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_checklists (
    id integer NOT NULL,
    task_id integer NOT NULL,
    title text NOT NULL,
    is_completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    completed_by integer,
    is_required boolean DEFAULT false,
    visibility public.checklist_visibility DEFAULT 'internal_only'::public.checklist_visibility,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.task_checklists OWNER TO neondb_owner;

--
-- Name: task_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_checklists_id_seq OWNER TO neondb_owner;

--
-- Name: task_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_checklists_id_seq OWNED BY public.task_checklists.id;


--
-- Name: task_tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_tags (
    id integer NOT NULL,
    task_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.task_tags OWNER TO neondb_owner;

--
-- Name: task_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_tags_id_seq OWNER TO neondb_owner;

--
-- Name: task_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_tags_id_seq OWNED BY public.task_tags.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    project_id integer NOT NULL,
    organization_id integer NOT NULL,
    title text NOT NULL,
    description text,
    status public.task_status DEFAULT 'todo'::public.task_status,
    priority public.task_priority DEFAULT 'medium'::public.task_priority,
    parent_task_id integer,
    assignee_id integer,
    reporter_id integer,
    estimated_hours real,
    actual_hours real,
    due_date timestamp without time zone,
    visibility public.task_visibility DEFAULT 'all'::public.task_visibility,
    tags jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    user_id integer,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text NOT NULL,
    "position" text,
    bio text,
    avatar text,
    hourly_rate real,
    is_active boolean DEFAULT true,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    temp_password character varying(100),
    password_set boolean DEFAULT false NOT NULL
);


ALTER TABLE public.team_members OWNER TO neondb_owner;

--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_members_id_seq OWNER TO neondb_owner;

--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: time_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.time_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization_id integer NOT NULL,
    task_id integer,
    project_id integer,
    description text,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    duration_minutes integer NOT NULL,
    is_billable boolean DEFAULT true,
    source public.time_log_source DEFAULT 'manual'::public.time_log_source,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.time_logs OWNER TO neondb_owner;

--
-- Name: time_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.time_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_logs_id_seq OWNER TO neondb_owner;

--
-- Name: time_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.time_logs_id_seq OWNED BY public.time_logs.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    theme text DEFAULT 'light'::text,
    language text DEFAULT 'ro'::text,
    dashboard_layout jsonb,
    notification_settings jsonb,
    email_settings jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_preferences OWNER TO neondb_owner;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_preferences_id_seq OWNER TO neondb_owner;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    "position" text,
    skills jsonb,
    bio text,
    preferred_language text DEFAULT 'ro'::text,
    hourly_rate real,
    role public.user_role DEFAULT 'employee'::public.user_role NOT NULL,
    organization_id integer,
    department_id integer,
    stripe_customer_id text,
    stripe_subscription_id text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_profiles OWNER TO neondb_owner;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profiles_id_seq OWNER TO neondb_owner;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role public.user_role DEFAULT 'ceo'::public.user_role,
    organization_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: automation_actions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_actions ALTER COLUMN id SET DEFAULT nextval('public.automation_actions_id_seq'::regclass);


--
-- Name: automation_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_logs ALTER COLUMN id SET DEFAULT nextval('public.automation_logs_id_seq'::regclass);


--
-- Name: automation_triggers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_triggers ALTER COLUMN id SET DEFAULT nextval('public.automation_triggers_id_seq'::regclass);


--
-- Name: automations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automations ALTER COLUMN id SET DEFAULT nextval('public.automations_id_seq'::regclass);


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: client_history_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_history_metrics ALTER COLUMN id SET DEFAULT nextval('public.client_history_metrics_id_seq'::regclass);


--
-- Name: client_insights id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_insights ALTER COLUMN id SET DEFAULT nextval('public.client_insights_id_seq'::regclass);


--
-- Name: client_notes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_notes ALTER COLUMN id SET DEFAULT nextval('public.client_notes_id_seq'::regclass);


--
-- Name: client_portal_activity_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_activity_logs ALTER COLUMN id SET DEFAULT nextval('public.client_portal_activity_logs_id_seq'::regclass);


--
-- Name: client_portal_feedbacks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_feedbacks ALTER COLUMN id SET DEFAULT nextval('public.client_portal_feedbacks_id_seq'::regclass);


--
-- Name: client_portal_notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_notifications ALTER COLUMN id SET DEFAULT nextval('public.client_portal_notifications_id_seq'::regclass);


--
-- Name: client_portal_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_sessions ALTER COLUMN id SET DEFAULT nextval('public.client_portal_sessions_id_seq'::regclass);


--
-- Name: client_portal_users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_users ALTER COLUMN id SET DEFAULT nextval('public.client_portal_users_id_seq'::regclass);


--
-- Name: client_portals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portals ALTER COLUMN id SET DEFAULT nextval('public.client_portals_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: contract_milestones id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_milestones ALTER COLUMN id SET DEFAULT nextval('public.contract_milestones_id_seq'::regclass);


--
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- Name: department_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department_members ALTER COLUMN id SET DEFAULT nextval('public.department_members_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: email_attachments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_attachments ALTER COLUMN id SET DEFAULT nextval('public.email_attachments_id_seq'::regclass);


--
-- Name: email_recipients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_recipients ALTER COLUMN id SET DEFAULT nextval('public.email_recipients_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: email_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_tracking ALTER COLUMN id SET DEFAULT nextval('public.email_tracking_id_seq'::regclass);


--
-- Name: emails id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emails ALTER COLUMN id SET DEFAULT nextval('public.emails_id_seq'::regclass);


--
-- Name: employee_evaluations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_evaluations ALTER COLUMN id SET DEFAULT nextval('public.employee_evaluations_id_seq'::regclass);


--
-- Name: employee_goals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_goals ALTER COLUMN id SET DEFAULT nextval('public.employee_goals_id_seq'::regclass);


--
-- Name: employee_performance_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_performance_metrics ALTER COLUMN id SET DEFAULT nextval('public.employee_performance_metrics_id_seq'::regclass);


--
-- Name: evaluations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.evaluations ALTER COLUMN id SET DEFAULT nextval('public.evaluations_id_seq'::regclass);


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: financial_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_metrics ALTER COLUMN id SET DEFAULT nextval('public.financial_metrics_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoice_payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_payments ALTER COLUMN id SET DEFAULT nextval('public.invoice_payments_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: task_assignees id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_assignees ALTER COLUMN id SET DEFAULT nextval('public.task_assignees_id_seq'::regclass);


--
-- Name: task_checklists id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_checklists ALTER COLUMN id SET DEFAULT nextval('public.task_checklists_id_seq'::regclass);


--
-- Name: task_tags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_tags ALTER COLUMN id SET DEFAULT nextval('public.task_tags_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: time_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_logs ALTER COLUMN id SET DEFAULT nextval('public.time_logs_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_log (id, user_id, action, entity_type, entity_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_logs (id, user_id, organization_id, action, entity_type, entity_id, metadata, created_at) FROM stdin;
1	1	3	create	client	2	{"name": "Technovate SRL"}	2025-04-02 20:34:06.695758
2	1	3	create	client	3	{"name": "Digital Marketing Pro"}	2025-04-02 20:34:06.695758
3	1	3	create	client	4	{"name": "Construct Expert SA"}	2025-04-02 20:34:06.695758
4	1	3	create	project	2	{"name": "Dezvoltare Website Corporativ"}	2025-04-03 20:34:06.695758
5	1	3	create	project	3	{"name": "Campanie SEO"}	2025-04-03 20:34:06.695758
6	1	3	create	project	4	{"name": "Platformă E-commerce"}	2025-04-03 20:34:06.695758
7	1	3	create	project	5	{"name": "Branding și Identitate Vizuală"}	2025-04-03 20:34:06.695758
8	1	3	create	task	1	{"title": "Analiză cerințe website"}	2025-04-04 20:34:06.695758
9	1	3	update	task	1	{"status_changed": "todo->done"}	2025-04-05 08:34:06.695758
10	1	3	create	task	2	{"title": "Design homepage"}	2025-04-04 20:34:06.695758
11	1	3	update	task	2	{"status_changed": "todo->in_progress"}	2025-04-05 10:34:06.695758
12	1	3	create	invoice	1	{"amount": 3000, "invoice_number": "INV-2025-001"}	2025-04-05 10:34:06.695758
13	1	3	update	invoice	1	{"status_changed": "draft->sent"}	2025-04-05 12:34:06.695758
14	1	3	create	time_log	1	{"task": "Analiză cerințe și documentare", "duration_minutes": 60}	2025-04-05 14:34:06.695758
15	1	3	create	time_log	2	{"task": "Design mockup homepage", "duration_minutes": 180}	2025-04-05 16:34:06.695758
16	1	3	comment	task	4	{"comment_id": 1, "task_title": "Optimizare cuvinte cheie"}	2025-04-06 21:21:06.849
17	1	3	delete	invoice	1	{"invoice_number": "INV-2025-001"}	2025-04-07 07:12:00.212
18	1	3	delete	invoice	4	{"invoice_number": "INV-2025-004"}	2025-04-07 07:12:06.912
19	1	3	delete	invoice	2	{"invoice_number": "INV-2025-002"}	2025-04-07 07:12:10.857
20	1	3	delete	invoice	3	{"invoice_number": "INV-2025-003"}	2025-04-07 07:12:14.496
21	1	3	create	invoice	5	{"invoice_number": "Test"}	2025-04-07 09:42:39.151
22	1	3	delete	invoice	5	{"invoice_number": "Test"}	2025-04-07 10:30:09.739
23	1	3	create	invoice	6	{"invoice_number": "TEST"}	2025-04-07 10:30:50.446
24	1	3	delete	invoice	6	{"invoice_number": "TEST"}	2025-04-07 10:35:28.636
25	1	3	create	invoice	8	{"invoice_number": "INV-2025-001"}	2025-04-07 10:41:06.979
26	1	3	create	invoice_payment	1	{"amount": 163.5, "invoice_id": 8}	2025-04-07 11:06:31.681
27	1	3	create	team_member	1	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 11:55:59.035
28	1	3	create	team_member	2	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 12:05:37.093
29	1	3	delete	team_member	2	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 12:12:22.521
30	1	3	create	team_member	3	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 12:12:41.094
31	1	3	create	team_member	4	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 12:30:38.675
32	1	3	create	team_member	5	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 12:37:48.329
33	1	3	delete	team_member	5	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 12:38:49.164
34	1	3	create	team_member	6	{"role": "colaborator", "member_name": "Stefan Kis"}	2025-04-07 12:39:28.699
35	1	3	create	team_member	7	{"role": "colaborator", "member_name": "Stefan Kis"}	2025-04-07 12:48:10.554
36	1	3	delete	team_member	7	{"role": "colaborator", "member_name": "Stefan Kis"}	2025-04-07 13:01:32.778
37	1	3	create	team_member	8	{"role": "colaborator", "member_name": "Stefan Kis"}	2025-04-07 13:02:02.29
38	1	3	create	team_member	9	{"role": "angajat", "member_name": "Luca Design"}	2025-04-07 13:09:11.739
39	1	3	create	team_member	10	{"role": "angajat", "member_name": "Stefan Kis"}	2025-04-07 13:12:32.157
40	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:15:48.775
41	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:16:34.666
42	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:20:27.624
43	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:20:55.985
44	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:24:50.109
45	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:27:10.791
46	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:27:15.891
47	1	3	update	task	4	{"task_title": "Optimizare cuvinte cheie", "updated_fields": "assignee_id"}	2025-04-07 14:27:23.014
48	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:31:05.425
49	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:31:09.376
50	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:31:12.74
51	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:34:14.155
52	1	3	update	task	1	{"task_title": "Analiză cerințe website", "updated_fields": "assignee_id"}	2025-04-07 14:34:18.332
53	1	3	update	task	2	{"task_title": "Design homepage", "updated_fields": "assignee_id"}	2025-04-07 14:34:28.702
54	1	3	update	task	4	{"task_title": "Optimizare cuvinte cheie", "updated_fields": "assignee_id"}	2025-04-07 14:34:32.428
55	1	3	update	task	4	{"task_title": "Optimizare cuvinte cheie", "updated_fields": "assignee_id"}	2025-04-07 16:31:57.504
\.


--
-- Data for Name: automation_actions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.automation_actions (id, automation_id, action_type, action_config, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: automation_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.automation_logs (id, automation_id, trigger_id, entity_type, entity_id, execution_status, error_message, executed_at) FROM stdin;
\.


--
-- Data for Name: automation_triggers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.automation_triggers (id, automation_id, trigger_type, entity_type, conditions, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: automations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.automations (id, organization_id, name, description, is_active, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.calendar_events (id, organization_id, user_id, title, description, start_time, end_time, location, is_all_day, google_event_id, created_at, updated_at) FROM stdin;
1	3	1	Ședință client Technovate	Discuție despre cerințele site-ului web	2025-04-08 06:34:39.105243	2025-04-08 08:34:39.105243	Online - Google Meet	f	\N	2025-04-05 20:34:39.105243	2025-04-05 20:34:39.105243
2	3	1	Deadline Design Homepage	Finalizare mockup homepage pentru Technovate	2025-04-10 20:34:39.105243	2025-04-10 20:34:39.105243	\N	t	\N	2025-04-05 20:34:39.105243	2025-04-05 20:34:39.105243
3	3	1	Prezentare Logo Client	Prezentare variante logo pentru Construct Expert	2025-04-09 10:34:39.105243	2025-04-09 12:04:39.105243	Sediul clientului	f	\N	2025-04-05 20:34:39.105243	2025-04-05 20:34:39.105243
4	3	1	Workshop Strategie SEO	Planificare strategie și obiective pentru campania SEO	2025-04-07 05:34:39.105243	2025-04-07 09:34:39.105243	Sediul firmei	f	\N	2025-04-05 20:34:39.105243	2025-04-05 20:34:39.105243
5	3	1	Evaluare Progres Proiecte	Analiză lunară a statusului tuturor proiectelor active	2025-04-13 06:34:39.105243	2025-04-13 08:34:39.105243	Sediul firmei - Sala de conferințe	f	\N	2025-04-05 20:34:39.105243	2025-04-05 20:34:39.105243
\.


--
-- Data for Name: client_history_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_history_metrics (id, organization_id, client_id, period_start, period_end, projects_count, active_projects_count, completed_projects_count, total_revenue, average_project_value, total_hours_spent, invoices_count, invoices_paid_count, average_payment_days, created_at, updated_at) FROM stdin;
1	3	2	2024-12-01	2024-12-31	1	1	0	5000	5000	40	1	1	5	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
2	3	2	2025-01-01	2025-01-31	2	2	0	7000	3500	60	2	2	7	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
3	3	2	2025-02-01	2025-02-28	2	2	0	8000	4000	85	2	2	6	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
4	3	2	2025-03-01	2025-03-31	2	2	0	9000	4500	95	3	2	6	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
5	3	3	2024-12-01	2024-12-31	0	0	0	0	0	0	0	0	0	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
6	3	3	2025-01-01	2025-01-31	1	1	0	2000	2000	25	1	1	4	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
7	3	3	2025-02-01	2025-02-28	1	1	0	4000	4000	45	1	1	5	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
8	3	3	2025-03-01	2025-03-31	1	1	0	6000	6000	60	2	1	7	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
9	3	4	2024-12-01	2024-12-31	0	0	0	0	0	0	0	0	0	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
10	3	4	2025-01-01	2025-01-31	0	0	0	0	0	0	0	0	0	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
11	3	4	2025-02-01	2025-02-28	1	1	0	1500	1500	15	1	0	0	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
12	3	4	2025-03-01	2025-03-31	1	1	0	3500	3500	35	1	0	0	2025-04-05 20:35:57.644447	2025-04-05 20:35:57.644447
\.


--
-- Data for Name: client_insights; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_insights (id, client_id, organization_id, metric_type, score, calculation_period, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_notes (id, client_id, organization_id, user_id, title, content, note_type, visibility, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_portal_activity_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_portal_activity_logs (id, client_portal_user_id, activity_type, entity_type, entity_id, details, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: client_portal_feedbacks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_portal_feedbacks (id, client_portal_user_id, organization_id, project_id, rating, comment, feedback_type, is_public, created_at) FROM stdin;
\.


--
-- Data for Name: client_portal_notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_portal_notifications (id, client_portal_id, client_portal_user_id, title, message, notification_type, is_read, entity_type, entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: client_portal_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_portal_sessions (id, client_portal_user_id, session_token, ip_address, user_agent, login_time, last_activity, expires_at, is_active) FROM stdin;
\.


--
-- Data for Name: client_portal_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_portal_users (id, client_portal_id, email, full_name, password_hash, role, is_active, last_login, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_portals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_portals (id, client_id, organization_id, access_key, is_active, access_level, custom_settings, last_login, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, organization_id, company_name, contact_person, email, phone, registration_number, address, timezone, created_at, updated_at, name, city, county, country, postal_code, vat_number, bank_name, bank_account, notes, status, source, industry, assigned_to, created_by, website, logo) FROM stdin;
2	3	Technovate SRL	Ion Popescu	contact@technovate.ro	0722123456	\N	Str. Aviatorilor 10	Europe/Bucharest	2025-04-05 20:29:59.127458	2025-04-05 20:29:59.127458	Technovate SRL	București	Sector 1	România	011111	\N	\N	\N	\N	active	direct	IT	\N	1	https://technovate.ro	\N
3	3	Digital Marketing Pro SRL	Maria Ionescu	office@digitalmarketingpro.ro	0744556677	\N	Bd. Decebal 14	Europe/Bucharest	2025-04-05 20:29:59.127458	2025-04-05 20:29:59.127458	Digital Marketing Pro	București	Sector 3	România	030963	\N	\N	\N	\N	active	referral	Marketing	\N	1	https://digitalmarketingpro.ro	\N
4	3	Construct Expert SA	Andrei Vasilescu	info@constructexpert.ro	0756789012	\N	Calea Plevnei 110	Europe/Bucharest	2025-04-05 20:29:59.127458	2025-04-05 20:29:59.127458	Construct Expert SA	București	Sector 6	România	060011	\N	\N	\N	\N	active	website	Construcții	\N	1	https://constructexpert.ro	\N
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comments (id, entity_type, entity_id, user_id, content, is_internal, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contract_milestones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contract_milestones (id, contract_id, title, description, due_date, value, status, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contracts (id, organization_id, client_id, project_id, title, contract_number, start_date, end_date, value, currency, status, contract_type, file_url, renewal_reminder_days, auto_renewal, terms, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: department_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.department_members (id, department_id, team_member_id, is_manager, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.departments (id, name, organization_id, manager_id, created_at, updated_at, description, created_by) FROM stdin;
\.


--
-- Data for Name: email_attachments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_attachments (id, email_id, file_id, file_name, file_path, file_size, mime_type, created_at) FROM stdin;
\.


--
-- Data for Name: email_recipients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_recipients (id, email_id, recipient_type, recipient_email, recipient_name, user_id, client_id, status, opened_at, opened_count, created_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_templates (id, organization_id, name, description, subject, body, template_type, placeholders, is_html, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_tracking (id, email_id, recipient_id, event_type, event_time, ip_address, user_agent, link_clicked, created_at) FROM stdin;
\.


--
-- Data for Name: emails; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.emails (id, organization_id, sender_id, sender_email, reply_to, subject, body, is_html, email_template_id, related_entity_type, related_entity_id, status, scheduled_for, sent_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_evaluations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employee_evaluations (id, organization_id, employee_id, evaluator_id, evaluation_period, performance_score, strengths, areas_for_improvement, goals, visibility, status, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_goals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employee_goals (id, organization_id, employee_id, manager_id, title, description, goal_type, priority, start_date, end_date, progress_percentage, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_performance_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employee_performance_metrics (id, organization_id, user_id, period_start, period_end, tasks_assigned, tasks_completed, tasks_completed_on_time, completion_rate, on_time_rate, total_hours_logged, billable_hours, billable_ratio, avg_task_completion_time, projects_contributed, created_at, updated_at) FROM stdin;
1	3	1	2024-12-01	2024-12-31	25	20	18	80	72	160	120	75	8	4	2025-04-05 20:35:37.180516	2025-04-05 20:35:37.180516
2	3	1	2025-01-01	2025-01-31	30	28	25	93.3	83.3	175	150	85.7	6.25	4	2025-04-05 20:35:37.180516	2025-04-05 20:35:37.180516
3	3	1	2025-02-01	2025-02-28	32	30	27	93.8	84.4	190	180	94.7	6	5	2025-04-05 20:35:37.180516	2025-04-05 20:35:37.180516
4	3	1	2025-03-01	2025-03-31	35	33	31	94.3	88.6	220	200	90.9	6.1	5	2025-04-05 20:35:37.180516	2025-04-05 20:35:37.180516
\.


--
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.evaluations (id, evaluated_user_id, evaluator_id, organization_id, score, criteria, comments, visibility, is_submitted, date, created_at) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.files (id, organization_id, uploader_id, file_name, original_name, file_path, mime_type, file_size, entity_type, entity_id, is_public, access_level, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.financial_metrics (id, organization_id, period_start, period_end, total_revenue, total_expenses, profit, invoiced_amount, paid_amount, outstanding_amount, billable_hours, non_billable_hours, billable_rate_avg, created_at, updated_at) FROM stdin;
1	3	2024-12-01	2024-12-31	15000	5500	9500	15000	12000	3000	120	30	125	2025-04-05 20:35:22.832996	2025-04-05 20:35:22.832996
2	3	2025-01-01	2025-01-31	18000	6000	12000	18000	15000	3000	150	35	120	2025-04-05 20:35:22.832996	2025-04-05 20:35:22.832996
3	3	2025-02-01	2025-02-28	22000	7000	15000	22000	16000	6000	180	40	122	2025-04-05 20:35:22.832996	2025-04-05 20:35:22.832996
4	3	2025-03-01	2025-03-31	25000	7500	17500	25000	18000	7000	200	45	125	2025-04-05 20:35:22.832996	2025-04-05 20:35:22.832996
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price, total_price, order_index) FROM stdin;
7	8	Item 1	1	150	150	0
\.


--
-- Data for Name: invoice_payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoice_payments (id, invoice_id, amount, payment_date, payment_method, reference, notes, created_by, created_at, updated_at) FROM stdin;
1	8	163.50	2025-04-07 11:06:31.15	transfer bancar	Test	Test nota.	1	2025-04-07 11:06:31.285	2025-04-07 11:06:31.285
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, organization_id, client_id, project_id, invoice_number, issue_date, due_date, status, total_amount, tax_amount, currency, notes, payment_date, payment_terms, created_by, created_at, updated_at, subtotal, discount_rate, discount_amount, paid_amount, remaining_amount, tax_rate) FROM stdin;
8	3	4	5	INV-2025-001	2025-04-07	2025-04-10	paid	163.5	28.5	RON	Note factură.	\N	15 zile	1	2025-04-07 10:41:06.692	2025-04-07 11:06:31.55	150	10	15	163.5	163.5	19
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, organization_id, notification_type, title, message, is_read, entity_type, entity_id, action_url, created_at) FROM stdin;
1	1	3	invoice	Factură restantă	Factura INV-2025-003 pentru Construct Expert SA este restantă cu 10 zile	f	invoice	3	/invoices/3	2025-04-03 20:36:28.76404
2	1	3	task_update	Task nou asignat	Ai primit un task nou: Design homepage	f	task	2	/tasks/2	2025-04-04 20:36:28.76404
3	1	3	reminder	Deadline apropiat	Task-ul "Implementare secțiune produse" are deadline-ul în 10 zile	f	task	3	/tasks/3	2025-04-05 08:36:28.76404
4	1	3	reminder	Ședință programată	Ședință client Technovate în 2 zile	f	calendar_event	1	/calendar	2025-04-05 14:36:28.76404
5	1	3	invoice	Factură plătită	Factura INV-2025-004 pentru Technovate SRL a fost marcată ca plătită	t	invoice	4	/invoices/4	2025-03-31 20:36:28.76404
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.organizations (id, name, slug, logo, organization_type, subscription_plan, trial_expires_at, subscription_started_at, subscription_expires_at, is_active, created_at, updated_at, has_departments) FROM stdin;
1	PREMIUM WEB DESIGN & DEVELOPMENT	premium-web-design-development-4861	\N	agency	trial	2025-05-05 18:32:34.861	\N	\N	t	2025-04-05 18:32:35.480302	2025-04-05 18:32:35.480302	f
2	PREMIUM WEB DESIGN & DEVELOPMENT	premium-web-design-development-2065	\N	agency	trial	2025-05-05 18:38:22.065	\N	\N	t	2025-04-05 18:38:23.20308	2025-04-05 18:38:23.20308	f
3	PREMIUM WEB DESIGN & DEVELOPMENT	premium-web-design-development-8311	\N	agency	trial	2025-05-05 18:44:08.311	\N	\N	t	2025-04-05 18:44:08.425761	2025-04-07 11:31:25.111	f
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, invoice_id, amount_paid, date_paid, payment_method, transaction_id, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, organization_id, client_id, name, description, project_type, status, start_date, deadline, budget, currency, hourly_rate, visibility, slug, created_by, created_at, updated_at, due_date, end_date, priority, category, estimated_hours, completion_percentage, manager_id, is_fixed_price, notes) FROM stdin;
2	3	2	Dezvoltare Website Corporativ	Redesign complet și dezvoltare site prezentare	one_time	active	2025-04-05	\N	5000	RON	\N	all	\N	1	2025-04-05 20:30:59.686866	2025-04-05 20:30:59.686866	2025-05-05	\N	high	\N	\N	60	\N	t	\N
3	3	2	Campanie SEO	Optimizare pentru motoare de căutare	retainer	active	2025-03-21	\N	2000	RON	\N	all	\N	1	2025-04-05 20:30:59.686866	2025-04-05 20:30:59.686866	2025-06-04	\N	medium	\N	\N	35	\N	t	\N
4	3	3	Platformă E-commerce	Dezvoltare magazin online cu sistem de plăți	one_time	active	2025-03-06	\N	12000	RON	\N	all	\N	1	2025-04-05 20:30:59.686866	2025-04-05 20:30:59.686866	2025-07-04	\N	high	\N	\N	25	\N	t	\N
5	3	4	Branding și Identitate Vizuală	Creare logo, brand guide și materiale de marketing	one_time	planned	2025-03-31	\N	3500	RON	\N	all	\N	1	2025-04-05 20:30:59.686866	2025-04-05 20:30:59.686866	2025-04-30	\N	medium	\N	\N	0	\N	t	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
1fe5J8SeAKg_YijYOmOLLfhx4kb7qmrF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-14T13:13:08.728Z","secure":false,"httpOnly":true,"path":"/"},"userId":8}	2025-04-14 14:34:54
Wyu14BGiXR_18kfPjg2j0renYVV6MbJv	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-14T13:07:47.494Z","secure":false,"httpOnly":true,"path":"/"},"userId":1}	2025-04-14 16:31:59
fPnd8GT8JzcDiZLAXZegtRdY1EZNiHMy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-13T19:42:04.989Z","secure":false,"httpOnly":true,"path":"/"},"userId":1}	2025-04-14 14:35:04
\.


--
-- Data for Name: task_assignees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_assignees (id, task_id, user_id, is_primary, assigned_at) FROM stdin;
\.


--
-- Data for Name: task_checklists; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_checklists (id, task_id, title, is_completed, completed_at, completed_by, is_required, visibility, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: task_tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_tags (id, task_id, tag_id) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, project_id, organization_id, title, description, status, priority, parent_task_id, assignee_id, reporter_id, estimated_hours, actual_hours, due_date, visibility, tags, created_at, updated_at) FROM stdin;
3	2	3	Implementare secțiune produse	Dezvoltarea secțiunii de afișare produse	todo	medium	\N	1	1	15	\N	2025-04-15 00:00:00	all	\N	2025-04-05 20:32:06.091881	2025-04-05 20:32:06.091881
5	4	3	Integrare sistem de plăți	Implementarea Stripe pentru procesarea plăților	todo	urgent	\N	1	1	20	\N	2025-04-20 00:00:00	all	\N	2025-04-05 20:32:06.091881	2025-04-05 20:32:06.091881
6	5	3	Design logo client	Crearea a trei variante de logo pentru client	todo	high	\N	1	1	12	\N	2025-04-12 00:00:00	all	\N	2025-04-05 20:32:06.091881	2025-04-05 20:32:06.091881
1	2	3	Analiză cerințe website	Documentarea tuturor cerințelor funcționale și non-funcționale	done	high	\N	8	1	5	\N	2025-03-31 00:00:00	all	\N	2025-04-05 20:32:06.091881	2025-04-07 14:34:18.205
2	2	3	Design homepage	Crearea designului pentru pagina principală	in_progress	high	\N	\N	1	10	\N	2025-04-10 00:00:00	all	\N	2025-04-05 20:32:06.091881	2025-04-07 14:34:28.564
4	3	3	Optimizare cuvinte cheie	Cercetarea și selectarea cuvintelor cheie relevante	in_progress	medium	\N	1	1	8	\N	2025-04-08 00:00:00	all	\N	2025-04-05 20:32:06.091881	2025-04-07 16:31:57.377
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.team_members (id, organization_id, user_id, first_name, last_name, email, phone, role, "position", bio, avatar, hourly_rate, is_active, created_by, created_at, updated_at, temp_password, password_set) FROM stdin;
10	3	8	Stefan	Kis	kis.stefan170499@gmail.com	0751698311	angajat	UI UX Designer	\N	\N	30	t	1	2025-04-07 13:12:31.626	2025-04-07 13:12:31.626	qwmOK@6eSt	f
\.


--
-- Data for Name: time_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.time_logs (id, user_id, organization_id, task_id, project_id, description, start_time, end_time, duration_minutes, is_billable, source, created_at, updated_at) FROM stdin;
1	1	3	1	2	Analiză cerințe și documentare	2025-04-02 18:33:16.273881	2025-04-02 19:33:16.273881	60	t	manual	2025-04-05 20:33:16.273881	2025-04-05 20:33:16.273881
2	1	3	2	2	Design mockup homepage	2025-04-03 15:33:16.273881	2025-04-03 18:33:16.273881	180	t	manual	2025-04-05 20:33:16.273881	2025-04-05 20:33:16.273881
3	1	3	4	3	Analiză și cercetare cuvinte cheie	2025-04-04 16:33:16.273881	2025-04-04 18:33:16.273881	120	t	manual	2025-04-05 20:33:16.273881	2025-04-05 20:33:16.273881
4	1	3	5	4	Documentare integrare Stripe	2025-04-05 14:33:16.273881	2025-04-05 16:33:16.273881	120	t	tracker	2025-04-05 20:33:16.273881	2025-04-05 20:33:16.273881
5	1	3	6	5	Design primele variante logo	2025-04-05 17:33:16.273881	2025-04-05 19:33:16.273881	120	t	tracker	2025-04-05 20:33:16.273881	2025-04-05 20:33:16.273881
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_preferences (id, user_id, theme, language, dashboard_layout, notification_settings, email_settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_profiles (id, user_id, full_name, avatar_url, phone, "position", skills, bio, preferred_language, hourly_rate, role, organization_id, department_id, stripe_customer_id, stripe_subscription_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, first_name, last_name, role, organization_id, created_at, updated_at) FROM stdin;
1	kis.stefan1704@yahoo.com	$2b$10$DaQzhgUT8NiEmXYIKZEl/ezEJR06loSgUJTT/BwdQCkh9jtUkF7uu	Stefan	Kis	ceo	3	2025-04-05 18:44:08.70118	2025-04-05 18:44:08.70118
8	kis.stefan170499@gmail.com	$2b$10$/J2dbiynJ2TNFUhploeTGu41ZIxma5aMQEXyXyUaxL/gALiW/lgru	Stefan	Kis	employee	3	2025-04-07 13:12:31.918648	2025-04-07 13:12:31.918648
\.


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 1, false);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 55, true);


--
-- Name: automation_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.automation_actions_id_seq', 1, false);


--
-- Name: automation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.automation_logs_id_seq', 1, false);


--
-- Name: automation_triggers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.automation_triggers_id_seq', 1, false);


--
-- Name: automations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.automations_id_seq', 1, false);


--
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 5, true);


--
-- Name: client_history_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_history_metrics_id_seq', 12, true);


--
-- Name: client_insights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_insights_id_seq', 1, false);


--
-- Name: client_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_notes_id_seq', 1, false);


--
-- Name: client_portal_activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_portal_activity_logs_id_seq', 1, false);


--
-- Name: client_portal_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_portal_feedbacks_id_seq', 1, false);


--
-- Name: client_portal_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_portal_notifications_id_seq', 1, false);


--
-- Name: client_portal_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_portal_sessions_id_seq', 1, false);


--
-- Name: client_portal_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_portal_users_id_seq', 1, false);


--
-- Name: client_portals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_portals_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clients_id_seq', 4, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: contract_milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contract_milestones_id_seq', 1, false);


--
-- Name: contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contracts_id_seq', 1, false);


--
-- Name: department_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.department_members_id_seq', 1, false);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- Name: email_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.email_attachments_id_seq', 1, false);


--
-- Name: email_recipients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.email_recipients_id_seq', 1, false);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 1, false);


--
-- Name: email_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.email_tracking_id_seq', 1, false);


--
-- Name: emails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.emails_id_seq', 1, false);


--
-- Name: employee_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.employee_evaluations_id_seq', 1, false);


--
-- Name: employee_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.employee_goals_id_seq', 1, false);


--
-- Name: employee_performance_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.employee_performance_metrics_id_seq', 4, true);


--
-- Name: evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.evaluations_id_seq', 1, false);


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.files_id_seq', 1, false);


--
-- Name: financial_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.financial_metrics_id_seq', 4, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 7, true);


--
-- Name: invoice_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoice_payments_id_seq', 1, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 8, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 5, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.organizations_id_seq', 3, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.projects_id_seq', 5, true);


--
-- Name: task_assignees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.task_assignees_id_seq', 1, false);


--
-- Name: task_checklists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.task_checklists_id_seq', 1, false);


--
-- Name: task_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.task_tags_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tasks_id_seq', 6, true);


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.team_members_id_seq', 10, true);


--
-- Name: time_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.time_logs_id_seq', 5, true);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 1, false);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_profiles_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_actions automation_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_actions
    ADD CONSTRAINT automation_actions_pkey PRIMARY KEY (id);


--
-- Name: automation_logs automation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_logs
    ADD CONSTRAINT automation_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_triggers automation_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_triggers
    ADD CONSTRAINT automation_triggers_pkey PRIMARY KEY (id);


--
-- Name: automations automations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: client_history_metrics client_history_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_history_metrics
    ADD CONSTRAINT client_history_metrics_pkey PRIMARY KEY (id);


--
-- Name: client_insights client_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_insights
    ADD CONSTRAINT client_insights_pkey PRIMARY KEY (id);


--
-- Name: client_notes client_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_notes
    ADD CONSTRAINT client_notes_pkey PRIMARY KEY (id);


--
-- Name: client_portal_activity_logs client_portal_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_activity_logs
    ADD CONSTRAINT client_portal_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: client_portal_feedbacks client_portal_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_feedbacks
    ADD CONSTRAINT client_portal_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: client_portal_notifications client_portal_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_notifications
    ADD CONSTRAINT client_portal_notifications_pkey PRIMARY KEY (id);


--
-- Name: client_portal_sessions client_portal_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_sessions
    ADD CONSTRAINT client_portal_sessions_pkey PRIMARY KEY (id);


--
-- Name: client_portal_users client_portal_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portal_users
    ADD CONSTRAINT client_portal_users_pkey PRIMARY KEY (id);


--
-- Name: client_portals client_portals_access_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portals
    ADD CONSTRAINT client_portals_access_key_unique UNIQUE (access_key);


--
-- Name: client_portals client_portals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_portals
    ADD CONSTRAINT client_portals_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contract_milestones contract_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contract_milestones
    ADD CONSTRAINT contract_milestones_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: department_members department_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT department_members_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: email_attachments email_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_attachments
    ADD CONSTRAINT email_attachments_pkey PRIMARY KEY (id);


--
-- Name: email_recipients email_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_recipients
    ADD CONSTRAINT email_recipients_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_tracking email_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_pkey PRIMARY KEY (id);


--
-- Name: emails emails_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emails
    ADD CONSTRAINT emails_pkey PRIMARY KEY (id);


--
-- Name: employee_evaluations employee_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_evaluations
    ADD CONSTRAINT employee_evaluations_pkey PRIMARY KEY (id);


--
-- Name: employee_goals employee_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_goals
    ADD CONSTRAINT employee_goals_pkey PRIMARY KEY (id);


--
-- Name: employee_performance_metrics employee_performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_performance_metrics
    ADD CONSTRAINT employee_performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: financial_metrics financial_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_metrics
    ADD CONSTRAINT financial_metrics_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_payments invoice_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_organization_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_organization_id_unique UNIQUE (invoice_number, organization_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: task_assignees task_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY (id);


--
-- Name: task_checklists task_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_checklists
    ADD CONSTRAINT task_checklists_pkey PRIMARY KEY (id);


--
-- Name: task_tags task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: time_logs time_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_logs
    ADD CONSTRAINT time_logs_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: department_members fk_department_members_department; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT fk_department_members_department FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: department_members fk_department_members_team_member; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department_members
    ADD CONSTRAINT fk_department_members_team_member FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;


--
-- Name: invoice_payments invoice_payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invoice_payments invoice_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

