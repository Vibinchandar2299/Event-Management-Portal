-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT '',
    "dept" TEXT NOT NULL,
    "empid" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountOwnerName" TEXT NOT NULL DEFAULT '',
    "accountOwnerEmail" TEXT NOT NULL DEFAULT '',
    "accountOwnerPhone" TEXT NOT NULL DEFAULT '',
    "notificationEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notificationWhatsappNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BasicEvent" (
    "id" UUID NOT NULL,
    "iqacNumber" TEXT NOT NULL,
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "academicdepartment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "professional" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVenue" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "year" TEXT,
    "categories" TEXT,
    "logos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "organizers" JSONB,
    "resourcePersons" JSONB,
    "status" TEXT,
    "poster" TEXT,
    "communicationformId" UUID,
    "foodformId" UUID,
    "guestroomId" UUID,
    "transportIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endform" (
    "id" UUID NOT NULL,
    "eventdata" UUID,
    "iqacno" TEXT,
    "transportformIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenityform" TEXT,
    "guestformId" UUID,
    "communicationformId" UUID,
    "foodformId" UUID,
    "status" TEXT,
    "approvals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaRequirement" (
    "id" UUID NOT NULL,
    "eventPoster" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onStageRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receptionTVStreamingRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "communication" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flexBanners" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cameraAction" JSONB,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodForm" (
    "id" UUID NOT NULL,
    "eventName" TEXT,
    "eventType" TEXT,
    "otherEventType" TEXT DEFAULT '',
    "iqacNumber" TEXT,
    "empId" TEXT,
    "requestorName" TEXT,
    "requisitionDate" TIMESTAMP(3),
    "mobileNumber" TEXT,
    "department" TEXT,
    "designationDepartment" TEXT,
    "amenitiesIncharge" TEXT,
    "deanClearance" TEXT DEFAULT '',
    "recommendedBy" TEXT DEFAULT '',
    "facultySignature" TEXT DEFAULT '',
    "dates" JSONB,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRequest" (
    "id" UUID NOT NULL,
    "basicDetails" JSONB NOT NULL,
    "eventDetails" JSONB NOT NULL,
    "travelDetails" JSONB NOT NULL,
    "driverDetails" JSONB NOT NULL,
    "iqacNumber" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestBooking" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "iqacNumber" TEXT,
    "eventName" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "stayDays" INTEGER,
    "mobile" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "selectedRooms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TotalCount" (
    "id" UUID NOT NULL,
    "totalCounts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TotalCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailId_key" ON "User"("emailId");

-- CreateIndex
CREATE INDEX "BasicEvent_iqacNumber_idx" ON "BasicEvent"("iqacNumber");

-- CreateIndex
CREATE INDEX "Endform_eventdata_idx" ON "Endform"("eventdata");

-- CreateIndex
CREATE INDEX "Endform_status_idx" ON "Endform"("status");

-- CreateIndex
CREATE INDEX "FoodForm_iqacNumber_idx" ON "FoodForm"("iqacNumber");

-- CreateIndex
CREATE INDEX "TransportRequest_iqacNumber_idx" ON "TransportRequest"("iqacNumber");

-- CreateIndex
CREATE INDEX "GuestBooking_iqacNumber_idx" ON "GuestBooking"("iqacNumber");
