-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mediaMode" TEXT NOT NULL,
    "includedFrameDesigns" INTEGER NOT NULL,
    "accessDurationDays" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "BoothPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "gallerySlug" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "coverImageUrl" TEXT,
    "welcomeText" TEXT,
    "accessExpiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameTemplate" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slotCount" INTEGER NOT NULL,
    "overlayImageUrl" TEXT NOT NULL,
    "overlayPublicId" TEXT NOT NULL,
    "frameWidth" INTEGER NOT NULL,
    "frameHeight" INTEGER NOT NULL,
    "previewUrl" TEXT,
    "slotPositions" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSubmission" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "guestName" TEXT,
    "mediaType" TEXT NOT NULL,
    "rawPhotoUrls" TEXT,
    "rawVideoUrl" TEXT,
    "composedUrl" TEXT NOT NULL,
    "voiceNoteUrl" TEXT,
    "voiceDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_slug_key" ON "Wedding"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_gallerySlug_key" ON "Wedding"("gallerySlug");

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "BoothPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameTemplate" ADD CONSTRAINT "FrameTemplate_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSubmission" ADD CONSTRAINT "GuestSubmission_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSubmission" ADD CONSTRAINT "GuestSubmission_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "FrameTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
