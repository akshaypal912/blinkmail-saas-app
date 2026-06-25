# BlinkMail Pro - Professional Email Campaign Platform

A full-stack SaaS application for enterprise email campaign management and deliverability optimization.

## Overview

BlinkMail Pro is a professional email operations platform designed for managing email campaigns, contact lists, domain configuration, and monitoring email deliverability. Built for B2B enterprises and marketing teams who need reliable, scalable email infrastructure.

## Architecture

- **Frontend**: Next.js 16 (App Router) with React 19, TypeScript
- **Authentication**: Supabase Auth with email/password
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **UI Framework**: shadcn/ui with Tailwind CSS v4
- **Icons**: Lucide React
- **Backend Ready**: Structured to integrate with Python FastAPI backend, Amazon SES, SendGrid, Mailgun

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── auth/                          # Authentication pages
│   │   ├── login/page.tsx             # Login form
│   │   ├── sign-up/page.tsx           # Registration form
│   │   ├── sign-up-success/page.tsx   # Confirmation message
│   │   ├── error/page.tsx             # Error handling
│   │   └── callback/route.ts          # OAuth callback
│   ├── (dashboard)/                   # Protected dashboard routes
│   │   └── dashboard/
│   │       ├── page.tsx               # Main dashboard with metrics
│   │       ├── contacts/
│   │       │   ├── page.tsx           # Contact list
│   │       │   └── upload/page.tsx    # CSV upload
│   │       ├── campaigns/
│   │       │   ├── page.tsx           # Campaign list
│   │       │   ├── new/page.tsx       # New campaign form
│   │       │   └── [id]/page.tsx      # Campaign editor with template designer
│   │       ├── templates/page.tsx     # Email template management
│   │       ├── domains/
│   │       │   ├── page.tsx           # Domain list
│   │       │   └── add/page.tsx       # Add domain with DNS setup
│   │       ├── analytics/page.tsx     # Campaign analytics
│   │       ├── suppressions/page.tsx  # Suppression list management
│   │       └── settings/page.tsx      # Account settings
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Global styles & theme
├── components/
│   ├── ui/                            # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── sidebar.tsx                # Navigation sidebar
│   │   ├── nav.tsx                    # Top navigation bar
│   │   ├── header.tsx                 # Page headers
│   │   ├── metric-card.tsx            # KPI cards
│   │   └── recent-campaigns.tsx       # Campaign list component
│   └── email/
│       └── designer.tsx               # Visual email template designer
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase client
│   │   ├── server.ts                  # Server-side Supabase client
│   │   └── proxy.ts                   # Session proxy middleware
│   └── utils.ts                       # Utility functions (cn)
├── middleware.ts                      # Route protection middleware
└── components.json                    # shadcn/ui configuration

```

## Core Features

### Authentication & Authorization
- Email/password authentication via Supabase Auth
- Automatic profile creation on signup
- Protected routes via middleware
- Secure session management

### Contact Management
- CSV upload with parsing and validation
- Contact deduplication
- Contact status tracking (valid, bounced, etc.)
- Search and filtering
- Bulk operations support

### Campaign Builder
- Drag-and-drop campaign creation
- Contact list selection
- Send scheduling
- Subject line and sender configuration
- Campaign status tracking (draft, scheduled, sent)

### Email Template Designer
- Visual HTML editor with preview
- Pre-built templates (blank, newsletter, promotional)
- Template gallery for reuse
- Live preview in target email clients

### Domain Configuration
- SPF, DKIM, DMARC record setup guides
- Domain verification workflow
- DNS record generation
- Multi-domain support

### Deliverability Management
- Suppression list for bounces, complaints, unsubscribes
- Bounce and complaint tracking
- Sender reputation insights
- Engagement metrics (open rate, click rate)

### Analytics & Reporting
- Campaign performance dashboard
- Delivery metrics (sent, delivered, bounced)
- Engagement metrics (opened, clicked, unsubscribed)
- Historical campaign data

## Database Schema

The app uses 10 tables with Row Level Security policies:

- **profiles**: User account information
- **contacts**: Individual email addresses
- **contact_lists**: Grouped contacts for campaigns
- **campaigns**: Email campaign definitions
- **email_templates**: Reusable HTML email templates
- **campaign_recipients**: Campaign send status per contact
- **domains**: Verified sending domains with DNS records
- **suppression_list**: Bounces, complaints, unsubscribes
- **campaign_analytics**: Aggregated campaign metrics
- **list_contacts**: Junction table for contact grouping

All tables have RLS policies enforced per user_id.

## Design System

### Color Palette
- **Primary**: #0969da (Blue - GitHub inspired)
- **Secondary**: #f0f0f0 (Light gray)
- **Destructive**: #d1242f (Red)
- **Accent**: #1f6feb (Darker blue)
- **Background**: #ffffff (Light mode), #0d1117 (Dark mode)
- **Borders**: #d0d7de (Light), #30363d (Dark)

### Typography
- **Font Family**: Geist (default), Geist Mono (monospace)
- **Headings**: Bold, large sizes with text-balance
- **Body**: Regular weight, 14-16px sizes, 1.4-1.6 line-height

### Components
- Professional cards with subtle borders and hover effects
- Clean data tables with striped rows
- Status badges with semantic colors
- Smooth transitions and loading states
- Accessible form controls

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables (create `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
   ```

4. Run development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Initial Setup

1. Navigate to `/auth/sign-up` to create an account
2. Verify email address
3. Login to access the dashboard
4. Complete domain setup in Settings
5. Upload first contact list
6. Create and send your first campaign

## API Integration Points

The app is structured to easily integrate with:

### Backend Services
- **Python FastAPI**: API routes in `/api/*` proxy to FastAPI backend
- **Amazon SES**: Email sending through SendGrid/Mailgun wrapper
- **Queue System**: Celery/Redis for batch email sending
- **Webhooks**: Bounce, complaint, and delivery callbacks

### External Services
- **Domain Registrars**: DNS verification automation
- **Email Validators**: Third-party email validation services
- **Analytics**: Segment/Mixpanel for user tracking

## Security

- Row Level Security (RLS) on all user data tables
- Secure session tokens in httpOnly cookies
- Parameterized queries (via Supabase)
- Email verification for account setup
- Password hashing via Supabase Auth
- CORS protection with same-origin policy

## Performance Optimizations

- Server-side data fetching for initial page loads
- Client-side SWR for real-time updates
- Lazy loading for heavy components
- Image optimization with Next.js Image component
- CSS module scoping with Tailwind
- Code splitting via Next.js Route Handlers

## Future Enhancements

- Real-time campaign status updates via WebSockets
- Advanced segmentation and targeting
- A/B testing framework
- Content personalization engine
- Integration marketplace
- Dedicated IP support
- Advanced reporting and BI tools
- Workflow automation

## Deployment

Deploy to Vercel with one click:

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

For production:
- Set up custom domain
- Configure DNS for sending domains
- Enable WAF and DDoS protection
- Set up monitoring and alerts

## Support & Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

## License

This project is built as an internship portfolio project.

---

**BlinkMail Pro** - Professional Email Operations Made Simple
