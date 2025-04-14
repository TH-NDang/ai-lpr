CREATE TYPE "public"."detection_source" AS ENUM('upload', 'camera', 'import', 'api');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('entry', 'exit', 'unknown');--> statement-breakpoint
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
CREATE TABLE "cameras" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) DEFAULT '' NOT NULL,
	"model" varchar(100),
	"locationId" integer,
	"position" varchar(100),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detected_plate_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"detectionId" integer NOT NULL,
	"licensePlateId" integer,
	"confidenceDetection" real NOT NULL,
	"boundingBox" jsonb NOT NULL,
	"ocrEngineUsed" varchar(50),
	"typeVehicle" "vehicle_category",
	"provinceCode" varchar(10),
	"provinceName" varchar(100),
	"plateType" varchar(50),
	"detectedColor" varchar(30),
	"isValidFormat" boolean,
	"formatDescription" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detections" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "detection_source" DEFAULT 'upload',
	"imageUrl" text NOT NULL,
	"processedImageUrl" text,
	"detectionTime" timestamp with time zone DEFAULT now() NOT NULL,
	"processTimeMs" integer,
	"cameraId" integer,
	"locationId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_plates" (
	"id" serial PRIMARY KEY NOT NULL,
	"plateNumber" varchar(20) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "license_plates_plateNumber_unique" UNIQUE("plateNumber")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) DEFAULT '' NOT NULL,
	"address" text,
	"locationType" varchar(50),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parking_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entryTime" timestamp with time zone DEFAULT now() NOT NULL,
	"exitTime" timestamp with time zone,
	"entryType" "entry_type" DEFAULT 'unknown',
	"detectedPlateResultId" integer,
	"plateNumber" varchar(20) DEFAULT '',
	"locationId" integer NOT NULL,
	"detectionId" integer,
	"parkingFee" real,
	"paymentStatus" varchar(30),
	"paymentTime" timestamp with time zone,
	"paymentMethod" varchar(50),
	"receiptNumber" varchar(100),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_plate_results" ADD CONSTRAINT "detected_plate_results_detectionId_detections_id_fk" FOREIGN KEY ("detectionId") REFERENCES "public"."detections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_plate_results" ADD CONSTRAINT "detected_plate_results_licensePlateId_license_plates_id_fk" FOREIGN KEY ("licensePlateId") REFERENCES "public"."license_plates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detections" ADD CONSTRAINT "detections_cameraId_cameras_id_fk" FOREIGN KEY ("cameraId") REFERENCES "public"."cameras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detections" ADD CONSTRAINT "detections_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_detectedPlateResultId_detected_plate_results_id_fk" FOREIGN KEY ("detectedPlateResultId") REFERENCES "public"."detected_plate_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parking_entries" ADD CONSTRAINT "parking_entries_detectionId_detections_id_fk" FOREIGN KEY ("detectionId") REFERENCES "public"."detections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;