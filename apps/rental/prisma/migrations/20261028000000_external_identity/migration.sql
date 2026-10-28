-- Preserve existing owner IDs and archived users/sessions for the one-time import.
-- Runtime Rental no longer reads or writes those archived tables.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS "bookings_userId_fkey";
