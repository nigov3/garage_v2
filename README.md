# GARAGE

Clean MVP foundation for the GARAGE automotive super-app.

## What is inside
- React + Vite app, one canonical implementation.
- Expenses as the first vertical slice.
- Car profile and mileage as the central entity.
- Calculated component resource: 100% after replacement, then decay by mileage and/or time.
- Local persistence via Zustand/localStorage.
- Expense history updates the car mileage automatically.
- Resource replacement event resets the component resource to 100%.
- Mobile-friendly bottom navigation.
- No committed `node_modules`, `dist`, archives or dev logs.

## Run
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

## Product direction
The architecture is intentionally centered on the car and its history. Future modules such as fuel stations, parts price aggregation, documents, insurance, fines, service stations and trips should be added as new event/data types connected to the same car history rather than as isolated mini-apps.

The health/resource indicator is explicitly a calculated estimate, not vehicle diagnostics.
