import { Migration } from '@mikro-orm/migrations';

export class Migration20251121025600 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "email" varchar(255) not null, "first_name" varchar(255) null, "last_name" varchar(255) null, "full_name" varchar(255) null, "date_of_birth" date null, "gender" varchar(255) null, "phone_number" varchar(255) null, "avatar" varchar(255) null, "is_active" boolean not null default true, "password" varchar(255) not null, "email_verified" boolean not null default false, "role" varchar(255) not null, "password_changed_at" date null, "google_id" varchar(255) null, "google_name" varchar(255) null, "google_avatar" varchar(255) null, "is_2fa_enabled" boolean not null default false, constraint "users_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "users" cascade;`);
  }

}
