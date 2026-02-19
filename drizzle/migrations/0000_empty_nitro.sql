CREATE TYPE "public"."pr_column" AS ENUM('draft', 'ready_for_review', 'review_in_progress', 'changes_requested', 'approved', 'merged');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'success', 'failure');--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"github_id" varchar(255) NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"url" varchar(2048) NOT NULL,
	"state" varchar(20) NOT NULL,
	"is_draft" boolean DEFAULT false,
	"column" "pr_column" NOT NULL,
	"author_login" varchar(255) NOT NULL,
	"author_avatar_url" varchar(2048),
	"review_decision" varchar(50),
	"comments_count" integer DEFAULT 0,
	"reviews_count" integer DEFAULT 0,
	"changed_files" integer DEFAULT 0,
	"additions" integer DEFAULT 0,
	"deletions" integer DEFAULT 0,
	"ci_status" varchar(50),
	"labels" jsonb DEFAULT '[]'::jsonb,
	"requested_reviewers" jsonb DEFAULT '[]'::jsonb,
	"head_ref" varchar(255),
	"base_ref" varchar(255),
	"github_created_at" timestamp NOT NULL,
	"github_updated_at" timestamp NOT NULL,
	"merged_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(511) NOT NULL,
	"is_active" boolean DEFAULT true,
	"webhook_id" integer,
	"webhook_secret" varchar(255),
	"default_branch" varchar(255) DEFAULT 'main',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "repositories_full_name_unique" UNIQUE("full_name")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"pull_request_id" integer NOT NULL,
	"github_id" varchar(255) NOT NULL,
	"author_login" varchar(255) NOT NULL,
	"author_avatar_url" varchar(2048),
	"state" varchar(50) NOT NULL,
	"body" text,
	"submitted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "reviews_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_id" integer,
	"status" "sync_status" NOT NULL,
	"trigger" varchar(50) NOT NULL,
	"prs_processed" integer DEFAULT 0,
	"prs_created" integer DEFAULT 0,
	"prs_updated" integer DEFAULT 0,
	"error_message" text,
	"duration_ms" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pull_requests_repo_number_idx" ON "pull_requests" USING btree ("repository_id","number");--> statement-breakpoint
CREATE INDEX "pull_requests_column_idx" ON "pull_requests" USING btree ("column");--> statement-breakpoint
CREATE INDEX "pull_requests_author_login_idx" ON "pull_requests" USING btree ("author_login");--> statement-breakpoint
CREATE INDEX "pull_requests_github_updated_at_idx" ON "pull_requests" USING btree ("github_updated_at");