#!/bin/bash



echo "Tạo Service Account cho Kibana..."
curl -X POST "http://localhost:9200/_security/service/elastic/kibana" \
  -H "Content-Type: application/json" \
  -u elastic:changeme \
  -d '{
    "description": "Service account for Kibana"
  }'

# Tạo token cho service account
echo "Tạo Service Account Token..."
TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:9200/_security/service/elastic/kibana/credential/token" \
  -H "Content-Type: application/json" \
  -u elastic:changeme)

# Trích xuất token
SERVICE_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"value":"[^"]*"' | cut -d'"' -f4)

# Lưu vào file .env
echo "ELASTICSEARCH_SERVICEACCOUNTTOKEN=$SERVICE_TOKEN" > .env
echo "Đã lưu Service Account Token vào file .env"

echo "Tạo API Key cho Kibana (phương án dự phòng)..."
API_KEY_RESPONSE=$(curl -s -X POST "http://localhost:9200/_security/api_key" \
  -H "Content-Type: application/json" \
  -u elastic:changeme \
  -d '{
    "name": "kibana-api-key",
    "role_descriptors": {
      "kibana_system": {
        "cluster": ["monitor", "manage_index_templates", "manage_ilm"],
        "indices": [
          {
            "names": ["*"],
            "privileges": ["all"]
          }
        ]
      }
    }
  }')

API_KEY=$(echo $API_KEY_RESPONSE | grep -o '"encoded":"[^"]*"' | cut -d'"' -f4)
echo "ELASTICSEARCH_API_KEY=$API_KEY" >> .env

echo "Thiết lập hoàn tất! Sử dụng Service Account Token hoặc API Key từ file .env để cấu hình Kibana."