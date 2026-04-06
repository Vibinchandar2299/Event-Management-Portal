-- Drop signature/approval fields from FoodForm
ALTER TABLE "FoodForm" DROP COLUMN IF EXISTS "amenitiesIncharge";
ALTER TABLE "FoodForm" DROP COLUMN IF EXISTS "signOfOS";
ALTER TABLE "FoodForm" DROP COLUMN IF EXISTS "deanClearance";
ALTER TABLE "FoodForm" DROP COLUMN IF EXISTS "recommendedBy";
ALTER TABLE "FoodForm" DROP COLUMN IF EXISTS "facultySignature";
