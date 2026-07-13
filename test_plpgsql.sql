CREATE TABLE IF NOT EXISTS test_table (id INT);
CREATE OR REPLACE FUNCTION test_func() RETURNS VOID AS $$
BEGIN
  UPDATE test_table SET non_existent_col = 1 WHERE id = 1;
END;
$$ LANGUAGE plpgsql;
