-- Adicionar configurações de check-in nas arenas
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS janela_checkin_minutos_antes INTEGER DEFAULT 30;
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS janela_checkin_minutos_depois INTEGER DEFAULT 15;
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS coordenadas_latitude DECIMAL(10, 8);
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS coordenadas_longitude DECIMAL(11, 8);
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS raio_checkin_metros INTEGER DEFAULT 100;

COMMENT ON COLUMN arenas.janela_checkin_minutos_antes IS 'Quantos minutos antes do horário agendado o check-in pode ser feito';
COMMENT ON COLUMN arenas.janela_checkin_minutos_depois IS 'Quantos minutos depois do horário agendado o check-in pode ser feito';
COMMENT ON COLUMN arenas.coordenadas_latitude IS 'Latitude da localização da arena para validação de check-in por geolocalização';
COMMENT ON COLUMN arenas.coordenadas_longitude IS 'Longitude da localização da arena para validação de check-in por geolocalização';
COMMENT ON COLUMN arenas.raio_checkin_metros IS 'Raio em metros para validação de check-in por geolocalização';