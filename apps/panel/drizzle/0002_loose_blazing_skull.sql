CREATE TABLE `merged_pull_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`githubId` integer NOT NULL,
	`repo` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`href` text NOT NULL,
	`mergedAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`syncedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `merged_pull_requests_githubId_unique` ON `merged_pull_requests` (`githubId`);--> statement-breakpoint
CREATE INDEX `merged_pull_requests_merged_at_idx` ON `merged_pull_requests` (`mergedAt`);