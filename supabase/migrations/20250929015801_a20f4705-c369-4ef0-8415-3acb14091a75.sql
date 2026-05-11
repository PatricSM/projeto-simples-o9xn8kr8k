-- Vincular perguntas às seções criadas
UPDATE campaign_questions 
SET section_id = (SELECT id FROM campaign_sections WHERE campaign_id = 'ee8b6844-2739-4da3-bb92-93fbbf5c7d5b' AND title = 'Pesquisa Principal' LIMIT 1)
WHERE campaign_id = 'ee8b6844-2739-4da3-bb92-93fbbf5c7d5b' AND order_index <= 4;

UPDATE campaign_questions 
SET section_id = (SELECT id FROM campaign_sections WHERE campaign_id = 'ee8b6844-2739-4da3-bb92-93fbbf5c7d5b' AND title = 'Identificação' LIMIT 1)
WHERE campaign_id = 'ee8b6844-2739-4da3-bb92-93fbbf5c7d5b' AND order_index >= 5;