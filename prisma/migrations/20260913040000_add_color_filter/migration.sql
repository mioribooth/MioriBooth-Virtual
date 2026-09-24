-- CreateTable
CREATE TABLE "ColorFilter" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lutFileUrl" TEXT NOT NULL,
    "lutSize" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColorFilter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ColorFilter" ADD CONSTRAINT "ColorFilter_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
