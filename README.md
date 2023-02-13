# Running the app

## Change frontend url for CORS
server.js
```js
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
```

## Rename .env_sample to .env
DB_URI=mongodb_connection_string  
RESTRICTED=false &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; true prevents account creation

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run devStart
```
