# API Documentation for Postman Testing

## Base URL
After deployment, your API will be available at:
```
https://your-domain.com/api
```

## Authentication
All API endpoints require a valid API key for authentication. You can pass the API key in two ways:

1. **Query Parameter**: `?apiKey=your_api_key_here`
2. **Request Body** (for POST requests): `{ "apiKey": "your_api_key_here" }`

## Endpoints

### 1. Validate API Key

**Endpoint**: `/api/validate`

#### GET Request
```
GET /api/validate?apiKey=your_api_key_here
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "API key is valid",
  "data": {
    "keyId": 1,
    "keyName": "Production Key",
    "keyType": "production",
    "status": "active",
    "usage": 15,
    "monthlyLimit": 1000,
    "lastUsed": "2024-01-20T10:30:00.000Z"
  }
}
```

**Response (Error - 401)**:
```json
{
  "success": false,
  "message": "Invalid API key",
  "error": "INVALID_API_KEY"
}
```

#### POST Request
```
POST /api/validate
Content-Type: application/json

{
  "apiKey": "your_api_key_here"
}
```

**Response**: Same as GET request

---

### 2. Get API Keys and Statistics

**Endpoint**: `/api/keys`

#### GET Request
```
GET /api/keys?apiKey=your_api_key_here
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "API keys retrieved successfully",
  "data": {
    "authenticatedKey": {
      "id": 1,
      "name": "Production Key",
      "keyType": "production",
      "status": "active",
      "usage": 15,
      "monthlyLimit": 1000,
      "lastUsed": "2024-01-20T10:30:00.000Z",
      "createdAt": "2024-01-15T08:00:00.000Z"
    },
    "statistics": {
      "totalKeys": 3,
      "activeKeys": 2,
      "totalUsage": 45,
      "averageUsage": 15
    },
    "allKeys": [
      {
        "id": 1,
        "name": "Production Key",
        "keyType": "production",
        "status": "active",
        "usage": 15,
        "monthlyLimit": 1000,
        "lastUsed": "2024-01-20T10:30:00.000Z",
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Development Key",
        "keyType": "development",
        "status": "active",
        "usage": 30,
        "monthlyLimit": 500,
        "lastUsed": "2024-01-19T15:45:00.000Z",
        "createdAt": "2024-01-16T12:00:00.000Z"
      }
    ]
  }
}
```

## Postman Collection Setup

### 1. Create a New Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "API Manager"

### 2. Set up Environment Variables
1. Click "Environments" → "New Environment"
2. Name it "API Manager Environment"
3. Add these variables:
   - `base_url`: `https://your-domain.com/api`
   - `api_key`: `your_actual_api_key_here`

### 3. Create Requests

#### Validate API Key (GET)
```
Method: GET
URL: {{base_url}}/validate?apiKey={{api_key}}
```

#### Validate API Key (POST)
```
Method: POST
URL: {{base_url}}/validate
Headers: Content-Type: application/json
Body (raw JSON):
{
  "apiKey": "{{api_key}}"
}
```

#### Get API Keys
```
Method: GET
URL: {{base_url}}/keys?apiKey={{api_key}}
```

## Testing Examples

### Test with Valid API Key
1. Create an API key in your dashboard
2. Copy the key value
3. Set it as the `api_key` environment variable
4. Send the request

### Test with Invalid API Key
1. Use a random string as the API key
2. You should get a 401 response with "Invalid API key"

### Test without API Key
1. Remove the `apiKey` parameter
2. You should get a 400/401 response with "API key is required"

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | MISSING_API_KEY | API key parameter is missing |
| 401 | INVALID_API_KEY | API key is invalid or inactive |
| 500 | INTERNAL_ERROR | Server error occurred |
| 500 | FETCH_ERROR | Database error occurred |

## Rate Limiting
Currently, there are no rate limits implemented. Each API call will increment the usage counter for the API key.

## Security Notes
- API keys are validated against the Supabase database
- Only active API keys are accepted
- Usage statistics are updated on each successful validation
- All responses include success/error indicators for easy parsing

## Testing Checklist
- [ ] Test with valid API key (should return 200)
- [ ] Test with invalid API key (should return 401)
- [ ] Test without API key (should return 400/401)
- [ ] Verify usage counter increments
- [ ] Check last_used timestamp updates
- [ ] Test both GET and POST methods for validation
