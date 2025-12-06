# Configuração do Supabase - Sistema de Controle de Frotas

Este guia explica como configurar o Supabase como backend de armazenamento para o sistema de controle de frotas.

## Sumário

1. [Criação do Projeto no Supabase](#1-criação-do-projeto-no-supabase)
2. [Criação das Tabelas](#2-criação-das-tabelas)
3. [Configuração de Row Level Security (RLS)](#3-configuração-de-row-level-security-rls)
4. [Configuração das Variáveis de Ambiente](#4-configuração-das-variáveis-de-ambiente)
5. [Ativação do Realtime](#5-ativação-do-realtime-opcional)
6. [Testando a Conexão](#6-testando-a-conexão)

---

## 1. Criação do Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login ou crie uma conta
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Name**: `controle-frotas` (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte (guarde-a, será necessária)
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)
4. Clique em **"Create new project"** e aguarde a criação (pode levar alguns minutos)

---

## 2. Criação das Tabelas

Após a criação do projeto, acesse **SQL Editor** no menu lateral e execute os scripts abaixo **na ordem apresentada**.

### 2.1 Tabela de Usuários

```sql
-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

### 2.2 Tabela de Veículos

```sql
-- Tabela de veículos da frota
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('moving', 'stopped', 'idle', 'offline')),
    ignition TEXT NOT NULL DEFAULT 'off' CHECK (ignition IN ('on', 'off')),
    current_speed INTEGER NOT NULL DEFAULT 0,
    speed_limit INTEGER NOT NULL DEFAULT 80,
    heading INTEGER NOT NULL DEFAULT 0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy INTEGER NOT NULL DEFAULT 5,
    last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    battery_level INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_update ON vehicles(last_update);
```

### 2.3 Tabela de Geofences (Cercas Virtuais)

```sql
-- Tabela de geofences
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('circle', 'polygon')),
    active BOOLEAN NOT NULL DEFAULT true,
    center JSONB, -- {latitude: number, longitude: number}
    radius INTEGER,
    points JSONB, -- Array de {latitude: number, longitude: number}
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    vehicle_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_triggered TIMESTAMPTZ,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(active);
CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(type);
```

### 2.4 Tabela de Alertas

```sql
-- Tabela de alertas do sistema
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('speed', 'geofence_entry', 'geofence_exit', 'geofence_dwell', 'system')),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'warning', 'info')),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT false,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed INTEGER,
    speed_limit INTEGER,
    geofence_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
```

### 2.5 Tabela de Viagens

```sql
-- Tabela de viagens
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_distance INTEGER NOT NULL DEFAULT 0,
    travel_time INTEGER NOT NULL DEFAULT 0,
    stopped_time INTEGER NOT NULL DEFAULT 0,
    average_speed INTEGER NOT NULL DEFAULT 0,
    max_speed INTEGER NOT NULL DEFAULT 0,
    stops_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time);
CREATE INDEX IF NOT EXISTS idx_trips_end_time ON trips(end_time);
```

### 2.6 Tabela de Pontos de Localização

```sql
-- Tabela de pontos de localização (histórico de rastreamento)
CREATE TABLE IF NOT EXISTS location_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed INTEGER NOT NULL DEFAULT 0,
    heading INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL,
    accuracy DOUBLE PRECISION
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_location_points_trip_id ON location_points(trip_id);
CREATE INDEX IF NOT EXISTS idx_location_points_timestamp ON location_points(timestamp);
```

### 2.7 Tabela de Eventos de Rota

```sql
-- Tabela de eventos de rota
CREATE TABLE IF NOT EXISTS route_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('departure', 'arrival', 'stop', 'speed_violation', 'geofence_entry', 'geofence_exit')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    duration INTEGER,
    speed INTEGER,
    speed_limit INTEGER,
    geofence_name TEXT,
    address TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_route_events_trip_id ON route_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_events_type ON route_events(type);
CREATE INDEX IF NOT EXISTS idx_route_events_timestamp ON route_events(timestamp);
```

### 2.8 Tabela de Violações de Velocidade

```sql
-- Tabela de violações de velocidade
CREATE TABLE IF NOT EXISTS speed_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_name TEXT NOT NULL,
    speed INTEGER NOT NULL,
    speed_limit INTEGER NOT NULL,
    excess_speed INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_speed_violations_vehicle_id ON speed_violations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_speed_violations_timestamp ON speed_violations(timestamp);
```

### 2.9 Função para Atualizar updated_at Automaticamente

```sql
-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Configuração de Row Level Security (RLS)

O RLS (Row Level Security) é uma funcionalidade de segurança do PostgreSQL que controla quais linhas um usuário pode acessar.

### 3.1 Para Desenvolvimento (Acesso Total)

Para ambiente de desenvolvimento, você pode desabilitar o RLS ou permitir acesso total:

```sql
-- Desabilitar RLS para desenvolvimento (NÃO use em produção!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE geofences DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE speed_violations DISABLE ROW LEVEL SECURITY;
```

### 3.2 Para Produção (Recomendado)

Para produção, configure políticas de RLS adequadas:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_violations ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (service role)
-- Estas políticas permitem acesso total para o backend

CREATE POLICY "Allow full access for service role" ON vehicles
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON geofences
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON alerts
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON trips
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON location_points
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON route_events
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access for service role" ON speed_violations
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

---

## 4. Configuração das Variáveis de Ambiente

### 4.1 Obtendo as Credenciais

1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Copie os valores:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public**: Chave pública para uso no cliente
   - **service_role**: Chave privada para uso no servidor (nunca exponha no frontend!)

### 4.2 Configurando o Arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Configuração do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# URL de conexão direta (para Drizzle migrations)
# Encontrada em Project Settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres

# Configuração do servidor
PORT=5000
NODE_ENV=development
```

### 4.3 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | Sim |
| `SUPABASE_ANON_KEY` | Chave pública anônima | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (backend) | Opcional |
| `DATABASE_URL` | URL de conexão PostgreSQL | Para migrações |

---

## 5. Ativação do Realtime (Opcional)

O Supabase oferece funcionalidade de Realtime para receber atualizações em tempo real. Para ativar:

1. No painel do Supabase, vá em **Database** > **Replication**
2. Em **Source**, clique em **0 tables**
3. Ative as tabelas que deseja monitorar em tempo real:
   - `vehicles` (recomendado - para posição em tempo real)
   - `alerts` (recomendado - para notificações)
4. Clique em **Save**

**Nota**: O sistema atual usa polling para atualizações. Para usar o Realtime do Supabase, seria necessário adaptar o código para usar as subscriptions do Supabase.

---

## 6. Testando a Conexão

### 6.1 Verificando a Configuração

Após configurar as variáveis de ambiente, inicie o servidor:

```bash
npm run dev
```

Se a configuração estiver correta, você verá no console:

```
🔌 Usando Supabase como backend de armazenamento
```

Se as variáveis não estiverem configuradas, verá:

```
💾 Usando armazenamento em memória (dados de demonstração)
```

### 6.2 Inserindo Dados de Teste

Para inserir dados de teste no Supabase, execute no SQL Editor:

```sql
-- Inserir veículos de exemplo
INSERT INTO vehicles (name, license_plate, model, status, ignition, current_speed, speed_limit, heading, latitude, longitude, accuracy, battery_level)
VALUES 
    ('Caminhão 01', 'ABC-1234', 'Mercedes Actros', 'moving', 'on', 72, 80, 45, -23.5489, -46.6388, 5, 85),
    ('Van 02', 'DEF-5678', 'Fiat Ducato', 'moving', 'on', 55, 60, 180, -23.5605, -46.6533, 3, 92),
    ('Caminhão 03', 'GHI-9012', 'Volvo FH', 'stopped', 'off', 0, 80, 0, -23.5305, -46.6233, 4, 78);

-- Inserir geofence de exemplo
INSERT INTO geofences (name, description, type, active, center, radius, rules, vehicle_ids, color)
VALUES (
    'Depósito Central',
    'Área principal de carga e descarga',
    'circle',
    true,
    '{"latitude": -23.5505, "longitude": -46.6333}'::jsonb,
    500,
    '[{"type": "entry", "enabled": true, "toleranceSeconds": 30}, {"type": "exit", "enabled": true, "toleranceSeconds": 30}]'::jsonb,
    '[]'::jsonb,
    '#22c55e'
);
```

---

## Resolução de Problemas

### Erro: "Supabase não configurado"

- Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão definidas no arquivo `.env`
- Certifique-se de que o arquivo `.env` está na raiz do projeto
- Reinicie o servidor após modificar o arquivo `.env`

### Erro: "Failed to fetch vehicles"

- Verifique se as tabelas foram criadas corretamente
- Confira se o RLS está desabilitado ou se as políticas estão configuradas corretamente
- Verifique se a URL e as chaves do Supabase estão corretas

### Erro de Conexão com o Banco

- Verifique se o projeto Supabase está ativo
- Confirme se a região do projeto está acessível
- Verifique se não há firewall bloqueando a conexão

---

## Próximos Passos

1. **Autenticação**: Implemente autenticação usando Supabase Auth
2. **RLS Avançado**: Configure políticas de RLS por usuário/organização
3. **Realtime**: Adapte o código para usar subscriptions do Supabase
4. **Backups**: Configure backups automáticos no Supabase
5. **Monitoramento**: Configure alertas de uso e performance

---

## Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)

