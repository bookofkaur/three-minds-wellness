# 🚀 Final Push Instructions — One-Time Setup

Everything is built, tested (28/28 tests pass), and committed locally.
You just need to authorize GitHub to push the CI workflow file.

---

## Option A — Easiest: Create a Personal Access Token (PAT)

1. Go to: **https://github.com/settings/tokens/new**
2. Give it a name like `three-minds-workflow`
3. Set expiration: **90 days** (or No expiration)
4. Check these scopes:
   - ✅ `repo` (full repo access)
   - ✅ `workflow` (update GitHub Action workflows)
   - ✅ `gist`
5. Click **"Generate token"**
6. **COPY the token** (starts with `ghp_...`) — you only see it once!

Then open Terminal and run these commands (replace `YOUR_TOKEN_HERE`):

```bash
cd /Users/darrianbelcher/Desktop/darrian-wellness-app

# Store the token in git credentials
git remote set-url origin https://YOUR_TOKEN_HERE@github.com/bookofkaur/three-minds-wellness.git

# Push
git push origin master
```

---

## Option B — Device Code Flow (already in progress)

A background auth process is still running. Use this code:

- **URL:** https://github.com/login/device
- **Code:** `CD1E-AF04`

After authorizing in browser, run in Terminal:

```bash
cd /Users/darrianbelcher/Desktop/darrian-wellness-app
gh auth setup-git
git push origin master
```

---

## After the Push Succeeds

1. Go to: **https://github.com/bookofkaur/three-minds-wellness/actions**
2. You may see a banner: *"Workflows aren't being run on this fork"* — click **"I understand my workflows, go ahead and enable them"**
3. Watch the pipeline run its 4 jobs: 🧪 Test → 🔒 Security → 🏗️ Build → 🚀 Deploy
4. After ~3-5 minutes, your app will be live at:
   **https://bookofkaur.github.io/three-minds-wellness/**

---

## What Was Pushed (Commit a872090)

| File | Purpose |
|------|---------|
| `src/test/firebase.test.js` | 13 tests for JSONBlob data layer |
| `src/test/CheckIn.test.jsx` | 8 tests for check-in form |
| `src/test/Dashboard.test.jsx` | 7 tests for dashboard display |
| `src/test/setup.js` | Test environment setup |
| `.github/workflows/ci.yml` | 4-job CI/CD pipeline |
| `TESTING_AND_PIPELINE_REVIEW.md` | Plain-English review doc |
| `vite.config.js` | Updated with Vitest config |
| `package.json` | Updated with test scripts |

**28 out of 28 tests pass ✅**
