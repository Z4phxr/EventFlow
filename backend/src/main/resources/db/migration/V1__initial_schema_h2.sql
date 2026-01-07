-- H2 compatible version of initial schema
CREATE TABLE users (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    encrypted_email TEXT NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);

-- Create events table
CREATE TABLE events (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    organizer_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_start_at ON events(start_at);

-- Create registrations table
CREATE TABLE registrations (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_registrations_event_user UNIQUE (event_id, user_id)
);

CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
