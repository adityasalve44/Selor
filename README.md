# Selor Barber Management System

Selor is a modern, responsive Barber Management System built with Next.js (App Router), Tailwind CSS v4, and Zustand. It provides a comprehensive suite of tools for barbershop administration and client booking, featuring a premium design aligned with Material Design 3 guidelines.

## Features

- **Dark Mode Support**: Global theme toggling utilizing CSS variables and Tailwind's dark mode strategies.
- **Unified Navigation**: Centralized layout wrappers (`AdminNav`, `CustomerNav`) ensuring consistent user experience across the app.
- **Responsive Layout**: Fully optimized for mobile, tablet, and desktop viewports, with horizontal scroll support for large data tables.
- **Localization**: Implements Indian Standard Time (IST) and `DD-MM-YYYY` date formats, along with Indian Rupee (₹) currency symbols throughout.
- **State Management**: Zustand for global state.

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- Zustand
- Material Symbols Outlined

## Project Structure

- `/app/admin`: Administrative dashboard, booking management, staff schedules, inventory tracking, and client records.
- `/app/book`: Client-facing booking flow (service selection, time selection, and confirmation).
- `/app/dashboard`: Client dashboard tracking upcoming appointments and loyalty tier progress.
- `/app/components`: Reusable UI components (e.g., `ThemeProvider`, `AdminNav`, `CustomerNav`).
- `/app/globals.css`: Core design system, containing CSS variables for colors, spacing, and typography.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Design System

The application utilizes a rich design system focusing on:
- HSL-tailored color palettes supporting both light and dark modes.
- Modern typography via `next/font` (Geist / Manrope).
- Glassmorphism effects and dynamic animations.
- Material Design 3 standards for layout and component structure.

## Important Note

For any timezone-related logic, please refer to and use the utilities in `lib/time.ts` to ensure consistency.

## License

MIT
