-- Adds the SUPER_ADMIN role. It can only create ADMIN / SUPER_ADMIN accounts.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
