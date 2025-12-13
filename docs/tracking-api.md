# API de Rastreamento de Veículos

Esta documentação descreve como utilizar o endpoint de rastreamento para enviar dados de localização e velocidade dos veículos em tempo real.

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Endpoint](#2-endpoint)
3. [Formato da Requisição](#3-formato-da-requisição)
4. [Respostas](#4-respostas)
5. [Exemplos de Uso](#5-exemplos-de-uso)
6. [Comportamento do Sistema](#6-comportamento-do-sistema)
7. [Erros Comuns](#7-erros-comuns)

---

## 1. Visão Geral

O endpoint de tracking permite que dispositivos de rastreamento (GPS trackers, aplicativos móveis, etc.) enviem dados de localização em tempo real para atualizar a posição dos veículos no sistema.

Quando um dado de rastreamento é recebido:
- A posição do veículo é atualizada no mapa em tempo real
- O status do veículo é calculado automaticamente com base na velocidade
- Todos os clientes conectados via WebSocket recebem a atualização instantaneamente

---

## 2. Endpoint

```
POST /api/tracking
```

### Headers

| Header         | Valor              | Obrigatório |
|----------------|-------------------|-------------|
| Content-Type   | application/json  | Sim         |

---

## 3. Formato da Requisição

### Body (JSON)

| Campo        | Tipo   | Obrigatório | Descrição                                       | Validação                    |
|--------------|--------|-------------|------------------------------------------------|------------------------------|
| licensePlate | string | Sim         | Placa do veículo (ex: "ABC-1234")              | Mínimo 1 caractere           |
| latitude     | number | Sim         | Latitude da posição atual                       | Entre -90 e 90               |
| longitude    | number | Sim         | Longitude da posição atual                      | Entre -180 e 180             |
| speed        | number | Sim         | Velocidade atual em km/h                        | Mínimo 0                     |

### Exemplo de Body

```json
{
  "licensePlate": "ABC-1234",
  "latitude": -23.5489,
  "longitude": -46.6388,
  "speed": 72
}
```

---

## 4. Respostas

### Sucesso (200 OK)

```json
{
  "success": true,
  "message": "Localização atualizada com sucesso",
  "vehicle": {
    "id": "uuid-do-veiculo",
    "name": "Caminhão 01",
    "licensePlate": "ABC-1234",
    "model": "Mercedes Actros",
    "status": "moving",
    "ignition": "on",
    "currentSpeed": 72,
    "speedLimit": 80,
    "heading": 45,
    "latitude": -23.5489,
    "longitude": -46.6388,
    "accuracy": 5,
    "lastUpdate": "2025-12-06T15:30:00.000Z",
    "batteryLevel": 85
  }
}
```

### Erro de Validação (400 Bad Request)

```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "code": "too_small",
      "minimum": -90,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Number must be greater than or equal to -90",
      "path": ["latitude"]
    }
  ]
}
```

### Veículo Não Encontrado (404 Not Found)

```json
{
  "error": "Veículo não encontrado",
  "message": "Nenhum veículo cadastrado com a placa ABC-1234"
}
```

### Erro Interno (500 Internal Server Error)

```json
{
  "error": "Falha ao processar dados de rastreamento"
}
```

---

## 5. Exemplos de Uso

### cURL

```bash
curl -X POST http://localhost:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC-1234",
    "latitude": -23.5489,
    "longitude": -46.6388,
    "speed": 72
  }'
```

### JavaScript (Fetch API)

```javascript
async function enviarLocalizacao(placa, latitude, longitude, velocidade) {
  try {
    const response = await fetch('http://localhost:5000/api/tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        licensePlate: placa,
        latitude: latitude,
        longitude: longitude,
        speed: velocidade,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro:', data.error);
      return null;
    }

    console.log('Localização atualizada:', data.vehicle);
    return data.vehicle;
  } catch (error) {
    console.error('Erro de conexão:', error);
    return null;
  }
}

// Exemplo de uso
enviarLocalizacao('ABC-1234', -23.5489, -46.6388, 72);
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

async function enviarLocalizacao(placa, latitude, longitude, velocidade) {
  try {
    const { data } = await axios.post('http://localhost:5000/api/tracking', {
      licensePlate: placa,
      latitude: latitude,
      longitude: longitude,
      speed: velocidade,
    });

    console.log('Sucesso:', data.message);
    return data.vehicle;
  } catch (error) {
    if (error.response) {
      console.error('Erro:', error.response.data.error);
    } else {
      console.error('Erro de conexão:', error.message);
    }
    return null;
  }
}

// Exemplo de uso
enviarLocalizacao('ABC-1234', -23.5489, -46.6388, 72);
```

### Python (requests)

```python
import requests

def enviar_localizacao(placa, latitude, longitude, velocidade):
    url = 'http://localhost:5000/api/tracking'
    
    payload = {
        'licensePlate': placa,
        'latitude': latitude,
        'longitude': longitude,
        'speed': velocidade
    }
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        if response.status_code == 200:
            print(f"Sucesso: {data['message']}")
            return data['vehicle']
        else:
            print(f"Erro: {data['error']}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Erro de conexão: {e}")
        return None

# Exemplo de uso
enviar_localizacao('ABC-1234', -23.5489, -46.6388, 72)
```

### Arduino/ESP32 (HTTP Client)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverUrl = "http://seu-servidor:5000/api/tracking";
const char* licensePlate = "ABC-1234";

void enviarLocalizacao(float latitude, float longitude, float speed) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi não conectado");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Criar JSON
  StaticJsonDocument<200> doc;
  doc["licensePlate"] = licensePlate;
  doc["latitude"] = latitude;
  doc["longitude"] = longitude;
  doc["speed"] = speed;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Resposta: " + response);
  } else {
    Serial.println("Erro: " + String(httpResponseCode));
  }

  http.end();
}

void loop() {
  // Ler dados do GPS e enviar
  float lat = -23.5489;  // Substituir por dados reais do GPS
  float lng = -46.6388;
  float spd = 72.0;
  
  enviarLocalizacao(lat, lng, spd);
  
  delay(5000);  // Enviar a cada 5 segundos
}
```

---

## 6. Comportamento do Sistema

### Determinação Automática do Status

O sistema determina automaticamente o status do veículo com base na velocidade informada:

| Velocidade | Status Resultante | Ignição |
|------------|------------------|---------|
| > 0 km/h   | `moving`         | `on`    |
| = 0 km/h   | `stopped`        | `on`    |

**Nota:** O status `offline` é atribuído automaticamente pelo sistema quando o veículo não envia dados por um período prolongado.

### Campos Atualizados

Ao receber dados de tracking, os seguintes campos do veículo são atualizados:

- `latitude` - Nova latitude
- `longitude` - Nova longitude  
- `currentSpeed` - Nova velocidade (arredondada para inteiro)
- `status` - Calculado automaticamente
- `ignition` - Definido como "on"
- `lastUpdate` - Timestamp da atualização

### Notificação em Tempo Real

Após atualizar os dados do veículo, o sistema automaticamente notifica todos os clientes conectados via WebSocket. Isso permite que o mapa seja atualizado em tempo real sem necessidade de polling.

---

## 7. Erros Comuns

### Placa não corresponde ao formato

**Problema:** A busca por placa é case-insensitive, então "ABC-1234", "abc-1234" e "Abc-1234" são equivalentes.

**Solução:** Certifique-se de que a placa enviada corresponde exatamente ao formato cadastrado no sistema (incluindo traços ou espaços, se houver).

### Veículo não cadastrado

**Problema:** A placa informada não existe no banco de dados.

**Solução:** Cadastre o veículo primeiro usando o endpoint `POST /api/vehicles` antes de enviar dados de tracking.

### Coordenadas fora dos limites

**Problema:** Latitude deve estar entre -90 e 90, longitude entre -180 e 180.

**Solução:** Verifique se o GPS está retornando valores válidos. Coordenadas inválidas geralmente indicam problemas de leitura do sensor.

### Velocidade negativa

**Problema:** A velocidade deve ser >= 0.

**Solução:** Certifique-se de que o valor da velocidade não está sendo calculado incorretamente.

---

## Recursos Relacionados

- [Configuração do Supabase](./supabase-setup.md) - Configure o banco de dados
- `POST /api/vehicles` - Cadastrar novos veículos
- `GET /api/vehicles` - Listar todos os veículos
- `WebSocket /ws` - Conexão em tempo real para receber atualizações




