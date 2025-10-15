-- Add new columns to existing tables
ALTER TABLE "users" ADD COLUMN "chatMessages" TEXT[];
ALTER TABLE "users" ADD COLUMN "chatPermissions" TEXT[];

-- Update chat_users table
ALTER TABLE "chat_users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'VIEWER';
ALTER TABLE "chat_users" ADD COLUMN "userId" TEXT;

-- Add foreign key constraint for chat_users.userId
ALTER TABLE "chat_users" ADD CONSTRAINT "chat_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update chat_messages table
ALTER TABLE "chat_messages" ADD COLUMN "chatType" TEXT NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "chat_messages" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_messages" ADD COLUMN "replyToId" TEXT;

-- Add foreign key constraint for chat_messages.replyToId
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update chat_configurations table
ALTER TABLE "chat_configurations" ADD COLUMN "allowPrivateChat" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "chat_configurations" ADD COLUMN "allowPublicChat" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "chat_configurations" ADD COLUMN "chatOnline" BOOLEAN NOT NULL DEFAULT false;

-- Create chat_permissions table
CREATE TABLE "chat_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rtmpConfigId" TEXT NOT NULL,
    "canModerate" BOOLEAN NOT NULL DEFAULT false,
    "canBanUsers" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteMessages" BOOLEAN NOT NULL DEFAULT false,
    "canPinMessages" BOOLEAN NOT NULL DEFAULT false,
    "canAccessPrivateChat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_permissions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for chat_permissions
CREATE UNIQUE INDEX "chat_permissions_userId_rtmpConfigId_key" ON "chat_permissions"("userId", "rtmpConfigId");

-- Add foreign key constraints for chat_permissions
ALTER TABLE "chat_permissions" ADD CONSTRAINT "chat_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_permissions" ADD CONSTRAINT "chat_permissions_rtmpConfigId_fkey" FOREIGN KEY ("rtmpConfigId") REFERENCES "rtmp_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update rtmp_configurations table
ALTER TABLE "rtmp_configurations" ADD COLUMN "chatPermissions" TEXT[];
