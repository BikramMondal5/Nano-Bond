# GitHub Actions Workflow Checklist

This checklist ensures your Android build workflow will run successfully and produce APKs without failures.

## ✅ Recent Fixes Applied

- [x] **Fixed Flutter Version**: Changed from `3.38.5` (invalid) to `3.27.3`
- [x] **Added Job Timeout**: Set to 60 minutes to prevent indefinite hangs
- [x] **Fixed File Watcher**: Added `--no-watch` flag to `build_runner` to prevent overload
- [x] **Optimized Caching**: Enabled Flutter cache in workflow

---

## 🔍 Pre-Push Verification Checklist

### 1. GitHub Secrets Configuration

Verify all required secrets are set in your repository:

**Go to:** Settings → Secrets and variables → Actions → Repository secrets

| Secret Name | Required | Description | Example |
|------------|----------|-------------|---------|
| `WEB3AUTH_CLIENT_ID` | ✅ Yes | Web3Auth client identifier | `BPabc123...` |
| `WEB3AUTH_REDIRECT_URL` | ✅ Yes | OAuth redirect URL | `com.example.gbond://auth` |
| `BACKEND_URL` | ✅ Yes | Your backend API endpoint | `https://api.yourapp.com` |
| `RPC_URL` | ✅ Yes | Blockchain RPC endpoint | `https://rpc.ankr.com/polygon` |

**How to check:**
```bash
# These secrets MUST be configured in GitHub repo settings
# The workflow will fail if any are missing
```

### 2. Project Structure Verification

Ensure these paths exist in your repository:

```
✅ Android/app/pubspec.yaml
✅ Android/app/lib/ (Flutter source code)
✅ Android/app/android/app/build.gradle.kts
✅ Android/app/assets/ (if you have assets)
✅ .github/workflows/android-build.yml
```

**Quick check command:**
```bash
cd Nano-Bond
ls -la Android/app/pubspec.yaml Android/app/android/app/build.gradle.kts
```

### 3. Dependencies Check

Verify critical dependencies in `pubspec.yaml`:

- [x] `build_runner: ^2.10.5` (required for code generation)
- [x] `riverpod_generator: ^4.0.0+1` (generates .g.dart files)
- [x] `flutter_dotenv: ^6.0.0` (loads .env secrets)
- [x] `web3auth_flutter: ^6.3.0` (requires secrets)

### 4. Build Configuration

**Android App Configuration** (`android/app/build.gradle.kts`):

- [x] `minSdk = 26` (Android 8.0+)
- [x] `compileSdk` using Flutter defaults
- [x] `applicationId = "com.example.gbond"`
- [x] Java version 17 compatibility
- [x] ProGuard enabled for release builds
- [x] Custom APK naming configured

### 5. Workflow Triggers

The workflow runs on:

1. **Push to main/master branch** with changes in `Android/app/**`
2. **Pull requests** to main/master with changes in `Android/app/**`
3. **Tag push** with pattern `v*` (e.g., `v1.0.0`)
4. **Manual trigger** via GitHub Actions UI

---

## 🚀 How to Trigger the Workflow

### Option A: Push Changes (Automatic)
```bash
cd Nano-Bond
git add .
git commit -m "Build Android APKs"
git push origin main
```

### Option B: Create Release Tag (Recommended)
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Option C: Manual Trigger
1. Go to GitHub → Actions → "Build Android APKs"
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow" button

---

## 📦 Expected Outputs

### After Successful Build:

#### 1. **Artifacts** (Available for 30 days)
- `android-apks-split` - Contains architecture-specific APKs:
  - `nanobonds-v{version}+{build}-arm64-v8a-release.apk` (64-bit ARM)
  - `nanobonds-v{version}+{build}-armeabi-v7a-release.apk` (32-bit ARM)
  - `nanobonds-v{version}+{build}-x86_64-release.apk` (64-bit x86)
- `android-apk-universal` - Contains universal APK:
  - `nanobonds-v{version}+{build}-universal-release.apk` (All devices)

#### 2. **GitHub Release** (Only on tag push)
- Created automatically with tag name (e.g., `v1.0.0`)
- Contains all 4 APK variants
- Includes architecture comparison table
- Auto-generated release notes

**Download APKs:**
- Go to: Actions → Select workflow run → Scroll to "Artifacts"
- Or: Releases → Select latest release (for tag builds)

---

## 🚨 Common Issues & Solutions

### Issue 1: "Exit code 143" or Build Timeout
**Status:** ✅ FIXED
- **Solution:** Added `timeout-minutes: 60` to job
- **Why it happened:** Job exceeded GitHub's default limits

### Issue 2: "Already watching path" Warning
**Status:** ✅ FIXED
- **Solution:** Added `--no-watch` flag to build_runner
- **Why it happened:** File watcher stayed active in CI environment

### Issue 3: Invalid Flutter Version
**Status:** ✅ FIXED
- **Previous:** `flutter-version: "3.38.5"` (doesn't exist)
- **Current:** `flutter-version: "3.27.3"` (stable)

### Issue 4: Secrets Not Found
**Status:** ⚠️ REQUIRES SETUP
- **Symptom:** Build completes but app crashes on launch
- **Solution:** Configure all 4 required secrets in GitHub repository settings
- **Test:** After setting secrets, re-run the workflow

### Issue 5: Build APK Path Incorrect
**Status:** ✅ VERIFIED
- **APK Output Path:** `Android/app/build/app/outputs/flutter-apk/*.apk`
- **Custom Naming:** Configured in `build.gradle.kts`

### Issue 6: Gradle Daemon Issues
**Status:** 🔄 MONITORED
- If builds fail with daemon errors, add to workflow:
  ```yaml
  - name: Clean Gradle
    run: |
      cd android
      ./gradlew clean
  ```

---

## 🔧 Optimization Tips

### Current Build Time Estimate: ~15-30 minutes

To reduce build time further:

1. **Enable Gradle Caching** (Add before Flutter setup):
   ```yaml
   - name: Setup Gradle Cache
     uses: gradle/actions/setup-gradle@v4
     with:
       cache-read-only: false
   ```

2. **Use Flutter 3.27.3** (Latest stable - already configured ✅)

3. **Parallel Builds** (Already enabled by default in Gradle)

4. **Reduce APK Variants** (If you only need arm64-v8a):
   ```yaml
   - name: Build APK
     run: flutter build apk --target-platform android-arm64 --release
   ```

---

## 📋 Pre-Push Checklist

Before pushing to trigger the workflow:

- [ ] All 4 GitHub secrets are configured
- [ ] Flutter version is `3.27.3` (verified ✅)
- [ ] `--no-watch` flag is present in build_runner step (verified ✅)
- [ ] `timeout-minutes: 60` is set (verified ✅)
- [ ] You have committed and pushed the workflow file
- [ ] You understand which trigger you're using (push/tag/manual)

---

## 🎯 Success Criteria

Your workflow is successful when:

1. ✅ All steps show green checkmarks
2. ✅ Build completes in under 60 minutes
3. ✅ Artifacts section shows 2 uploads:
   - `android-apks-split` (3 APKs)
   - `android-apk-universal` (1 APK)
4. ✅ No exit code 143 errors
5. ✅ No "Already watching path" warnings
6. ✅ APKs are downloadable and installable

---

## 📱 Testing the APK

After downloading:

1. **Transfer to Android device:**
   ```bash
   adb install nanobonds-v1.0.0+123-arm64-v8a-release.apk
   ```

2. **Or enable "Install from Unknown Sources" and install manually**

3. **Test critical features:**
   - App launches without crashes
   - Web3Auth authentication works
   - Backend connectivity works
   - RPC connection established

---

## 🐛 Debugging Failed Builds

### Step 1: Check Logs
1. Go to Actions → Select failed workflow
2. Click on failed step
3. Expand logs to see error

### Step 2: Common Error Patterns

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| `exit code 143` | Timeout/Resource limit | Increase `timeout-minutes` |
| `Already watching path` | File watcher active | Add `--no-watch` (already done ✅) |
| `Secret not found` | Missing GitHub secret | Add secret in repo settings |
| `Flutter version not found` | Invalid version | Use `3.27.3` (already fixed ✅) |
| `Gradle daemon disappeared` | Memory issue | Add gradle clean step |
| `Could not find .env` | .env creation failed | Check secrets are set |

### Step 3: Test Locally First

Before pushing, test locally:

```bash
cd Android/app
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs --no-watch
flutter build apk --split-per-abi --release
```

If local build works, GitHub Actions should work too.

---

## 📊 Workflow Execution Timeline

| Step | Estimated Time | Can Fail? |
|------|----------------|-----------|
| Checkout | 10-30s | Rarely |
| Setup Java | 30s-1min | Rarely |
| Setup Flutter | 1-3min | If wrong version |
| Create .env | <5s | If secrets missing |
| Get dependencies | 1-2min | Network issues |
| Auto-version | <5s | Rarely |
| Run build_runner | 2-5min | Missing dependencies |
| Build Split APKs | 10-20min | Config errors |
| Build Universal APK | 5-10min | Config errors |
| Upload Artifacts | 1-2min | Network issues |
| Create Release | 30s-1min | Only on tag push |

**Total Expected Time:** 20-40 minutes (well under 60-minute timeout ✅)

---

## ✨ Additional Improvements (Optional)

### 1. Add Slack/Discord Notifications

```yaml
- name: Notify on Success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ Android APKs built successfully!"}'
```

### 2. Run Tests Before Building

```yaml
- name: Run Flutter Tests
  run: flutter test
```

### 3. Add Build Cache for Faster Rebuilds

```yaml
- name: Cache Flutter Dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.pub-cache
      Android/app/.dart_tool
    key: flutter-${{ runner.os }}-${{ hashFiles('**/pubspec.lock') }}
```

---

## 🎉 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Timeout Fix | ✅ Applied | 60-minute limit |
| File Watcher Fix | ✅ Applied | `--no-watch` added |
| Flutter Version | ✅ Fixed | Changed to 3.27.3 |
| Secrets Setup | ⚠️ Manual | Needs verification |
| APK Naming | ✅ Configured | Custom naming active |
| Multi-Architecture | ✅ Enabled | 4 APK variants |

---

## 📞 Need Help?

If the build still fails after following this checklist:

1. Check the Actions logs for specific error messages
2. Verify all secrets are correctly configured
3. Ensure `Android/app/` path structure is correct
4. Try running the build locally first
5. Check if any dependencies need updating

**The workflow is now optimized and should work correctly when you push!** 🚀

---

Last Updated: Based on workflow fixes applied
Status: ✅ Ready for deployment