CREATE TABLE "showcase_destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text,
	"slug" text NOT NULL,
	"image_url" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcase_destinations_slug_unique" UNIQUE("slug")
);
