-- Create databases for each microservice
CREATE DATABASE eventflow_users;
CREATE DATABASE eventflow_events;
CREATE DATABASE eventflow_notifications;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE eventflow_users TO eventflow;
GRANT ALL PRIVILEGES ON DATABASE eventflow_events TO eventflow;
GRANT ALL PRIVILEGES ON DATABASE eventflow_notifications TO eventflow;
