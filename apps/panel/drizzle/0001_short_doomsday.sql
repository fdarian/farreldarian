CREATE TABLE `sync_state` (
	`domain` text PRIMARY KEY NOT NULL,
	`lastSyncedAt` integer,
	`lastError` text
);
--> statement-breakpoint
ALTER TABLE `repos` ADD `deletedAt` integer;