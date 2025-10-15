-- CreateTable
CREATE TABLE "chat_users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "sessionId" TEXT NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rtmpConfigId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_configurations" (
    "id" TEXT NOT NULL,
    "rtmpConfigId" TEXT NOT NULL,
    "requireEmail" BOOLEAN NOT NULL DEFAULT false,
    "requireLastName" BOOLEAN NOT NULL DEFAULT false,
    "maxMessageLength" INTEGER NOT NULL DEFAULT 2000,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "moderationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_users_sessionId_key" ON "chat_users"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_configurations_rtmpConfigId_key" ON "chat_configurations"("rtmpConfigId");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_rtmpConfigId_fkey" FOREIGN KEY ("rtmpConfigId") REFERENCES "rtmp_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "chat_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_configurations" ADD CONSTRAINT "chat_configurations_rtmpConfigId_fkey" FOREIGN KEY ("rtmpConfigId") REFERENCES "rtmp_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
