-- Add new columns for RabbitMQ integration
ALTER TABLE notifications 
ADD COLUMN external_message_id VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::text,
ADD COLUMN event_id UUID;

-- Make userId nullable for broadcast notifications
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- Create unique index for idempotency
CREATE UNIQUE INDEX idx_external_message_id ON notifications(external_message_id);
