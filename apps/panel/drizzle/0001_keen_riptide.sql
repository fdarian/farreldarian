CREATE TABLE `repos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`githubId` integer NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isPersonalProject` integer DEFAULT false NOT NULL,
	`tags` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`year` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repos_githubId_unique` ON `repos` (`githubId`);