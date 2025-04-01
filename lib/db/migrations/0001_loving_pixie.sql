CREATE TYPE "public"."detection_source" AS ENUM('upload', 'camera', 'import', 'api');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('entry', 'exit', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."plate_type" AS ENUM('civilian', 'military', 'police', 'diplomatic', 'temporary', 'special');--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('car', 'truck', 'motorcycle', 'bus', 'special', 'other');--> statement-breakpoint
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
ALTER TABLE "license_plates" ADD COLUMN "bounding_box" json;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "normalized_plate" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "original_plate" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "detected_color" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "ocr_engine" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "is_valid_format" boolean;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "format_description" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "vehicle_category" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "plate_type_info" json;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "has_violation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "violation_types" text[];--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "violation_description" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "verified_by" text;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "detection_id" integer;--> statement-breakpoint
ALTER TABLE "license_plates" ADD COLUMN "vehicle_id" integer;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_detection_id_detections_id_fk" FOREIGN KEY ("detection_id") REFERENCES "public"."detections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_detection_id_detections_id_fk" FOREIGN KEY ("detection_id") REFERENCES "public"."detections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "registration_idx" ON "vehicles" USING btree ("registration_number");