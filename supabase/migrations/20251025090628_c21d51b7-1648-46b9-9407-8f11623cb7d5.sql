-- Consolidar respuestas legacy de Q1 para unificar analytics

-- Q1: Consolidar diseñadores
UPDATE quiz_analytics 
SET answer_value = 'Diseñador Gráfico / Web'
WHERE step_id = 'q1' 
  AND answer_value IN ('Diseñador/a', 'Diseñador web');

-- Q1: Consolidar creadores visuales
UPDATE quiz_analytics 
SET answer_value = 'Fotógrafo/Filmmaker'
WHERE step_id = 'q1' 
  AND answer_value IN ('Filmmaker / Videógrafo/a', 'Fotógrafo/a');

-- Q1: Consolidar automatizadores
UPDATE quiz_analytics 
SET answer_value = 'Automatizador'
WHERE step_id = 'q1' 
  AND answer_value = 'Automatizador/a (No-Code / IA)';

-- Q1: Consolidar otros servicios
UPDATE quiz_analytics 
SET answer_value = 'Otro servicio creativo'
WHERE step_id = 'q1' 
  AND answer_value = 'Otro';

-- Q4: Consolidar respuestas legacy de inversión
UPDATE quiz_analytics 
SET answer_value = 'Puedo hacer ese tributo ahora'
WHERE step_id = 'q4' 
  AND answer_value = 'Sí, puedo pagar 2.000€ hoy';

UPDATE quiz_analytics 
SET answer_value = 'No dispongo de esa cantidad'
WHERE step_id = 'q4' 
  AND answer_value = 'No puedo';