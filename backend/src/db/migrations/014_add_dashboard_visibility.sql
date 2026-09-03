-- Add dashboard visibility preferences to accounts table
ALTER TABLE accounts 
ADD COLUMN include_in_dashboard_sum BOOLEAN DEFAULT TRUE,
ADD COLUMN show_in_dashboard BOOLEAN DEFAULT TRUE;
