CREATE TABLE `tags` (
	`name` text PRIMARY KEY NOT NULL,
	`description` text,
	`isPinned` integer DEFAULT false NOT NULL,
	`pinnedOrder` integer DEFAULT 0 NOT NULL,
	`projectOrder` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
