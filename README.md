# Appglide Monthly Shift Roster

Dependency-free full-stack web application for automatically generating a monthly rota for 30 employees.

## Features

- 30 employee records by default; replace the placeholder names/codes in `data.json`.
- Weekdays: 1 Morning, 2 Evening, 2 Night, and all remaining available staff on General.
- Weekends and listed company holidays: 1 Morning, 1 Evening, 2 Night, with all other available staff on General.
- Two weekly non-working days for every employee in complete weeks.
- Approved leave is excluded from allocation and counts as a non-working day.
- Fairness-first allocation of Morning, Evening, Night, weekend, and holiday duties.
- Maximum three continuous night shifts; one recovery day after a 1–2-night block, two after a three-night block.
- Employee leave requests; manager/admin approval; manager/admin roster generation and validated shift changes.

## Run

```powershell
& 'C:\Users\Abinaya\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server.js
```

Open `http://localhost:3000`.

## Roles

This local starter uses a role selector in the UI so the complete workflow can be tested without infrastructure. The server also enforces the role it receives:

- `employee`: submits leave requests and views the rota.
- `manager`: generates/edits rosters and approves/rejects leave.
- `admin`: additionally manages employees through the API.

For production, replace the demo role selector with authenticated sessions (SSO or password login) and move `data.json` to a managed database.
