/*
  # Create Products Table for UniSwap Marketplace

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - Unique identifier for each product
      - `title` (text) - Product name
      - `description` (text) - Product description
      - `price` (numeric) - Product price in INR
      - `condition` (text) - Product condition (New/Used)
      - `category` (text) - Product category (Books, Electronics, etc.)
      - `image_url` (text) - URL to product image
      - `seller_name` (text) - Name of the seller
      - `seller_phone` (text) - WhatsApp phone number of seller
      - `created_at` (timestamptz) - When the product was listed

  2. Security
    - Enable RLS on `products` table
    - Add policy for anyone to read all products (public marketplace)
    - Add policy for anyone to insert products (open product)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  condition text NOT NULL DEFAULT 'Used',
  category text NOT NULL,
  image_url text NOT NULL,
  seller_name text NOT NULL,
  seller_phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create products"
  ON products FOR INSERT
  WITH CHECK (true);