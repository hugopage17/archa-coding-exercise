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

Or for a single run without watch mode:

```bash
npx vitest run
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