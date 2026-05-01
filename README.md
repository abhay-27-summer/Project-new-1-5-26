# Tasklane — Team Task Manager

A full-stack team task manager with project/team management, role-based access control, and a kanban-style board.

> **Live demo:** _(replace with your Railway URL)_
> **Demo video:** _(replace with your video link)_

---

## ✨ Features

- **Authentication** — email + password signup/login, JWT-based, secure password hashing (bcrypt)
- **Projects & Teams** — create projects, invite members, assign per-project roles
- **Role-Based Access Control (RBAC)** — per-project Admin / Member / Owner roles enforced server-side
- **Tasks** — create, assign, set priority/due dates, track status across `to do → in progress → done`
- **Kanban board** — visualize project tasks by status, with progress bar
- **Dashboard** — at-a-glance view of your projects, assigned tasks, and overdue items
- **Validation** — request validation with zod on the server, react-hook-form on the client
- **Deployed on Railway** with MongoDB Atlas

---

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Backend | Node.js 20, Express, Mongoose |
| Database | MongoDB (Atlas in production) |
| Auth | JWT (Authorization header), bcryptjs |
| Validation | zod |
| Security | helmet, cors, express-rate-limit |
| Frontend | React 18, Vite, React Router v6 |
| State | TanStack Query (server state), React Context (auth) |
| Forms | react-hook-form |
| Styling | TailwindCSS, Fraunces + Geist fonts |
| Deployment | Railway (single service serving API + SPA build) |

---

## 📂 Project Structure

```
team-task-manager/
├── server/              # Express API
│   ├── src/
│   │   ├── config/      # MongoDB connection
│   │   ├── models/      # User, Project, Task (Mongoose)
│   │   ├── middleware/  # auth, rbac, validate, errorHandler
│   │   ├── validators/  # zod schemas
│   │   ├── controllers/ # route handlers
│   │   ├── routes/      # Express routers
│   │   ├── utils/
│   │   └── server.js    # entry point
│   └── package.json
├── client/              # React SPA
│   ├── src/
│   │   ├── api/         # axios client + interceptors
│   │   ├── context/     # AuthContext
│   │   ├── components/  # Navbar, KanbanBoard, TaskCard, MembersPanel, AddTaskModal, ProtectedRoute
│   │   ├── pages/       # Login, Signup, Dashboard, Projects, ProjectDetail, NewProject
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── package.json         # root build/start scripts
├── .env.example
└── README.md
```

---

## 🔐 RBAC Model (key feature)

Roles are **per-project**, not global. There are three effective levels:

| Role | Granted to | Can |
|---|---|---|
| **Owner** | Project creator (one per project) | Everything an admin can, plus delete the project. Cannot be removed or demoted. |
| **Admin** | Promoted by an admin | Edit project details, add/remove members, change roles, create/edit/delete any task. |
| **Member** | Default for new joiners | View the project, create tasks, update status on tasks they own or are assigned to. Cannot edit task details or manage members. |

### How it's enforced

The middleware in [`server/src/middleware/rbac.js`](server/src/middleware/rbac.js) handles all access checks:

- **`loadProject`** — resolves `:id` / `:projectId` from the URL, fetches the project, verifies the requester is a member, and attaches `req.project` + `req.projectRole`. Returns `403` if not a member.
- **`requireProjectRole('admin')`** — requires `req.projectRole === 'admin'`. Stacked after `loadProject` on routes that mutate project state.
- **`requireProjectOwner`** — used only on `DELETE /projects/:id`.
- **`loadTask`** — for `/api/tasks/:id` routes; loads the task, derives the parent project, runs the same membership check.

Task-level rules in `taskController.updateTask`:

- **Admins** may edit any field on any task.
- **Members** may only change `status`, and only on tasks they're assigned to or created.
- Editing `title / description / assignee / dueDate / priority` always requires admin role.
- Deleting a task requires admin role **or** being the original creator.

This keeps the UI honest — the frontend hides admin-only controls based on `myRole`, but the server is the source of truth.

---

## 🌐 API Reference

All routes under `/api`. Authenticated routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Create account, returns `{ user, token }` |
| POST | `/auth/login` | — | Returns `{ user, token }` |
| GET  | `/auth/me` | ✓ | Returns current user |
| POST | `/auth/logout` | — | No-op (client-side token removal) |

### Projects
| Method | Path | Auth | RBAC |
|---|---|---|---|
| GET    | `/projects` | ✓ | List my projects |
| POST   | `/projects` | ✓ | Any user can create |
| GET    | `/projects/:id` | ✓ | Member |
| PATCH  | `/projects/:id` | ✓ | **Admin** |
| DELETE | `/projects/:id` | ✓ | **Owner** |
| POST   | `/projects/:id/members` | ✓ | **Admin** |
| PATCH  | `/projects/:id/members/:userId` | ✓ | **Admin** |
| DELETE | `/projects/:id/members/:userId` | ✓ | **Admin** |

### Tasks
| Method | Path | Auth | RBAC |
|---|---|---|---|
| GET    | `/projects/:projectId/tasks?status=&assignee=` | ✓ | Member |
| POST   | `/projects/:projectId/tasks` | ✓ | Member |
| GET    | `/tasks/:id` | ✓ | Member |
| PATCH  | `/tasks/:id` | ✓ | See task rules above |
| DELETE | `/tasks/:id` | ✓ | Admin or creator |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Aggregated stats for current user |
| GET | `/users/search?q=` | User autocomplete for adding members |
| GET | `/health` | Health check |

---

## 🛠 Local Development

### Prerequisites
- Node.js 20+
- A MongoDB connection string (local Mongo or [Atlas free tier](https://www.mongodb.com/cloud/atlas/register))

### Setup

```bash
# 1. Clone and enter the repo
git clone <your-repo-url>
cd team-task-manager

# 2. Install everything
npm run install:all

# 3. Configure environment
cp .env.example .env
# Then edit .env and set MONGODB_URI and JWT_SECRET
```

Place the `.env` file at the project root (the server reads it via dotenv).

### Run

```bash
# Run server + client concurrently
npm run dev

# Or separately:
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

Vite proxies `/api/*` to the server at port 5000, so you can develop both sides from `http://localhost:5173`.

---

## 🚀 Deploying to Railway

This project is structured to run as a **single Railway service** that builds the client and serves it from Express in production.

### 1. Create a MongoDB Atlas database
- Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register)
- Create a free M0 cluster
- Add a database user (Database Access)
- Allow access from anywhere (Network Access → Add IP → `0.0.0.0/0`) — required for Railway
- Copy the connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/tasklane`)

### 2. Push your code to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. Deploy on Railway
- Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
- Select your repository
- Railway will auto-detect Node.js. The included `package.json` provides:
  - **Build:** `npm run build` (installs both packages and builds the client)
  - **Start:** `npm start` (runs `node server/src/server.js`)

### 4. Set environment variables in Railway
In your service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 64`) |
| `JWT_EXPIRES_IN` | `7d` |

Railway provides `PORT` automatically.

### 5. Generate a public domain
- Service → **Settings** → **Networking** → **Generate Domain**
- Visit the URL — you should see the login page.

### 6. Smoke test
- Sign up a user
- Create a project
- Add a task
- (Optional) Create a second user, add them as a member, log in as them and verify member permissions.

---

## ✅ What to test in the demo video

1. **Auth** — sign up two users (Alice and Bob)
2. **Projects** — Alice creates a project. She's automatically the owner.
3. **Members** — Alice adds Bob as a Member.
4. **Tasks** — Alice creates a few tasks, assigns one to Bob.
5. **RBAC** — log in as Bob:
   - He can see the project
   - He can change status on his task ✓
   - He **cannot** edit the title (Admin-only) — show the 403 or hidden UI
   - He **cannot** add other members
6. **Promote** — Alice promotes Bob to Admin. Bob now sees admin controls.
7. **Dashboard** — show overdue task highlighting.

---

## 🧠 Implementation Notes

- **JWT in localStorage + Authorization header.** Simpler than httpOnly cookies for a demo deploy (no SameSite/CORS gymnastics). For production, cookies would be preferred.
- **Members embedded on the Project document** instead of a separate Membership collection. Simpler queries, fine at this scale.
- **Owner counts as admin** — implemented in `Project.roleOf()`.
- **Cascading deletes** — deleting a project deletes its tasks; removing a member unassigns their tasks.
- **Validation** runs both client-side (react-hook-form) and server-side (zod) — the server is always the source of truth.

---

## 📝 License

MIT

