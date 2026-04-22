# Expense Management App

A full-stack expense category and code management tool built with Django REST Framework and React.

---

## Django Backend

### Setup & Install

```bash
cd django-api
python -m venv venv
source venv/bin/activate
pip install django djangorestframework drf-spectacular
```

### Run the App

```bash
source venv/bin/activate
python manage.py migrate
python manage.py runserver
```

API will be available at `http://localhost:8000/`

### API Docs

Once running, interactive Swagger docs are available at `http://localhost:8000/api/docs/`

To export the schema:

```bash
python manage.py spectacular --file schema.yaml
```

### Run Tests

```bash
source venv/bin/activate
python manage.py test api --verbosity=2
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories/` | List all categories |
| POST | `/categories/` | Create a category |
| PUT | `/categories/{id}/` | Update a category |
| POST | `/categories/{id}/codes/` | Add a code to a category |
| GET | `/categories/{id}/codes/` | List codes for a category |
| PUT | `/codes/{id}/` | Update a code |

---

## React Frontend

### Setup & Install

```bash
cd react-frontend
npm install
```

### Run the App

```bash
npm run dev
```

App will be available at `http://localhost:5173`

> Requests to `/api/*` are proxied to `http://localhost:8000` via the Vite config — make sure the Django server is running.

### Run Tests

```bash
npm test
```

### Regenerating API Hooks

Whenever the Django models or endpoints change, re-export the schema and regenerate the hooks:

```bash
# In django-api/
python manage.py spectacular --file schema.yaml

# In react-frontend/
npx orval
```

---

## Why Orval + React Query

### Orval

The Django REST Framework backend uses `drf-spectacular` to generate an OpenAPI schema file (`schema.yaml`). Orval reads that schema and automatically generates fully-typed TypeScript hooks, request functions, and type definitions for every endpoint.

This means we never have to hand-write fetch logic or type out request/response shapes manually. When the backend changes — a new field, a new endpoint, a renamed property — we re-export the schema and re-run Orval, and the frontend types update automatically.

Without this, every API change would require manually updating fetch calls, TypeScript interfaces, and any related logic across the frontend — a common source of bugs and drift between the frontend and backend.

### React Query

Orval supports multiple HTTP clients (plain fetch, axios, SWR, React Query). React Query was chosen here because it handles the full data-fetching lifecycle out of the box — loading states, error states, caching, background refetching, and cache invalidation — without needing to manage any of that manually with `useState` and `useEffect`.

The combination of Orval and React Query means a new endpoint on the backend becomes a ready-to-use hook on the frontend (`useCategoriesList`, `useCategoriesCreate`, etc.) with loading, error, and success states already wired up, keeping components clean and focused on rendering rather than data management.

### Why venv for Django

I decided to use venv because it keeps the project's dependencies isolated from everything else on the machine. Without it, packages install globally and different projects can end up with conflicting versions of the same library. With venv, anyone cloning the repo gets a clean, predictable environment every time.

---

## Trade-offs, Improvements & Production Considerations

### Trade-offs Made Due to Time Constraints

- **No authentication** — all endpoints are open. In a real app every endpoint would require an authenticated user.
- **SQLite over Postgres** — SQLite is fine for development but doesn't support concurrent writes well and isn't suitable for production.
- **No pagination on categories** — the list endpoint returns all categories at once. Fine for small datasets but would need pagination at scale.
- **Minimal error handling on the frontend** — errors surface as a notification but the app doesn't distinguish between a 400 validation error and a 500 server error.
- **No input debouncing or optimistic updates** — the UI waits for the server to respond before updating, which feels slow on a poor connection.
- **Tests cover the happy path more than edge cases** — given more time, more failure scenarios would be covered on both the Django and React sides.

---

### What I Would Improve for Production

- **Swap SQLite for Postgres** — better concurrency, proper constraints, and production-grade reliability.
- **Add environment-based config** — secrets, database URLs, and debug flags should come from environment variables using `python-decouple` or `django-environ`, not be hardcoded in `settings.py`.
- **CI/CD pipeline** — run Django and React tests automatically on every pull request before merging.
- **Proper logging** — replace print statements and bare exceptions with structured logging so errors are traceable in production.
- **API versioning** — prefix endpoints with `/api/v1/` so breaking changes can be introduced without affecting existing clients.
- **Rate limiting** — prevent abuse on write endpoints using `djangorestframework-simple-jwt` or a reverse proxy like nginx.
- **Frontend error boundaries** — catch unexpected React errors gracefully instead of showing a blank screen.
- **Dockerise the stack** — a `docker-compose.yml` would make local setup and deployment consistent across environments.

---

### Production Considerations

#### Authentication and Permissions

I would use JWT authentication. Each request would include a bearer token in the `Authorization` header, validated by Django on every request.

For permissions, I would introduce role-based access — for example, read-only users can list categories and codes, but only admins can create, update, or deactivate them.

#### Concurrency and Conflicting Updates

If two users update the same category at the same time, the last write wins by default, which can silently discard changes. To handle this I would implement optimistic locking using a `version` or `updated_at` field on the model. The client sends the version it last saw, and the server rejects the update with a `409 Conflict` if the version has changed since. This forces the client to re-fetch and re-apply their change on the latest data.

For high-contention scenarios, database-level row locking inside a transaction would prevent race conditions entirely.

#### Scaling to Thousands of Categories or Codes

- **Pagination** — the list endpoints would need cursor-based or page-number pagination to avoid loading thousands of records in a single query.
- **Database indexes** — add indexes on `name`, `is_active`, and the `category` foreign key on `ExpenseCode` to keep queries fast as the table grows.
- **Select related** — the category list endpoint already uses `related_name="codes"` but would need `prefetch_related("codes")` in the queryset to avoid N+1 queries when returning categories with their codes nested.
- **Caching** — frequently read, rarely changed data like category lists is a good candidate for Redis caching with Django's cache framework.
- **Search** — if filtering by code name or description becomes a requirement at scale, a proper search index (Postgres full-text search or Elasticsearch) would outperform `LIKE` queries.