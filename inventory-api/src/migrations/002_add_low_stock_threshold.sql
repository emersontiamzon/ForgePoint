-- Add low_stock_threshold column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
