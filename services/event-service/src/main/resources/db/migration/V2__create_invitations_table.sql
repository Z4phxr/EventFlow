-- Create invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    inviter_user_id UUID NOT NULL,
    invitee_email VARCHAR(320) NOT NULL,
    token VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_invitation_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_invitation_event_id ON invitations(event_id);
CREATE INDEX idx_invitation_token ON invitations(token);
CREATE INDEX idx_invitation_email_status ON invitations(event_id, invitee_email, status);
