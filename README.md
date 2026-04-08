# StakeFlow — Crypto P2P Betting Platform

Plataforma de apuestas P2P con criptomonedas. Los usuarios crean apuestas binarias personalizadas, cada participante apuesta la misma cantidad, y los ganadores se llevan el 90% del pozo (10% comisión de la casa).

## Stack

- **Frontend**: Angular 18 (standalone, signals, lazy loading)
- **Backend**: Azure Functions .NET 8 (isolated worker)
- **Database**: Cosmos DB (emulador local)
- **Crypto**: ETH, WBTC, USDT (Ethereum Sepolia) + BNB (BSC Testnet)

## Requisitos

- Node.js 18+
- .NET 8 SDK
- [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator) o [Azure Storage Emulator / Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)

## Setup

### Backend

```bash
cd StakeFlow.Api
# Configurar Cosmos DB emulator (debe estar corriendo en localhost:8081)
dotnet build
func start
```

El API estará en `http://localhost:7071/api`.

### Frontend

```bash
cd stakeflow-web
npm install
ng serve
```

La app estará en `http://localhost:4200`.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Registro de usuario |
| POST | /api/auth/login | Login (retorna JWT) |
| GET | /api/auth/me | Perfil del usuario autenticado |
| GET | /api/wallets | Balances de wallets |
| POST | /api/wallets/deposit | Depositar (testnet) |
| POST | /api/wallets/withdraw | Retirar fondos |
| GET | /api/wallets/transactions | Historial de transacciones |
| POST | /api/bets | Crear apuesta |
| GET | /api/bets | Listar apuestas abiertas |
| GET | /api/bets/{id} | Detalle de apuesta |
| GET | /api/bets/my | Mis apuestas |
| POST | /api/bets/{id}/join | Unirse a apuesta |
| POST | /api/bets/{id}/resolve | Reportar resultado |

## Flujo de Apuesta

1. **Crear**: Usuario A crea apuesta (título, opciones A/B, monto, moneda). Fondos congelados.
2. **Unirse**: Usuario B se une eligiendo la opción contraria. Mismos fondos congelados.
3. **Resolver**: Ambos reportan quién ganó.
   - **Consenso**: Ganador recibe 90% del pozo total (10% para la casa).
   - **Sin consenso (48h)**: La casa se queda el 50% del pozo. El 50% restante se devuelve.
4. **Expirar**: Si nadie se une antes de la expiración, fondos devueltos al creador.

## Monedas Soportadas

| Moneda | Red | Tipo |
|--------|-----|------|
| ETH | Ethereum Sepolia | Nativo |
| WBTC | Ethereum Sepolia | ERC-20 |
| USDT | Ethereum Sepolia | ERC-20 |
| BNB | BSC Testnet | Nativo |
First commit