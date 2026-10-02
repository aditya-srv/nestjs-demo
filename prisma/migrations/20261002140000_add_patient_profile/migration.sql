-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "profilePhotoUrl" TEXT,
    "bloodGroup" TEXT,
    "emergencyContact" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy profile fields off existing onboarding rows
INSERT INTO "PatientProfile" (
    "userId",
    "dateOfBirth",
    "gender",
    "profilePhotoUrl",
    "emergencyContact",
    "createdAt",
    "updatedAt"
)
SELECT
    "userId",
    "dateOfBirth",
    "gender",
    "profilePhotoUrl",
    "emergencyContact",
    "createdAt",
    "updatedAt"
FROM "Onboarding";

-- AlterTable
ALTER TABLE "Onboarding" DROP COLUMN "dateOfBirth",
DROP COLUMN "gender",
DROP COLUMN "profilePhotoUrl",
DROP COLUMN "emergencyContact";
