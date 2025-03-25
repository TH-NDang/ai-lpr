CREATE TABLE "license_plates" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" text NOT NULL,
	"confidence" integer NOT NULL,
	"image_url" text NOT NULL,
	"processed_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
