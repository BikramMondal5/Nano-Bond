# MongoDB Atlas & Google OAuth Setup Guide

## ✅ What's Been Implemented

Your GovtBond application now has:
- ✅ MongoDB Atlas integration
- ✅ Google OAuth authentication
- ✅ Email/Password authentication
- ✅ User registration with password hashing
- ✅ Session management with NextAuth v5
- ✅ Protected routes middleware
- ✅ User model with portfolio tracking
- ✅ Complete authentication flow

## 🔧 Setup Instructions

### 1. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Try Free" and create an account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set "Database User Privileges" to "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual database user password
   - Add your database name before the `?` (e.g., `mongodb+srv://...mongodb.net/govtbond?retryWrites=true`)

### 2. Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "GovtBond" or similar
   - Click "Create"

3. **Enable Google+ API**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Click "Create"
   - Fill in required fields:
     - App name: "GovtBond"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add test users (your email)
   - Click "Save and Continue"

5. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Name it "GovtBond Web Client"
   - Add Authorized JavaScript origins:
     - `http://localhost:3000`
     - Your production URL (when deployed)
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - Your production URL + `/api/auth/callback/google`
   - Click "Create"
   - **Copy the Client ID and Client Secret** (you'll need these!)

### 3. Environment Variables Setup

Update your `.env.local` file with the actual values:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/govtbond?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**To generate NEXTAUTH_SECRET:**
Run in terminal:
```bash
openssl rand -base64 32
```
Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 4. Test Your Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Registration**
   - Go to `http://localhost:3000/sign-up`
   - Fill in the form and create an account
   - You should be redirected to portfolio page

3. **Test Login**
   - Go to `http://localhost:3000/login`
   - Login with your credentials
   - Should redirect to portfolio page

4. **Test Google OAuth**
   - Click "Continue with Google" on login/signup
   - Complete Google authentication
   - Should create account and redirect to portfolio

5. **Verify Database**
   - Go to MongoDB Atlas dashboard
   - Click "Browse Collections"
   - You should see a "users" collection with your user data

## 🎯 Features Included

### Authentication
- ✅ Email/Password registration with bcrypt hashing
- ✅ Google OAuth sign-in
- ✅ Session management with JWT
- ✅ Protected routes with middleware
- ✅ Automatic redirect after login/signup

### User Model
- ✅ Email, name, password fields
- ✅ Google OAuth integration
- ✅ Wallet address support (for future crypto integration)
- ✅ Portfolio tracking with bonds array
- ✅ Total invested and current value tracking
- ✅ Timestamps (createdAt, updatedAt)

### Security
- ✅ Password hashing with bcryptjs (12 salt rounds)
- ✅ JWT-based sessions
- ✅ Protected API routes
- ✅ CSRF protection (built into NextAuth)
- ✅ Route protection middleware

## 📁 File Structure Created

```
├── .env.local                           # Environment variables
├── middleware.ts                        # Route protection
├── types/
│   └── next-auth.d.ts                  # TypeScript types for NextAuth
├── lib/
│   ├── mongodb.ts                       # MongoDB connection
│   ├── auth.ts                          # NextAuth configuration
│   └── models/
│       └── User.ts                      # User mongoose model
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts            # NextAuth API route
│   │       └── register/
│   │           └── route.ts            # Registration API
│   ├── login/
│   │   └── page.tsx                    # Updated with real auth
│   └── sign-up/
│       └── page.tsx                    # Updated with real auth
└── components/
    └── auth-provider.tsx               # Updated with NextAuth integration
```

## 🔐 Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- Never commit `.env.local` to git (it's in .gitignore)
- For production, update authorized URLs in Google Console
- For production, restrict MongoDB network access to specific IPs
- Always use HTTPS in production

## 🚀 Next Steps

1. Test all authentication flows
2. Customize user profile fields as needed
3. Add email verification (optional)
4. Add password reset functionality (optional)
5. Integrate MetaMask wallet connection (if needed)
6. Add portfolio management features
7. Deploy to production and update OAuth redirect URLs

## 💡 API Usage Examples

### Check if user is authenticated (client-side)
```typescript
import { useAuth } from "@/components/auth-provider"

const { user, isLoading } = useAuth()

if (isLoading) return <div>Loading...</div>
if (!user) return <div>Please login</div>
```

### Get session on server-side
```typescript
import { auth } from "@/lib/auth"

export default async function Page() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return <div>Welcome {session.user.name}</div>
}
```

### Update user portfolio (example API route)
```typescript
// app/api/portfolio/update/route.ts
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  await connectDB()
  const user = await User.findById(session.user.id)
  
  // Update portfolio...
  
  return NextResponse.json({ success: true })
}
```

## 🆘 Troubleshooting

### Common Issues

1. **"Error connecting to MongoDB"**
   - Check your connection string format
   - Verify password doesn't contain special characters (URL encode if needed)
   - Ensure IP is whitelisted in MongoDB Network Access

2. **"Google OAuth redirect mismatch"**
   - Verify redirect URI exactly matches: `http://localhost:3000/api/auth/callback/google`
   - Check authorized origins include: `http://localhost:3000`

3. **"Invalid client ID or secret"**
   - Double-check `.env.local` values
   - Ensure no extra spaces in environment variables
   - Restart dev server after changing env vars

4. **"Session not persisting"**
   - Verify NEXTAUTH_SECRET is set
   - Clear browser cookies and try again
   - Check NEXTAUTH_URL matches your current URL

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB cluster is running
5. Verify Google OAuth credentials are correct

---

**Setup complete! 🎉 Your authentication system is ready to use.**
