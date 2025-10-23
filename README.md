# Company A CRM Dashboards (Vanilla JavaScript)

Executive dashboards for Opportunities, Sales Orders, and a Helpdesk placeholder. Built with pure ES6 modules, Chart.js, and modern CSS. Zero-build, CDN-ready, and deployable as static files.

## Quick Start

```bash
# 1) Start a static server from the project root
python3 -m http.server 8080
# or
npx serve -l 8080

# 2) Open in your browser
http://localhost:8080/index.html
```

By default the app runs in mock API mode so you can use it without any backend.

## Features

- **Opportunities Dashboard**
  - Real-time KPIs: pipeline value, average deal size, win rate
  - Interactive charts: pipeline trend, by status, by category, by assignee
  - Advanced filtering: date range, status, assignee, category
  - Sortable data table with key metrics

- **Sales Orders Dashboard**
  - Revenue KPIs: total value, average order size, fulfillment rate
  - Recent orders table and status badges
  - Auto-refresh capability

- **Helpdesk Dashboard (Placeholder)**
  - Ready for future ticket tracking and analytics

- **Technical**
  - Pure Vanilla JS (ES6 modules)
  - Chart.js for data visualization
  - CSS Grid & Flexbox, responsive, accessible
  - Error states, loading states, toast notifications, modal for email

## Architecture

- **Models (`js/models/`)**: Data fetching and transformation
- **Views (`js/views/`)**: Rendering, charts, partial updates, event binding
- **Controllers (`js/controllers/`)**: Orchestrate model↔view, handle actions, auto-refresh
- **Services (`js/services/`)**: API, Email, PDF
- **Entry (`js/app.js`)**: App bootstrapping, navigation, global actions, email modal

Data flow:

User Action → Controller → Model → API Service → Backend
      ↓
View Update ← Data Processing ← Response Handling

## Directory Structure

```
/workspace
  index.html
  CSS/styles.css
  js/
    app.js
    config.js
    controllers/
      BaseController.js
      OpportunitiesController.js
      SalesOrdersController.js
    models/
      BaseModel.js
      OpportunitiesModel.js
      SalesOrdersModel.js
    services/
      APIService.js
      EmailService.js
      PdfService.js
    views/
      BaseView.js
      OpportunitiesView.js
      SalesOrdersView.js
      HelpDeskView.js
```

## Configuration

All app config is in `js/config.js`.

- **API Base URL**
  - Default: `mock` (built-in mock API mode)
  - Set to your real API (e.g., `https://api.companya.com/v1`) to use live data

- **Feature Flags and UI**
  - Auto-refresh per-dashboard (see `DASHBOARDS[<name>].refreshInterval` and `features.realTimeUpdates`)
  - Chart animations and theme

```js
// js/config.js (excerpt)
API: {
  baseURL: 'mock', // change to 'https://api.companya.com/v1' for real backend
  endpoints: {
    opportunities: '/opportunities',
    salesOrders: '/sales-orders',
    helpdesk: '/helpdesk-tickets',
    pdf: '/pdf/generate',
    email: '/email/send'
  },
  timeout: 30000,
  retryAttempts: 3
}
```

### Mock API Mode

The app has first-class mock support in `APIService`:

- Enabled when any of the following are true:
  - `config.API.baseURL === 'mock'` (default)
  - `?mock=1` query parameter in the URL
  - `localStorage.setItem('crm_mock_mode', 'true')`
  - `file://` protocol (no server)

Mock mode returns realistic structures for:

- `GET /opportunities` (with sample opportunities and summary)
- `GET /sales-orders` (recent orders)
- `GET /helpdesk-tickets` (sample tickets)
- `GET /dashboard/summary`
- `POST /pdf/generate` (returns an id) and `GET /pdf/download/{id}` (simulated download)
- `POST /email/send` (success)

### Real API Mode

Set `API.baseURL` to your backend URL. Endpoints used:

- Data
  - `GET /opportunities`
  - `GET /sales-orders`
  - `GET /helpdesk-tickets`
  - `GET /dashboard/summary`
- Export & Email
  - `POST /pdf/generate`
  - `GET /pdf/download/{id}`
  - `POST /email/send`
- User & Auth
  - `GET /user/preferences`, `PUT /user/preferences`
  - `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`

The `APIService` implements:

- Token-based auth (stored in `localStorage`)
- Retry with exponential backoff for network/server/timeouts
- Timeout via `AbortController`
- Error normalization and classification
- Request logging and download handling

## Usage

- Switch dashboards via the top nav
- Opportunities filters (date, status, assigned to, category)
- Sort the opportunities table by clicking column headers
- Global actions (top-right): Refresh, Export PDF, Email
- Email modal persists last-used recipient to `localStorage`

## Accessibility & UX

- Keyboard-friendly and ARIA-conscious markup
- Loading, empty, and error states
- Toast notifications with auto-dismiss
- Responsive across mobile, tablet, and desktop

## Performance

- Lazy, mock-enabled data fetching
- Partial view updates in views’ `onUpdate`
- Cleanup of charts and event listeners on destroy
- Auto-refresh prevents overlapping requests

## Deployment

This is a static site. Any static host works (S3, Netlify, Vercel, GitHub Pages, Nginx).

1) Build: none (static files)
2) Upload: `index.html`, `CSS/`, `js/`
3) Ensure HTTPS and correct cache headers for assets
4) If using a real backend, configure CORS and CSP appropriately

## Local Development Tips

- Run with a simple HTTP server (see Quick Start)
- Force mock mode with `?mock=1` while testing
- Open DevTools console to see API logs and request IDs

## Troubleshooting

- Blank page: ensure you serve via HTTP(S), not `file://` (or use mock mode)
- CORS errors with real backend: configure server CORS for your origin
- PDF/Email not working: in mock mode they’re simulated; use a real backend to send real emails and generate real PDFs

## License

Proprietary – Company A. All rights reserved.

