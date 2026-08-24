<div align="center">

# 🛡️ Ralia Admin

### The operations console — the human quality gate between promoters and clients.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)

![Port](https://img.shields.io/badge/dev_port-6200-E11D48?style=flat-square)

</div>

---

Everything a client sees passes through here first. Admins approve campaigns, **verify proof**,
run payouts, manage promoter capabilities, and reconcile the ledger. Money- and score-affecting
actions are gated by capability (RBAC) and every one writes an audit row.

## 🔎 What flows across the desk

```mermaid
flowchart TB
    subgraph Queues["📥 Review queues"]
      Q1[New campaigns]
      Q2[Proof submissions]
      Q3[Withdrawals]
      Q4[New promoters]
    end

    Q1 -->|approve / reject| Live[Campaign goes LIVE]
    Q2 -->|verify views| Pay[💸 Pro-rata payout from escrow]
    Q2 -->|reject + reason| Redo[↩️ Promoter resubmits]
    Q3 -->|record payout| Paid[Withdrawal paid]
    Q4 -->|confirm capability| Active[Promoter ACTIVE]

    classDef pay fill:#dcfce7,stroke:#16a34a,color:#14532d;
    class Pay,Paid pay;
```

## 🧾 Proof review

```mermaid
sequenceDiagram
    participant P as Promoter
    participant Q as Review queue
    participant Adm as Admin
    participant L as Ledger
    participant C as Client

    P->>Q: Submit proof (Day X of N)
    Adm->>Q: Open card · verify view count
    alt meets threshold
      Adm->>L: Approve → pay pro-rata (per slot)
      L->>C: Surface as "verified delivery"
    else below threshold
      Adm->>P: Reject with reason → resubmit
    end
```

- **Campaign Submissions tab** is now full history — an *Awaiting review* lane and a *Reviewed*
  lane, so approved/rejected proof stays visible (with verdict, amount paid, and reason) instead of
  vanishing from the queue.
- Proof screenshots render straight from the API's file route (`/v1/files/:id`).

## 🔐 Capabilities (RBAC)

| Capability | Guards |
|---|---|
| `REVIEW_EVIDENCE` | approving campaigns, reviewing proof, verifying channels |
| `RECORD_MONEY` | funding campaigns, paying withdrawals, editing platform rules |

## 🚀 Quickstart

```bash
npm install
cp .env.example .env     # set API_ORIGIN (defaults to http://localhost:6100)
npm run dev              # http://localhost:6200
```

Seeded login: `admin@ralia.test` · password `Password123!`

<details>
<summary><b>🔐 Environment</b></summary>

| Variable | Purpose |
|---|---|
| `API_ORIGIN` | The API origin the Next server proxies `/v1` + `/r` to |
| `NODE_ENV` | `production` in deploys |
</details>

<details>
<summary><b>🛠️ Scripts</b></summary>

| Script | Does |
|---|---|
| `dev` | dev server on :6200 |
| `build` | production build |
| `start:prod` | `node server.js` (Hostinger hPanel) |
| `typecheck` | `tsc --noEmit` |
</details>

## 🚢 Deployment

Deploys to **Hostinger hPanel** (Node.js app) via the bundled `server.js`. See `DEPLOY.md`.

---

<div align="center">
<sub>Part of Ralia · <a href="../ralia-api">API</a> · <a href="../ralia-client">Client</a> · <a href="../ralia-promoter">Promoter</a></sub>
</div>
