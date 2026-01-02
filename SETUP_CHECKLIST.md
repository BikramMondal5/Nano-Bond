# 🎯 Authentication Setup Checklist

## Pre-Setup (5 min)
- [ ] Read SETUP_GUIDE.md
- [ ] Read AUTHENTICATION_SUMMARY.md
- [ ] Have a Google account ready
- [ ] Have terminal/command prompt open

## Step 1: Generate NextAuth Secret (1 min)
- [ ] Open terminal
- [ ] Run: `openssl rand -base64 32`
  - **Windows:** Use Git Bash or run: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] Copy the output
- [ ] Paste into `.env.local` as `NEXTAUTH_SECRET`

## Step 2: MongoDB Atlas Setup (5-7 min)
- [ ] Go to https://www.mongodb.com/cloud/atlas
- [ ] Click "Try Free" and create account
- [ ] Create a new project named "GovtBond"
- [ ] Click "Build a Database"
- [ ] Select FREE tier (M0)
- [ ] Choose cloud provider and region
- [ ] Click "Create Cluster" (wait 1-3 minutes)

### Database Access
- [ ] Go to "Database Access" (left sidebar)
- [ ] Click "Add New Database User"
- [ ] Create username and strong password (save these!)
- [ ] Set privileges to "Read and write to any database"
- [ ] Click "Add User"

### Network Access
- [ ] Go to "Network Access" (left sidebar)
- [ ] Click "Add IP Address"
- [ ] Click "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Click "Confirm"

### Get Connection String
- [ ] Go to "Database" (left sidebar)
- [ ] Click "Connect" button on your cluster
- [ ] Choose "Connect your application"
- [ ] Select "Node.js" driver
- [ ] Copy the connection string
- [ ] Replace `<password>` with your actual password
- [ ] Add database name: `mongodb+srv://...mongodb.net/govtbond?retryWrites=true`
- [ ] Paste into `.env.local` as `MONGODB_URI`

## Step 3: Google OAuth Setup (7-10 min)
- [ ] Go to https://console.cloud.google.com
- [ ] Sign in with Google account

### Create Project
- [ ] Click project dropdown (top left)
- [ ] Click "New Project"
- [ ] Name: "GovtBond"
- [ ] Click "Create"
- [ ] Wait for project creation
- [ ] Select the new project

### Enable Google+ API
- [ ] Go to "APIs & Services" > "Library"
- [ ] Search for "Google+ API"
- [ ] Click on it
- [ ] Click "Enable"

### OAuth Consent Screen
- [ ] Go to "APIs & Services" > "OAuth consent screen"
- [ ] Select "External" user type
- [ ] Click "Create"
- [ ] Fill in required fields:
  - [ ] App name: "GovtBond"
  - [ ] User support email: (your email)
  - [ ] Developer contact: (your email)
- [ ] Click "Save and Continue"
- [ ] Skip Scopes (click "Save and Continue")
- [ ] Add test users:
  - [ ] Add your email address
  - [ ] Click "Add"
- [ ] Click "Save and Continue"
- [ ] Review and click "Back to Dashboard"

### Create Credentials
- [ ] Go to "APIs & Services" > "Credentials"
- [ ] Click "Create Credentials" > "OAuth client ID"
- [ ] Application type: "Web application"
- [ ] Name: "GovtBond Web Client"
- [ ] Authorized JavaScript origins:
  - [ ] Add: `http://localhost:3000`
- [ ] Authorized redirect URIs:
  - [ ] Add: `http://localhost:3000/api/auth/callback/google`
- [ ] Click "Create"
- [ ] **COPY Client ID** - paste into `.env.local` as `GOOGLE_CLIENT_ID`
- [ ] **COPY Client Secret** - paste into `.env.local` as `GOOGLE_CLIENT_SECRET`
- [ ] Click "OK"

## Step 4: Verify .env.local (2 min)
Open `.env.local` and verify all values are set:
- [ ] `MONGODB_URI` - starts with `mongodb+srv://`
- [ ] `NEXTAUTH_URL` - should be `http://localhost:3000`
- [ ] `NEXTAUTH_SECRET` - should be a long random string
- [ ] `GOOGLE_CLIENT_ID` - ends with `.apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_SECRET` - should be a random string

## Step 5: Test Authentication (5 min)
- [ ] **Restart dev server** (important!)
  ```bash
  # Stop current server (Ctrl+C)
  npm run dev
  ```
- [ ] Wait for server to start
- [ ] Open browser to http://localhost:3000

### Test Sign Up
- [ ] Go to http://localhost:3000/sign-up
- [ ] Fill in the form:
  - [ ] First Name
  - [ ] Last Name
  - [ ] Email
  - [ ] Password (8+ characters)
- [ ] Click "Start Investing"
- [ ] Should redirect to /portfolio
- [ ] Check if your name appears in navbar

### Test Login
- [ ] Click logout (if logged in)
- [ ] Go to http://localhost:3000/login
- [ ] Enter your email and password
- [ ] Click "Sign In to Portfolio"
- [ ] Should redirect to /portfolio

### Test Google OAuth
- [ ] Logout
- [ ] Go to http://localhost:3000/login
- [ ] Click "Continue with Google"
- [ ] Select your Google account
- [ ] Grant permissions
- [ ] Should redirect to /portfolio
- [ ] Check navbar shows your Google name

### Verify Database
- [ ] Go back to MongoDB Atlas
- [ ] Click "Browse Collections"
- [ ] You should see database "govtbond"
- [ ] You should see collection "users"
- [ ] You should see your user document(s)

## Step 6: Verify Protected Routes (2 min)
- [ ] While logged OUT, try to access:
  - [ ] http://localhost:3000/portfolio
  - [ ] Should redirect to /login
- [ ] Log in
- [ ] Try accessing the same URL
  - [ ] Should now work

## 🎉 Success Criteria
✅ All environment variables are set
✅ Can register new user with email/password
✅ Can login with email/password
✅ Can login with Google OAuth
✅ User data appears in MongoDB Atlas
✅ Protected routes redirect when not logged in
✅ Protected routes work when logged in
✅ User name/email displays in navbar
✅ Logout works correctly

## ⚠️ Common Issues

### Issue: "Error connecting to MongoDB"
- [ ] Check connection string has no spaces
- [ ] Verify password is correct (no `<` `>` brackets)
- [ ] URL encode special characters in password
- [ ] Ensure IP 0.0.0.0/0 is in Network Access
- [ ] Restart dev server

### Issue: "Google OAuth redirect error"
- [ ] Verify redirect URI exactly: `http://localhost:3000/api/auth/callback/google`
- [ ] Check authorized origins include: `http://localhost:3000`
- [ ] No trailing slashes in URLs
- [ ] Restart dev server

### Issue: "Invalid client ID or secret"
- [ ] Double check .env.local values
- [ ] No extra spaces or quotes in .env.local
- [ ] Client ID should end with `.apps.googleusercontent.com`
- [ ] Restart dev server after changing env vars

### Issue: "Session not persisting"
- [ ] Ensure NEXTAUTH_SECRET is set
- [ ] Clear browser cookies
- [ ] Try incognito/private window
- [ ] Restart dev server

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Review SETUP_GUIDE.md for detailed steps
4. Verify all checklist items are complete
5. Try clearing cache and cookies

---

**Estimated Total Time: 20-25 minutes**
**Difficulty: Easy to Medium**

Good luck! 🚀
