import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1708200000000 implements MigrationInterface {
  name = 'InitialSchema1708200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Guard: skip if schema was already created by previous individual migrations
    const [row] = await queryRunner.query(
      `SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'service' AND table_name = 'users'`,
    );
    if (row.count > 0) {
      return;
    }

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "service"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Enum types ─────────────────────────────────────────────────────────────

    await queryRunner.query(`CREATE TYPE "service"."user_role" AS ENUM ('seeker', 'provider', 'admin')`);
    await queryRunner.query(`CREATE TYPE "service"."job_type" AS ENUM ('bidding', 'direct')`);
    await queryRunner.query(`CREATE TYPE "service"."job_status" AS ENUM ('posted', 'bidding', 'selected', 'pending', 'rejected', 'in_progress', 'completed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "service"."bid_status" AS ENUM ('submitted', 'declined', 'accepted', 'selected')`);
    await queryRunner.query(`CREATE TYPE "service"."engagement_type" AS ENUM ('single', 'short', 'long')`);
    await queryRunner.query(`CREATE TYPE "service"."billing_type" AS ENUM ('monthly', 'upfront')`);
    await queryRunner.query(`CREATE TYPE "service"."service_frequency" AS ENUM ('daily', 'custom')`);
    await queryRunner.query(`CREATE TYPE "service"."service_duration" AS ENUM ('single_task', '1_month', '3_months', '6_months')`);
    await queryRunner.query(`CREATE TYPE "service"."billing_period" AS ENUM ('weekly', 'fortnightly', 'monthly')`);
    await queryRunner.query(`CREATE TYPE "service"."message_sender_type" AS ENUM ('seeker', 'provider', 'system')`);
    await queryRunner.query(`CREATE TYPE "service"."report_type" AS ENUM ('abuse', 'fraud', 'spam', 'harassment', 'suspicious_activity', 'other')`);
    await queryRunner.query(`CREATE TYPE "service"."report_target_type" AS ENUM ('user', 'job', 'bid', 'conversation', 'message', 'payment')`);
    await queryRunner.query(`CREATE TYPE "service"."report_status" AS ENUM ('pending', 'warning_sent', 'resolved', 'dismissed')`);
    await queryRunner.query(`CREATE TYPE "service"."certification_status" AS ENUM ('pending', 'accepted', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "service"."payment_status" AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'disputed', 'canceled')`);
    await queryRunner.query(`CREATE TYPE "service"."subscription_status" AS ENUM ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')`);
    await queryRunner.query(`CREATE TYPE "service"."connect_flow" AS ENUM ('destination', 'sct')`);
    await queryRunner.query(`CREATE TYPE "service"."transaction_type" AS ENUM ('payment', 'refund')`);
    await queryRunner.query(`CREATE TYPE "service"."refund_request_reason" AS ENUM ('poor_service_quality', 'service_not_completed', 'provider_no_show', 'wrong_service_provided', 'safety_concern', 'other')`);
    await queryRunner.query(`CREATE TYPE "service"."refund_request_status" AS ENUM ('pending', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "service"."refund_evidence_side" AS ENUM ('seeker', 'admin')`);
    await queryRunner.query(`CREATE TYPE "service"."subscription_cancellation_reason" AS ENUM ('service_quality_not_met', 'tasks_not_completed_properly', 'communication_issues_with_provider', 'provider_unprofessional_behavior', 'moving_to_new_location', 'other')`);
    await queryRunner.query(`CREATE TYPE "service"."subscription_cancellation_status" AS ENUM ('pending', 'processed', 'withdrawn')`);
    await queryRunner.query(`CREATE TYPE "service"."storage_provider" AS ENUM ('azure_blob', 's3', 'other')`);
    await queryRunner.query(`CREATE TYPE "service"."notification_type" AS ENUM ('warning', 'bid_received', 'bid_accepted', 'bid_declined', 'job_started', 'job_completed', 'job_cancelled', 'new_message', 'warning_received', 'support_reply')`);
    await queryRunner.query(`CREATE TYPE "service"."support_sender_type" AS ENUM ('admin', 'user')`);
    await queryRunner.query(`CREATE TYPE "service"."warning_sender_type" AS ENUM ('admin', 'user')`);
    await queryRunner.query(`CREATE TYPE "service"."contract_payment_frequency" AS ENUM ('weekly', 'bi_weekly', 'fortnightly', 'monthly')`);

    // ── users ──────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."users" (
        "id"             uuid                  PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"     timestamptz           NOT NULL DEFAULT now(),
        "updated_at"     timestamptz           NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz,
        "email"          varchar(320)          NOT NULL,
        "role"           "service"."user_role" NOT NULL DEFAULT 'seeker',
        "email_verified" boolean               NOT NULL DEFAULT false,
        "is_active"      boolean               NOT NULL DEFAULT true,
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "service"."users" ("email")`);

    // ── profiles ───────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."profiles" (
        "id"             uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        "updated_at"     timestamptz NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz,
        "user_id"        uuid        NOT NULL UNIQUE REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "first_name"     varchar(100),
        "last_name"      varchar(100),
        "phone"          varchar(50),
        "avatar_url"     text,
        "date_of_birth"  date,
        "street_address" varchar(200),
        "city"           varchar(100),
        "state"          varchar(50),
        "postcode"       varchar(10),
        "country"        varchar(2)
      )
    `);

    // ── categories ─────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."categories" (
        "id"                     uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"             timestamptz  NOT NULL DEFAULT now(),
        "updated_at"             timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"             timestamptz,
        "name"                   varchar(120) NOT NULL,
        "marketing_service_list" text,
        CONSTRAINT "UQ_categories_name" UNIQUE ("name")
      )
    `);

    // ── skills ─────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."skills" (
        "id"         uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "name"       varchar(120) NOT NULL,
        CONSTRAINT "UQ_skills_name" UNIQUE ("name")
      )
    `);

    // ── provider_profiles ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_profiles" (
        "profile_id" uuid PRIMARY KEY REFERENCES "service"."profiles"("id") ON DELETE CASCADE
      )
    `);

    // ── provider_professional_details ─────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_professional_details" (
        "id"                         uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"                 timestamptz   NOT NULL DEFAULT now(),
        "updated_at"                 timestamptz   NOT NULL DEFAULT now(),
        "deleted_at"                 timestamptz,
        "profile_id"                 uuid          NOT NULL UNIQUE REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE,
        "rate_per_hour_weekday"      numeric(10,2) NOT NULL DEFAULT 0,
        "rate_per_hour_weekend"      numeric(10,2) NOT NULL DEFAULT 0,
        "rate_per_hour_holiday"      numeric(10,2) NOT NULL DEFAULT 0,
        "subscription_rate_1_month"  numeric(10,2) NOT NULL DEFAULT 0,
        "subscription_rate_3_months" numeric(10,2) NOT NULL DEFAULT 0,
        "subscription_rate_6_months" numeric(10,2) NOT NULL DEFAULT 0,
        "education"                  text,
        "years_of_experience"        int,
        "bio"                        text
      )
    `);

    // ── provider_work_info ────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_work_info" (
        "id"            uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz,
        "profile_id"    uuid         NOT NULL UNIQUE REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE,
        "business_name" varchar(200) NOT NULL,
        "abn"           varchar(20)  NOT NULL,
        "acn"           varchar(20)
      )
    `);

    // ── provider_bank_details ─────────────────────────────────────────────────
    // Column lengths are 512 to accommodate AES-256-GCM encrypted values.
    // bsb_number = Australian BSB format (6-digit routing equivalent).

    await queryRunner.query(`
      CREATE TABLE "service"."provider_bank_details" (
        "id"                  uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"          timestamptz  NOT NULL DEFAULT now(),
        "updated_at"          timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "profile_id"          uuid         NOT NULL UNIQUE REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE,
        "bank_name"           varchar(512) NOT NULL,
        "account_number"      varchar(512) NOT NULL,
        "bsb_number"          varchar(512),
        "account_holder_name" varchar(512) NOT NULL
      )
    `);

    // ── provider_certifications ───────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_certifications" (
        "id"             uuid                             PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"     timestamptz                      NOT NULL DEFAULT now(),
        "updated_at"     timestamptz                      NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz,
        "profile_id"     uuid                             NOT NULL REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE,
        "name"           varchar(200)                     NOT NULL,
        "license_number" varchar(100),
        "license_type"   varchar(100),
        "state"          varchar(50),
        "postcode"       varchar(10),
        "status"         "service"."certification_status" NOT NULL DEFAULT 'pending',
        "is_verified"    boolean                          NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_provider_certifications_profile_id" ON "service"."provider_certifications" ("profile_id")`);

    // ── provider_employees ────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_employees" (
        "id"          uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        "updated_at"  timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"  timestamptz,
        "profile_id"  uuid         NOT NULL REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE,
        "name"        varchar(150) NOT NULL,
        "designation" varchar(150) NOT NULL,
        "avatar_url"  text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_provider_employees_profile_id" ON "service"."provider_employees" ("profile_id")`);

    // ── provider_media ────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_media" (
        "id"         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "profile_id" uuid        NOT NULL REFERENCES "service"."provider_professional_details"("profile_id") ON DELETE CASCADE,
        "url"        text        NOT NULL,
        "sort_order" int         NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_provider_media_profile_id" ON "service"."provider_media" ("profile_id")`);

    // ── provider_categories ───────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_categories" (
        "id"          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        "deleted_at"  timestamptz,
        "profile_id"  uuid        NOT NULL REFERENCES "service"."provider_professional_details"("profile_id") ON DELETE CASCADE,
        "category_id" uuid        NOT NULL REFERENCES "service"."categories"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_provider_categories_profile_category" UNIQUE ("profile_id", "category_id")
      )
    `);

    // ── provider_skills ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_skills" (
        "id"         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "profile_id" uuid        NOT NULL REFERENCES "service"."provider_professional_details"("profile_id") ON DELETE CASCADE,
        "skill_id"   uuid        NOT NULL REFERENCES "service"."skills"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_provider_skills_profile_skill" UNIQUE ("profile_id", "skill_id")
      )
    `);

    // ── provider_verification_cases ───────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_verification_cases" (
        "profile_id" uuid        PRIMARY KEY REFERENCES "service"."provider_profiles"("profile_id") ON DELETE CASCADE,
        "status"     varchar(20) NOT NULL DEFAULT 'pending'
      )
    `);

    // ── provider_verification_steps ───────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_verification_steps" (
        "id"                       uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"               timestamptz NOT NULL DEFAULT now(),
        "updated_at"               timestamptz NOT NULL DEFAULT now(),
        "deleted_at"               timestamptz,
        "case_id"                  uuid        NOT NULL REFERENCES "service"."provider_verification_cases"("profile_id") ON DELETE CASCADE,
        "step_type"                varchar(32) NOT NULL,
        "abn"                      varchar(20),
        "identity_type"            varchar(20),
        "selfie_vendor_session_id" varchar(120),
        "right_to_work_status"     varchar(20),
        "police_ref_no"            varchar(64),
        "status"                   varchar(20) NOT NULL DEFAULT 'pending',
        "reviewed_at"              timestamptz,
        "rejection_reason"         varchar(40),
        "rejection_note"           text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_provider_verification_steps_case_id" ON "service"."provider_verification_steps" ("case_id")`);

    // ── provider_verification_step_files ──────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."provider_verification_step_files" (
        "id"         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "step_id"    uuid        NOT NULL REFERENCES "service"."provider_verification_steps"("id") ON DELETE CASCADE,
        "file_url"   text        NOT NULL,
        "storage"    varchar(20) NOT NULL DEFAULT 'AZURE_BLOB'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_provider_verification_step_files_step_id" ON "service"."provider_verification_step_files" ("step_id")`);

    // ── jobs (selected_bid_id added after bids due to circular FK) ────────────

    await queryRunner.query(`
      CREATE TABLE "service"."jobs" (
        "id"                   uuid                           PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"           timestamptz                    NOT NULL DEFAULT now(),
        "updated_at"           timestamptz                    NOT NULL DEFAULT now(),
        "deleted_at"           timestamptz,
        "job_ref"              varchar(12)                    UNIQUE,
        "seeker_user_id"       uuid                           NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "title"                varchar(200),
        "description"          text,
        "category_id"          uuid                           REFERENCES "service"."categories"("id") ON DELETE SET NULL,
        "location_text"        varchar(200),
        "budget_price"         int,
        "currency"             char(3)                        NOT NULL DEFAULT 'AUD',
        "type"                 "service"."job_type"           NOT NULL DEFAULT 'bidding',
        "status"               "service"."job_status"         NOT NULL DEFAULT 'posted',
        "service_duration"     "service"."service_duration",
        "is_flexible_time"     boolean,
        "engagement"           "service"."engagement_type"    NOT NULL DEFAULT 'single',
        "duration_months"      int,
        "billing_pref"         "service"."billing_type",
        "provider_user_id"     uuid                           REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "selected_provider_id" uuid                           REFERENCES "service"."users"("id") ON DELETE SET NULL,
        "selected_bid_id"      uuid,
        "selected_at"          timestamptz,
        "start_date"           date,
        "end_date"             date,
        "start_time"           varchar(10),
        "end_time"             varchar(10),
        "frequency"            "service"."service_frequency",
        "scheduled_days"       text,
        "total_hours"          numeric(6,2),
        "total_hours_period"   "service"."billing_period",
        "budget_period"        "service"."billing_period"
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_job_ref" ON "service"."jobs" ("job_ref")`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_type"    ON "service"."jobs" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_status"  ON "service"."jobs" ("status")`);

    // ── job_photos ────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."job_photos" (
        "id"         uuid                         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz                  NOT NULL DEFAULT now(),
        "updated_at" timestamptz                  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "job_id"     uuid                         NOT NULL REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "file_url"   text                         NOT NULL,
        "storage"    "service"."storage_provider" NOT NULL DEFAULT 'azure_blob',
        "sort_order" int                          NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_job_photos_job_id" ON "service"."job_photos" ("job_id")`);

    // ── bids ──────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."bids" (
        "id"               uuid                   PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"       timestamptz            NOT NULL DEFAULT now(),
        "updated_at"       timestamptz            NOT NULL DEFAULT now(),
        "deleted_at"       timestamptz,
        "job_id"           uuid                   NOT NULL REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "provider_user_id" uuid                   NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "price"            numeric(10,2)          NOT NULL,
        "currency"         char(3)                NOT NULL DEFAULT 'AUD',
        "status"           "service"."bid_status" NOT NULL DEFAULT 'submitted'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_bids_job_id"           ON "service"."bids" ("job_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_bids_provider_user_id" ON "service"."bids" ("provider_user_id")`);

    // ── jobs: resolve circular FK now that bids exists ────────────────────────

    await queryRunner.query(`ALTER TABLE "service"."jobs" ADD CONSTRAINT "FK_jobs_selected_bid_id" FOREIGN KEY ("selected_bid_id") REFERENCES "service"."bids"("id") ON DELETE SET NULL`);

    // ── selections ────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."selections" (
        "id"                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"          timestamptz NOT NULL DEFAULT now(),
        "updated_at"          timestamptz NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "job_id"              uuid        NOT NULL UNIQUE REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "bid_id"              uuid        NOT NULL REFERENCES "service"."bids"("id") ON DELETE RESTRICT,
        "provider_user_id"    uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "selected_by_user_id" uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT
      )
    `);

    // ── conversations ─────────────────────────────────────────────────────────
    // Decoupled from jobs: unique seeker–provider pair, no job_id FK.

    await queryRunner.query(`
      CREATE TABLE "service"."conversations" (
        "id"         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "seeker_id"  uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "provider_id" uuid       NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_conversations_seeker_provider" UNIQUE ("seeker_id", "provider_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_seeker_id"   ON "service"."conversations" ("seeker_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_provider_id" ON "service"."conversations" ("provider_id")`);

    // ── messages ──────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."messages" (
        "id"              uuid                            PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"      timestamptz                     NOT NULL DEFAULT now(),
        "updated_at"      timestamptz                     NOT NULL DEFAULT now(),
        "deleted_at"      timestamptz,
        "conversation_id" uuid                            NOT NULL REFERENCES "service"."conversations"("id") ON DELETE CASCADE,
        "sender_user_id"  uuid                            NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "sender_type"     "service"."message_sender_type" NOT NULL,
        "body"            text                            NOT NULL,
        "attachments"     jsonb                           DEFAULT '[]'::jsonb
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_messages_conversation_id"         ON "service"."messages" ("conversation_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_conversation_created_at" ON "service"."messages" ("conversation_id", "created_at")`);

    // ── direct_messages ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."direct_messages" (
        "id"              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        "deleted_at"      timestamptz,
        "conversation_id" uuid        NOT NULL REFERENCES "service"."conversations"("id") ON DELETE CASCADE,
        "sender_id"       uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "body"            text        NOT NULL,
        "job_id"          uuid        REFERENCES "service"."jobs"("id") ON DELETE SET NULL,
        "is_read"         boolean     NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_direct_messages_conversation_created_at" ON "service"."direct_messages" ("conversation_id", "created_at")`);

    // ── reviews ───────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."reviews" (
        "id"                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"          timestamptz NOT NULL DEFAULT now(),
        "updated_at"          timestamptz NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "job_id"              uuid        NOT NULL UNIQUE REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "seeker_id"           uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "provider_id"         uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "rating"              smallint    NOT NULL,
        "delivered_on_budget" boolean,
        "delivered_on_time"   boolean,
        "comment"             text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_job_id"      ON "service"."reviews" ("job_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_seeker_id"   ON "service"."reviews" ("seeker_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_provider_id" ON "service"."reviews" ("provider_id")`);

    // ── seeker_favourite_providers ────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."seeker_favourite_providers" (
        "id"                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"          timestamptz NOT NULL DEFAULT now(),
        "updated_at"          timestamptz NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "seeker_user_id"      uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "provider_profile_id" uuid        NOT NULL REFERENCES "service"."profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_seeker_fav_seeker_provider" UNIQUE ("seeker_user_id", "provider_profile_id")
      )
    `);

    // ── user_notification_settings ────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."user_notification_settings" (
        "id"                     uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"             timestamptz NOT NULL DEFAULT now(),
        "updated_at"             timestamptz NOT NULL DEFAULT now(),
        "deleted_at"             timestamptz,
        "user_id"                uuid        NOT NULL UNIQUE REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "email_enabled"          boolean     NOT NULL DEFAULT true,
        "push_enabled"           boolean     NOT NULL DEFAULT true,
        "message_alerts_enabled" boolean     NOT NULL DEFAULT true
      )
    `);

    // ── audit_logs ────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."audit_logs" (
        "id"            uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz,
        "actor_user_id" uuid         REFERENCES "service"."users"("id") ON DELETE SET NULL,
        "action"        varchar(120) NOT NULL,
        "entity_type"   varchar(60)  NOT NULL,
        "entity_id"     uuid         NOT NULL,
        "metadata"      jsonb,
        "ip"            inet,
        "user_agent"    text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created_at"    ON "service"."audit_logs" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor_user_id" ON "service"."audit_logs" ("actor_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity_type"   ON "service"."audit_logs" ("entity_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity_id"     ON "service"."audit_logs" ("entity_id")`);

    // ── platform_fee_configs ──────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."platform_fee_configs" (
        "id"                      uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"              timestamptz  NOT NULL DEFAULT now(),
        "updated_at"              timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"              timestamptz,
        "platform_fee_percent"    numeric(5,2) NOT NULL,
        "gst_percent"             numeric(5,2) NOT NULL DEFAULT 10,
        "cancellation_fee"        int          NOT NULL DEFAULT 1000,
        "late_cancellation_hours" int          NOT NULL DEFAULT 48,
        "currency"                char(3)      NOT NULL DEFAULT 'AUD',
        "effective_from"          timestamptz  NOT NULL,
        "effective_to"            timestamptz,
        "created_by_user_id"      uuid         REFERENCES "service"."users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_platform_fee_configs_effective_from" ON "service"."platform_fee_configs" ("effective_from")`);

    // ── stripe_customers ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."stripe_customers" (
        "id"             uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"     timestamptz  NOT NULL DEFAULT now(),
        "updated_at"     timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz,
        "seeker_user_id" uuid         NOT NULL UNIQUE REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "customer_id"    varchar(255) NOT NULL UNIQUE
      )
    `);

    // ── stripe_accounts ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."stripe_accounts" (
        "id"                      uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"              timestamptz  NOT NULL DEFAULT now(),
        "updated_at"              timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"              timestamptz,
        "provider_user_id"        uuid         NOT NULL UNIQUE REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "account_id"              varchar(255) NOT NULL UNIQUE,
        "details_submitted"       boolean      NOT NULL DEFAULT false,
        "charges_enabled"         boolean      NOT NULL DEFAULT false,
        "payouts_enabled"         boolean      NOT NULL DEFAULT false,
        "onboarding_completed_at" timestamptz
      )
    `);

    // ── saved_payment_methods ─────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."saved_payment_methods" (
        "id"                       uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"               timestamptz  NOT NULL DEFAULT now(),
        "updated_at"               timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"               timestamptz,
        "seeker_user_id"           uuid         NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "stripe_payment_method_id" varchar(255) NOT NULL UNIQUE,
        "brand"                    varchar(20),
        "last4"                    char(4),
        "exp_month"                smallint,
        "exp_year"                 smallint,
        "is_default"               boolean      NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_saved_payment_methods_seeker_user_id" ON "service"."saved_payment_methods" ("seeker_user_id")`);

    // ── subscriptions ─────────────────────────────────────────────────────────
    // stripe_subscription_id is nullable: rows are created INCOMPLETE before
    // Stripe checkout returns; the ID is filled in once confirmed.

    await queryRunner.query(`
      CREATE TABLE "service"."subscriptions" (
        "id"                      uuid                            PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"              timestamptz                     NOT NULL DEFAULT now(),
        "updated_at"              timestamptz                     NOT NULL DEFAULT now(),
        "deleted_at"              timestamptz,
        "job_id"                  uuid                            NOT NULL UNIQUE REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "seeker_user_id"          uuid                            NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "provider_user_id"        uuid                            NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "stripe_subscription_id"  varchar(255),
        "stripe_price_id"         varchar(255),
        "stripe_product_id"       varchar(255),
        "engagement"              "service"."engagement_type"     NOT NULL,
        "billing"                 "service"."billing_type"        NOT NULL,
        "duration_months"         int,
        "connect_charge_type"     "service"."connect_flow"        NOT NULL DEFAULT 'destination',
        "connected_account_id"    varchar(255),
        "status"                  "service"."subscription_status" NOT NULL DEFAULT 'incomplete',
        "start_date"              date,
        "end_date"                date,
        "application_fee_percent" numeric(6,3),
        "application_fee"         int,
        "gst_inclusive"           boolean                         NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_subscriptions_stripe_subscription_id"
        ON "service"."subscriptions" ("stripe_subscription_id")
        WHERE "stripe_subscription_id" IS NOT NULL
    `);

    // ── payments ──────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."payments" (
        "id"                       uuid                       PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"               timestamptz                NOT NULL DEFAULT now(),
        "updated_at"               timestamptz                NOT NULL DEFAULT now(),
        "deleted_at"               timestamptz,
        "job_id"                   uuid                       REFERENCES "service"."jobs"("id") ON DELETE SET NULL,
        "subscription_id"          uuid                       REFERENCES "service"."subscriptions"("id") ON DELETE SET NULL,
        "seeker_user_id"           uuid                       NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "provider_user_id"         uuid                       NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "fee_config_id"            uuid                       REFERENCES "service"."platform_fee_configs"("id") ON DELETE RESTRICT,
        "stripe_invoice_id"        varchar(255)               UNIQUE,
        "stripe_payment_intent_id" varchar(255)               UNIQUE,
        "stripe_charge_id"         varchar(255),
        "stripe_transfer_id"       varchar(255),
        "stripe_balance_txn_id"    varchar(255),
        "amount"                   int                        NOT NULL,
        "tax_gst_amount"           int                        NOT NULL DEFAULT 0,
        "platform_fee"             int                        NOT NULL DEFAULT 0,
        "provider_amount"          int                        NOT NULL DEFAULT 0,
        "currency"                 char(3)                    NOT NULL DEFAULT 'AUD',
        "status"                   "service"."payment_status" NOT NULL DEFAULT 'pending',
        "method"                   varchar(50),
        "invoice_url"              text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_job_id"           ON "service"."payments" ("job_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_subscription_id"  ON "service"."payments" ("subscription_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_seeker_user_id"   ON "service"."payments" ("seeker_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_provider_user_id" ON "service"."payments" ("provider_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_stripe_charge_id" ON "service"."payments" ("stripe_charge_id")`);

    // ── user_reports ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."user_reports" (
        "id"                 uuid                           PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"         timestamptz                    NOT NULL DEFAULT now(),
        "updated_at"         timestamptz                    NOT NULL DEFAULT now(),
        "deleted_at"         timestamptz,
        "reporter_user_id"   uuid                           NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "target_type"        "service"."report_target_type" NOT NULL,
        "target_id"          uuid                           NOT NULL,
        "report_ref"         varchar(12)                    NOT NULL UNIQUE,
        "report_kind"        "service"."report_type"        NOT NULL,
        "description"        text                           NOT NULL,
        "job_id"             uuid                           REFERENCES "service"."jobs"("id") ON DELETE SET NULL,
        "bid_id"             uuid                           REFERENCES "service"."bids"("id") ON DELETE SET NULL,
        "conversation_id"    uuid                           REFERENCES "service"."conversations"("id") ON DELETE SET NULL,
        "message_id"         uuid                           REFERENCES "service"."messages"("id") ON DELETE SET NULL,
        "payment_id"         uuid                           REFERENCES "service"."payments"("id") ON DELETE SET NULL,
        "subject_user_id"    uuid                           REFERENCES "service"."users"("id") ON DELETE SET NULL,
        "status"             "service"."report_status"      NOT NULL DEFAULT 'pending',
        "resolved_at"        timestamptz,
        "dismissed_reason"   text,
        "warning_message"    text,
        "warned_at"          timestamptz,
        "suspension_deadline" timestamptz
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_reports_reporter_user_id"      ON "service"."user_reports" ("reporter_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_reports_target_type_target_id" ON "service"."user_reports" ("target_type", "target_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_reports_status"                ON "service"."user_reports" ("status")`);

    // ── user_warnings ─────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."user_warnings" (
        "id"                  uuid                          PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"          timestamptz                   NOT NULL DEFAULT now(),
        "updated_at"          timestamptz                   NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "recipient_user_id"   uuid                          NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "report_id"           uuid                          NOT NULL REFERENCES "service"."user_reports"("id") ON DELETE CASCADE,
        "type"                "service"."notification_type" NOT NULL DEFAULT 'warning',
        "message"             text                          NOT NULL,
        "suspension_deadline" timestamptz                   NOT NULL,
        "is_read"             boolean                       NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_warnings_recipient_user_id" ON "service"."user_warnings" ("recipient_user_id")`);

    // ── warning_threads ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."warning_threads" (
        "id"                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"        timestamptz NOT NULL DEFAULT now(),
        "updated_at"        timestamptz NOT NULL DEFAULT now(),
        "deleted_at"        timestamptz,
        "warning_id"        uuid        NOT NULL UNIQUE REFERENCES "service"."user_warnings"("id") ON DELETE CASCADE,
        "recipient_user_id" uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "is_closed"         boolean     NOT NULL DEFAULT false,
        "closed_at"         timestamptz
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_warning_threads_recipient_user_id" ON "service"."warning_threads" ("recipient_user_id")`);

    // ── warning_messages ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."warning_messages" (
        "id"          uuid                            PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"  timestamptz                     NOT NULL DEFAULT now(),
        "updated_at"  timestamptz                     NOT NULL DEFAULT now(),
        "deleted_at"  timestamptz,
        "thread_id"   uuid                            NOT NULL REFERENCES "service"."warning_threads"("id") ON DELETE CASCADE,
        "sender_id"   uuid                            NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "sender_type" "service"."warning_sender_type" NOT NULL,
        "body"        text                            NOT NULL,
        "attachments" jsonb                           DEFAULT '[]'::jsonb
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_warning_messages_thread_created_at" ON "service"."warning_messages" ("thread_id", "created_at")`);

    // ── support_tickets ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."support_tickets" (
        "id"             uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        "updated_at"     timestamptz NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz,
        "subject"        text        NOT NULL,
        "sender_user_id" uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_support_tickets_sender_user_id" ON "service"."support_tickets" ("sender_user_id")`);

    // ── support_messages ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."support_messages" (
        "id"          uuid                            PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"  timestamptz                     NOT NULL DEFAULT now(),
        "updated_at"  timestamptz                     NOT NULL DEFAULT now(),
        "deleted_at"  timestamptz,
        "ticket_id"   uuid                            NOT NULL REFERENCES "service"."support_tickets"("id") ON DELETE CASCADE,
        "sender_id"   uuid                            NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "sender_type" "service"."support_sender_type" NOT NULL,
        "body"        text                            NOT NULL,
        "attachments" jsonb                           DEFAULT '[]'::jsonb
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_support_messages_ticket_created_at" ON "service"."support_messages" ("ticket_id", "created_at")`);

    // ── job_contracts ─────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."job_contracts" (
        "id"                     uuid                                   PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"             timestamptz                            NOT NULL DEFAULT now(),
        "updated_at"             timestamptz                            NOT NULL DEFAULT now(),
        "deleted_at"             timestamptz,
        "job_id"                 uuid                                   NOT NULL UNIQUE REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "deposit_required"       boolean                                NOT NULL DEFAULT false,
        "deposit_amount"         numeric(10, 2),
        "payment_frequency"      "service"."contract_payment_frequency" NOT NULL,
        "early_termination"      boolean                                NOT NULL DEFAULT false,
        "confidentiality_clause" boolean                                NOT NULL DEFAULT true,
        "additional_clause"      text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_job_contracts_job_id" ON "service"."job_contracts" ("job_id")`);

    // ── refunds ───────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."refunds" (
        "id"                       uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"               timestamptz  NOT NULL DEFAULT now(),
        "updated_at"               timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"               timestamptz,
        "payment_id"               uuid         NOT NULL REFERENCES "service"."payments"("id") ON DELETE CASCADE,
        "stripe_refund_id"         varchar(255) NOT NULL UNIQUE,
        "stripe_charge_id"         varchar(255),
        "amount"                   int          NOT NULL,
        "reason"                   varchar(50),
        "application_fee_refunded" int          NOT NULL DEFAULT 0,
        "transfer_reversed_fee"    int          NOT NULL DEFAULT 0,
        "status"                   varchar(30)  NOT NULL DEFAULT 'succeeded'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refunds_payment_id" ON "service"."refunds" ("payment_id")`);

    // ── refund_requests ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."refund_requests" (
        "id"                  uuid                              PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"          timestamptz                       NOT NULL DEFAULT now(),
        "updated_at"          timestamptz                       NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "job_id"              uuid                              NOT NULL REFERENCES "service"."jobs"("id") ON DELETE RESTRICT,
        "payment_id"          uuid                              NOT NULL REFERENCES "service"."payments"("id") ON DELETE RESTRICT,
        "seeker_user_id"      uuid                              NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "reviewed_by_user_id" uuid                              REFERENCES "service"."users"("id") ON DELETE SET NULL,
        "reason"              "service"."refund_request_reason" NOT NULL,
        "comments"            text,
        "requested_amount"    int                               NOT NULL,
        "currency"            char(3)                           NOT NULL DEFAULT 'AUD',
        "status"              "service"."refund_request_status" NOT NULL DEFAULT 'pending',
        "reviewed_at"         timestamptz,
        "rejection_reason"    text,
        "stripe_refund_id"    varchar(255)                      UNIQUE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refund_requests_job_id"         ON "service"."refund_requests" ("job_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_refund_requests_payment_id"     ON "service"."refund_requests" ("payment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_refund_requests_seeker_user_id" ON "service"."refund_requests" ("seeker_user_id")`);

    // ── refund_evidence_photos ────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."refund_evidence_photos" (
        "id"                uuid                             PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"        timestamptz                      NOT NULL DEFAULT now(),
        "updated_at"        timestamptz                      NOT NULL DEFAULT now(),
        "deleted_at"        timestamptz,
        "refund_request_id" uuid                             NOT NULL REFERENCES "service"."refund_requests"("id") ON DELETE CASCADE,
        "file_url"          text                             NOT NULL,
        "storage"           "service"."storage_provider"     NOT NULL DEFAULT 'azure_blob',
        "side"              "service"."refund_evidence_side" NOT NULL,
        "sort_order"        int                              NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refund_evidence_photos_refund_request_id" ON "service"."refund_evidence_photos" ("refund_request_id")`);

    // ── subscription_periods ──────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."subscription_periods" (
        "id"                       uuid                       PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"               timestamptz                NOT NULL DEFAULT now(),
        "updated_at"               timestamptz                NOT NULL DEFAULT now(),
        "deleted_at"               timestamptz,
        "subscription_id"          uuid                       NOT NULL REFERENCES "service"."subscriptions"("id") ON DELETE CASCADE,
        "period_start"             timestamptz                NOT NULL,
        "period_end"               timestamptz                NOT NULL,
        "stripe_invoice_id"        varchar(255)               UNIQUE,
        "stripe_payment_intent_id" varchar(255),
        "stripe_charge_id"         varchar(255),
        "stripe_transfer_id"       varchar(255),
        "amount_total"             int                        NOT NULL,
        "tax_gst_amount"           int                        NOT NULL DEFAULT 0,
        "platform_fee"             int                        NOT NULL DEFAULT 0,
        "provider_amount"          int                        NOT NULL DEFAULT 0,
        "currency"                 char(3)                    NOT NULL DEFAULT 'AUD',
        "payment_status"           "service"."payment_status" NOT NULL DEFAULT 'pending'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_subscription_periods_subscription_id" ON "service"."subscription_periods" ("subscription_id")`);

    // ── subscription_cancellation_requests ────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."subscription_cancellation_requests" (
        "id"              uuid                                         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"      timestamptz                                  NOT NULL DEFAULT now(),
        "updated_at"      timestamptz                                  NOT NULL DEFAULT now(),
        "deleted_at"      timestamptz,
        "subscription_id" uuid                                         NOT NULL REFERENCES "service"."subscriptions"("id") ON DELETE CASCADE,
        "seeker_user_id"  uuid                                         NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "reason"          "service"."subscription_cancellation_reason" NOT NULL,
        "custom_reason"   text,
        "status"          "service"."subscription_cancellation_status" NOT NULL DEFAULT 'pending',
        "requested_at"    timestamptz                                  NOT NULL,
        "effective_at"    timestamptz                                  NOT NULL,
        "processed_at"    timestamptz
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sub_cancel_requests_subscription_id" ON "service"."subscription_cancellation_requests" ("subscription_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sub_cancel_requests_seeker_user_id"  ON "service"."subscription_cancellation_requests" ("seeker_user_id")`);

    // ── job_cancellations ─────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."job_cancellations" (
        "id"                   uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"           timestamptz  NOT NULL DEFAULT now(),
        "updated_at"           timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"           timestamptz,
        "job_id"               uuid         NOT NULL UNIQUE REFERENCES "service"."jobs"("id") ON DELETE CASCADE,
        "seeker_user_id"       uuid         NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "payment_id"           uuid         REFERENCES "service"."payments"("id") ON DELETE RESTRICT,
        "fee_config_id"        uuid         REFERENCES "service"."platform_fee_configs"("id") ON DELETE RESTRICT,
        "cancelled_at"         timestamptz  NOT NULL,
        "scheduled_service_at" timestamptz,
        "within_48_hours"      boolean      NOT NULL DEFAULT false,
        "total_paid"           int          NOT NULL,
        "admin_fee"            int          NOT NULL DEFAULT 0,
        "refund_amount"        int          NOT NULL,
        "currency"             char(3)      NOT NULL DEFAULT 'AUD',
        "stripe_refund_id"     varchar(255) UNIQUE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_job_cancellations_seeker_user_id" ON "service"."job_cancellations" ("seeker_user_id")`);

    // ── transactions ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."transactions" (
        "id"             uuid                         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"     timestamptz                  NOT NULL DEFAULT now(),
        "updated_at"     timestamptz                  NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz,
        "txn_ref"        varchar(20)                  NOT NULL UNIQUE,
        "type"           "service"."transaction_type" NOT NULL,
        "sender_user_id" uuid                         NOT NULL REFERENCES "service"."users"("id") ON DELETE RESTRICT,
        "payment_id"     uuid                         REFERENCES "service"."payments"("id") ON DELETE RESTRICT,
        "refund_id"      uuid                         REFERENCES "service"."refunds"("id") ON DELETE RESTRICT,
        "amount"         int                          NOT NULL,
        "currency"       char(3)                      NOT NULL DEFAULT 'AUD',
        "description"    text
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_sender_user_id" ON "service"."transactions" ("sender_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_payment_id"     ON "service"."transactions" ("payment_id")`);

    // ── notifications ─────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."notifications" (
        "id"         uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "user_id"    uuid         NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "title"      varchar(255) NOT NULL,
        "body"       text         NOT NULL,
        "type"       varchar(50)  NOT NULL,
        "data"       jsonb,
        "read_at"    timestamptz,
        "sent_at"    timestamptz
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "service"."notifications" ("user_id")`);

    // ── fcm_tokens ────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "service"."fcm_tokens" (
        "id"         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "user_id"    uuid        NOT NULL REFERENCES "service"."users"("id") ON DELETE CASCADE,
        "token"      text        NOT NULL,
        "platform"   varchar(20)
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_fcm_tokens_token" ON "service"."fcm_tokens" ("token")`);
    await queryRunner.query(`CREATE INDEX "IDX_fcm_tokens_user_id" ON "service"."fcm_tokens" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse FK dependency order
    await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_fcm_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "service"."UQ_fcm_tokens_token"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."fcm_tokens"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "service"."IDX_notifications_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."job_cancellations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."subscription_cancellation_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."subscription_periods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."refund_evidence_photos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."refund_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."refunds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."job_contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."support_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."support_tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."warning_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."warning_threads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."user_warnings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."user_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."saved_payment_methods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."stripe_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."stripe_customers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."platform_fee_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."user_notification_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."seeker_favourite_providers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."direct_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."selections"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "service"."jobs" DROP CONSTRAINT IF EXISTS "FK_jobs_selected_bid_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."bids"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."job_photos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_verification_step_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_verification_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_verification_cases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_media"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_employees"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_certifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_bank_details"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_work_info"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_professional_details"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."provider_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "service"."contract_payment_frequency"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."warning_sender_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."support_sender_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."notification_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."subscription_cancellation_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."subscription_cancellation_reason"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."refund_evidence_side"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."refund_request_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."refund_request_reason"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."transaction_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."connect_flow"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."subscription_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."payment_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."service_duration"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."billing_period"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."service_frequency"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."storage_provider"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."certification_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."report_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."report_target_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."report_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."message_sender_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."billing_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."engagement_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."bid_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."job_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."job_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."user_role"`);

    await queryRunner.query(`DROP SCHEMA IF EXISTS "service"`);
  }
}
