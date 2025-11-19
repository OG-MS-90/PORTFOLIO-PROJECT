# ESOP Master - Frontend

A modern Next.js application for managing Employee Stock Options with AI-powered financial planning.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see `/backend` directory)

### Installation

1. **Install dependencies:**

```bash
cd Frontend/esop
npm install
```

2. **Configure environment variables:**

Create a `.env.local` file in `Frontend/esop`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ESOP_BASE_CURRENCY=USD
NEXT_PUBLIC_USD_INR_RATE=83
NEXT_PUBLIC_APP_NAME="ESOP Master"
```

3. **Start the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
Frontend/esop/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── dashboard/           # Main ESOP dashboard
│   ├── esop-upload/         # CSV upload page
│   ├── analytics/           # ESOP analytics
│   ├── captable/            # Cap table view
│   ├── financial-planning/  # Financial planning form
│   │   └── results/         # Plan results page
│   ├── settings/            # User settings
│   ├── layout.tsx           # Root layout with providers
│   └── globals.css          # Global styles
│
├── components/              # React components
│   ├── ui/                  # UI components (Button, Card, etc.)
│   └── LiveFinancialPreview.tsx
│
├── contexts/                # React Context providers
│   ├── UserContext.tsx      # User authentication state
│   └── EsopDataContext.tsx  # ESOP data management
│
├── services/                # API and business logic
│   ├── financialApi.ts      # Financial planning APIs
│   ├── analytics.ts         # ESOP analytics calculations
│   ├── marketData.ts        # Stock market data
│   └── taxCalculation.ts    # Tax calculations
│
├── hooks/                   # Custom React hooks
│   └── useDebounce.ts       # Debounce hook
│
├── types/                   # TypeScript type definitions
│   └── esop.ts              # ESOP-related types
│
└── lib/                     # Utility functions
    └── utils.ts             # Helper functions
```

## 🔑 Key Features

### Authentication
- **OAuth Login**: Google and GitHub SSO
- **Session Management**: Automatic session persistence
- **Route Protection**: Protected pages redirect to login

### ESOP Management
- **CSV Upload**: Import ESOP data from CSV files
- **Dashboard**: Overview of all ESOP grants
- **Analytics**: Visualize vesting schedules and distributions
- **Cap Table**: Detailed ESOP breakdown with valuations

### Financial Planning
- **AI-Powered Plans**: Generate personalized financial strategies
- **Live Preview**: Real-time allocation recommendations
- **ESOP Integration**: Plans incorporate your ESOP data
- **Multi-Region Support**: US and India tax considerations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_ESOP_BASE_CURRENCY` | Base currency for ESOP values | `USD` |
| `NEXT_PUBLIC_USD_INR_RATE` | USD to INR exchange rate | `83` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `ESOP Master` |

### Backend Configuration

Ensure your backend is configured with:
- `FRONTEND_URL`: Set to your frontend URL (e.g., `http://localhost:3000`)
- `CORS_ORIGINS`: Include your frontend URL
- OAuth credentials (Google, GitHub)

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set root directory to `Frontend/esop`
4. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., Render URL)
   - `NEXT_PUBLIC_ESOP_BASE_CURRENCY`: `USD`
   - `NEXT_PUBLIC_USD_INR_RATE`: `83`

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🔄 Data Flow

1. **User Authentication**:
   - User clicks OAuth login → Redirected to provider
   - Provider authenticates → Redirects to backend `/auth/callback`
   - Backend creates session → Redirects to frontend `/dashboard`
   - Frontend calls `/auth/user` to get user data

2. **ESOP Data**:
   - User uploads CSV → `POST /csv/upload`
   - Data stored in MongoDB with user ID
   - Dashboard fetches via `GET /csv/data`
   - Local updates persisted in localStorage

3. **Financial Planning**:
   - User fills form → Live preview via `/financial/preview`
   - Submit generates plan via `/financial/generate-plan`
   - Plan stored in localStorage and displayed

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running on the correct port
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is configured in backend

### "Authentication not working"
- Verify OAuth credentials in backend
- Check `FRONTEND_URL` in backend `.env`
- Ensure cookies are enabled in browser

### "CSV upload fails"
- Check CSV format matches requirements
- Verify file size < backend limit
- Ensure user is authenticated

## 📝 CSV Format

Your ESOP CSV should include these columns:

**Required:**
- `ticker`: Stock symbol
- `company`: Company name
- `grantDate`: Grant date (YYYY-MM-DD)
- `vestingStartDate`: Vesting start (YYYY-MM-DD)
- `vestingEndDate`: Vesting end (YYYY-MM-DD)
- `quantity`: Number of shares/options
- `strikePrice`: Strike price per share

**Optional:**
- `status`: Grant status (Vested, Unvested, Exercised, Sold)
- `grantType`: Type of grant (ISO, NSO, RSU, etc.)
- `fmv`: Fair market value

## 🤝 Contributing

1. Make sure backend is running
2. Create feature branch
3. Test changes locally
4. Submit pull request

## 📄 License

Proprietary - All rights reserved

---

**Project made by Mrunal Sanghi**
