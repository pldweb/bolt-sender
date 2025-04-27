# WhatsApp API Gateway

A multi-number WhatsApp API Gateway built with Baileys.

## Features

- Multi-number support
- Session management
- QR code generation
- Message sending
- Status monitoring
- Session deletion

## API Endpoints

### Create Session
```http
POST /api/session/create/:sessionId
```

### Delete Session
```http
DELETE /api/session/:sessionId
```

### Get Session Status
```http
GET /api/session/:sessionId
```

### Get All Sessions
```http
GET /api/sessions
```

### Send Message
```http
POST /api/send/:sessionId
```
Request body:
```json
{
  "to": "6281234567890",
  "message": "Hello World!"
}
```

## Installation


1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

   ```bash
   npm install express cors qrcode-terminal pino qrcode @whiskeysockets/baileys @hapi/boom vite
   ```

3. Create `.env` file and set your configuration
4. Run the server:
   ```bash
   npm run dev
   ```

## Testing with Postman

1. Create a new session:
   - Method: POST
   - URL: `http://localhost:2025/api/session/create/session1`

2. Monitor session status:
   - Method: GET
   - URL: `http://localhost:2025/api/session/session1`
   - Scan QR code when provided

3. Send a message:
   - Method: POST
   - URL: `http://localhost:2025/api/send/session1`
   - Body (JSON):
     ```json
     {
       "to": "6281234567890",
       "message": "Test message"
     }
     ```

4. Delete session:
   - Method: DELETE
   - URL: `http://localhost:2025/api/session/session1`


# Authentication
POST /auth/register
```json
{
"username": "user1",
"email": "user1@example.com",
"password": "password123"
}
```

POST /auth/login
```json
{
"email": "user1@example.com",
"password": "password123"
}
```


GET /auth/profile
```json
Pilih Authorization 
Pilih Bearer Token
Masukkan token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBib2x0c2VuZGVyLml0IiwiaWF0IjoxNzM4NTc4ODY3LCJleHAiOjE3Mzg2NjUyNjd9.yq_xQb32e2miUz-VcDUVKDwHCjjERZ1wP4WoNYPFWaw
```

# WhatsApp API (requires API key in header: X-API-Key)
POST /api/v1/session/create
```json
{
"sessionName": "session1"
}
```
GET /api/v1/session/:sessionName

POST /api/v1/send/:sessionName
```json
{
"to": "6281234567890",
"message": "Hello"
}
```


DELETE /api/v1/session/:sessionName
