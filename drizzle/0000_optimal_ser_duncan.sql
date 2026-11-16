CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`room` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`profile` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`expression` text DEFAULT 'joie' NOT NULL,
	`pin_hash` text,
	`salt` text,
	`failures` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`host` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`players` text NOT NULL,
	`state` text,
	`version` integer DEFAULT 0 NOT NULL,
	`capacity` integer DEFAULT 2 NOT NULL,
	`round_limit` integer DEFAULT 40 NOT NULL,
	`updated` integer NOT NULL,
	`created` integer NOT NULL,
	`winner` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_code_unique` ON `rooms` (`code`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`expires` integer NOT NULL
);
