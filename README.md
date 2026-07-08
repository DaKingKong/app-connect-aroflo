# RingCentral App Connect AroFlo Connector

This project is a RingCentral App Connect connector server for AroFlo.

## What Is Implemented

- App Connect connector registration under connector id `AroFlo`
- Local connector manifest with AroFlo auth fields for `/crmManifest`
- API-key auth bootstrap for App Connect
- AroFlo per-request HMAC-SHA512 signing
- AroFlo credential validation through the `users` zone
- Contact lookup through the `contacts` zone
- Call logging to AroFlo `ClientNotes`
- Message logging to AroFlo `ClientNotes`
- Call/message note update when AroFlo returns an editable note id
- Contact creation under a dedicated AroFlo placeholder Client

## Configure Environment

Copy or edit `.env` and fill the blank values.

Required for local server:

```bash
APP_HOST=localhost
PORT=6066
DATABASE_URL=sqlite://./db.sqlite
IS_PROD=false
```

Required for AroFlo environment defaults:

```bash
AROFLO_BASE_URL=https://api.aroflo.com/
AROFLO_ACCEPT=text/json
AROFLO_U_ENCODED=
AROFLO_P_ENCODED=
AROFLO_ORG_ENCODED=
```

Optional AroFlo values:

```bash
AROFLO_HOST_IP=
AROFLO_NOTE_FILTER=Internal Only
AROFLO_NOTE_STICKY=false
```

`AROFLO_HOST_IP` must be the public outbound IP used for AroFlo API calls. Leave it blank unless your AroFlo API setup expects `HostIP`; the signer will only include the `HostIP` header and HMAC field when this value is set.

For new contacts, the connector first finds an AroFlo Client named `RingCentral App Connect Placeholder Client`. If it does not exist, the connector creates it, then creates the Contact under that Client.

AroFlo does not expose separate App Connect contact types in this connector. Contacts are returned and created as `Contact`; client and supplier records are different AroFlo zones, not App Connect contact type options.

## AroFlo Auth Inputs

The App Connect auth page collects one value from the client:

- `apiKey`: AroFlo API Secret Key

The connector accepts non-secret AroFlo defaults from environment variables. The API Secret Key should be submitted as `apiKey` through App Connect's API-key login flow.

## Run Locally

```bash
npm install
npm run dev
```

The server defaults to `http://localhost:6066` if `APP_HOST` or `PORT` are blank.

## Deploy To Heroku

The Heroku runtime uses:

- `Procfile` to run the web dyno with compiled JavaScript.
- `heroku-postbuild` to compile TypeScript without running the serverless packaging script.
- `tsconfig.heroku.json` to compile only runtime files and the JSON asset copier.
- `app.json` for Heroku config-var metadata and optional app creation.

Create the app and database:

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql --app your-app-name
```

Set config vars. Do not set `APP_HOST` on Heroku; the server binds to `0.0.0.0` automatically when Heroku starts a dyno.

```bash
heroku config:set \
  APP_SERVER=https://your-app-name.herokuapp.com \
  OVERRIDE_APP_SERVER=https://your-app-name.herokuapp.com \
  APP_SERVER_SECRET_KEY=replace-with-a-long-random-secret \
  IS_PROD=true \
  AROFLO_BASE_URL=https://api.aroflo.com/ \
  AROFLO_ACCEPT=text/json \
  AROFLO_U_ENCODED= \
  AROFLO_P_ENCODED= \
  AROFLO_ORG_ENCODED= \
  AROFLO_NOTE_FILTER="Internal Only" \
  AROFLO_NOTE_STICKY=false \
  --app your-app-name
```

Deploy:

```bash
git push heroku main
heroku ps:scale web=1 --app your-app-name
heroku open --app your-app-name
```

The AroFlo API Secret Key is still submitted by the client through the App Connect API-key login flow as `apiKey`; it is not a Heroku config var.

## Test

```bash
npm test
```
