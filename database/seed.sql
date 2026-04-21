USE carbon_agent;

INSERT INTO products (name, category, cover_url, points_cost, stock, redeem_rule, status)
VALUES
  ('Seed Paper', 'physical', '', 450, 100, 'Max 2 times per month', 1),
  ('Eco Tote Bag', 'physical', '', 600, 80, 'Max 1 time per month', 1),
  ('Library Extension Pass', 'virtual', '', 800, 999, 'Only available during pilot activity', 1),
  ('Low Carbon Badge', 'badge', '', 120, 9999, 'Auto granted after redeem', 1)
ON DUPLICATE KEY UPDATE
  points_cost = VALUES(points_cost),
  stock = VALUES(stock),
  redeem_rule = VALUES(redeem_rule),
  status = VALUES(status);
