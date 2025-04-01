CREATE TYPE "public"."detection_source" AS ENUM('upload', 'camera', 'import', 'api');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('entry', 'exit', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."plate_type" AS ENUM('civilian', 'military', 'police', 'diplomatic', 'temporary', 'special');--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('car', 'truck', 'motorcycle', 'bus', 'special', 'other');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ip_address" text,
	"model" text,
	"resolution" text,
	"status" text DEFAULT 'active',
	"location_id" integer,
	"position" text,
	"direction" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detections" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "detection_source" DEFAULT 'upload' NOT NULL,
	"image_url" text NOT NULL,
	"processed_image_url" text,
	"detection_time" timestamp DEFAULT now() NOT NULL,
	"confidence" integer NOT NULL,
	"confidence_ocr" integer,
	"bounding_box" jsonb,
	"ocr_engine" text,
	"process_time_ms" integer,
	"plate_number" text NOT NULL,
	"normalized_plate" text,
	"original_plate" text,
	"camera_id" integer,
	"location_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_plates" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" text NOT NULL,
	"confidence" integer NOT NULL,
	"confidence_ocr" integer,
	"image_url" text NOT NULL,
	"processed_image_url" text,
	"province_code" text,
	"province_name" text,
	"vehicle_type" text,
	"plate_type" text,
	"plate_format" text,
	"plate_serial" text,
	"registration_number" text,
	"bounding_box" json,
	"normalized_plate" text,
	"original_plate" text,
	"detected_color" text,
	"ocr_engine" text,
	"is_valid_format" boolean,
	"format_description" text,
	"vehicle_category" text,
	"plate_type_info" json,
	"has_violation" boolean DEFAULT false,
	"violation_types" text[],
	"violation_description" text,
	"is_verified" boolean DEFAULT false,
	"verified_by" text,
	"verified_at" timestamp,
	"detection_id" integer,
	"vehicle_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"location_type" text,
	"latitude" real,
	"longitude" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parking_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_time" timestamp DEFAULT now() NOT NULL,
	"exit_time" timestamp,
	"entry_type" "entry_type" DEFAULT 'unknown',
	"detection_id" integer NOT NULL,
	"plate_number" text NOT NULL,
	"vehicle_id" integer,
	"location_id" integer NOT NULL,
	"parking_fee" real,
	"is_paid" boolean DEFAULT false,
	"payment_method" text,
	"payment_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_number" text NOT NULL,
	"owner_name" text,
	"registration_date" date,
	"expiry_date" date,
	"make" text,
	"model" text,
	"year" integer,
	"color" text,
	"vehicle_category" "vehicle_category",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"violation_time" timestamp DEFAULT now() NOT NULL,
	"violation_type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"detection_id" integer NOT NULL,
	"plate_number" text NOT NULL,
	"location_id" integer,
	"evidence_image_url" text,
	"evidence_video_url" text,
	"is_verified" boolean DEFAULT false,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_detection_id_detections_id_fk" FOREIGN KEY ("detection_id") REFERENCES "public"."detections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_detection_id_detections_id_fk" FOREIGN KEY ("detection_id") REFERENCES "public"."detections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "registration_idx" ON "vehicles" USING btree ("registration_number");