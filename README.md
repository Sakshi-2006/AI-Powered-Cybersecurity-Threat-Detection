# AI-Powered Cybersecurity Threat Detection

A modern cybersecurity monitoring dashboard for detecting, analyzing, and responding to digital threats in real time. This project combines a React + TypeScript frontend with Supabase-powered data access to provide a security operations workflow for monitoring alerts, tracking active threats, and simulating attack scenarios.

Live demo: https://ai-cybersecurity-thr-rngo.bolt.host

## Overview

AI-Powered Cybersecurity Threat Detection is designed to help security teams centralize threat visibility and incident response. The application includes multiple operational views for:

- threat monitoring
- alert management
- analytics and trend review
- attack simulation
- command-center style oversight

The interface is built for a fast, security-focused workflow and uses a dark dashboard theme optimized for operational monitoring.

## Features

- Real-time dashboard for security operations
- Active threat and alert tracking
- Threat detection and prioritization workflow
- Security analytics and insight views
- Attack simulation environment
- Supabase integration for backend data queries
- Responsive UI built with React and TypeScript
- Modern front-end workflow using Vite and Tailwind CSS

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase JavaScript client
- ESLint

## Project Structure

```text
.
├── src/
│   ├── components/
│   ├── lib/
│   ├── views/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .gitignore
├── README.md
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A Supabase project for full application data integration

### Installation

Clone the repository:

```bash
git clone https://github.com/Sakshi-2006/AI-Powered-Cybersecurity-Threat-Detection.git
cd AI-Powered-Cybersecurity-Threat-Detection
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory and add the required Supabase configuration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add any additional environment variables required by your setup.

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds the project for production.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint checks.

```bash
npm run typecheck
```

Runs TypeScript type checking without producing build artifacts.

## Application Views

### Dashboard

Provides an overview of the current security state and operational metrics.

### Threat Detection

Displays active threat events and suspicious behavior indicators for review.

### Alert Management

Supports alert triage and operational workflows for incident handling.

### Security Analytics

Shows trends, distributions, and patterns across security-related events.

### Attack Simulation

Includes a simulation interface for evaluating detection capabilities and attack scenarios.

## Deployment

This project is ready for deployment to hosting services that support Vite applications, such as:

- Vercel
- Netlify
- Bolt
- other static hosting platforms

For production deployment, run:

```bash
npm run build
```

Then publish the generated `dist` folder.

## Security Note

This project is intended for demonstration and security operations workflows. Use secure environment configuration for all API keys, credentials, and production data.

## License

This repository does not currently include a license file. If you plan to distribute or publish it publicly, consider adding an open-source license such as MIT.

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request with a clear description.

## Contact

For questions or feedback, open an issue in the repository or contact the maintainer through the associated GitHub profile.
