## Backend Setup

Inside `travel-agency-api`:

```bash
pip install -r requirements.txt
py -m uvicorn main:app --reload
```

## Frontend Setup

Inside `travel-agency-app`:

```bash
npm install
npm run dev
```

## Enable Agency URLs (Windows)

Open:

```txt
C:\Windows\System32\drivers\etc\hosts
```

Add:

```txt
127.0.0.1 agenta.local
127.0.0.1 agentb.local
```

## Open the App

```txt
http://agenta.local:5173
http://agentb.local:5173
```

## Login

```txt
Email: john.doe@example.com
Password: CMPE-131@2026
```
