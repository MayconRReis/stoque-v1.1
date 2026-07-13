-- Migration: Consolidate Pallets
ALTER TABLE inventory ADD COLUMN is_group BOOLEAN DEFAULT false;
ALTER TABLE inventory ADD COLUMN parent_group_id TEXT REFERENCES inventory(id) ON DELETE SET NULL;
CREATE INDEX idx_inventory_parent_group_id ON inventory(parent_group_id);
