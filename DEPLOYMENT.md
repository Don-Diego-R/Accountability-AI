# Deployment Checklist

## Pre-Deployment

- [ ] Test all features locally
- [ ] Verify Google OAuth works
- [ ] Test data loading from Google Sheets
- [ ] Check all tabs render correctly
- [ ] Test task completion toggle
- [ ] Verify allow-list filtering works
- [ ] Test date range filtering

## Google Cloud Setup

- [ ] OAuth 2.0 Client ID created
- [ ] Production redirect URI added
- [ ] Service Account created with JSON key
- [ ] Google Sheets API enabled
- [ ] Sheet shared with service account

## Environment Variables

- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set  
- [ ] `NEXTAUTH_URL` updated to production domain
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` set
- [ ] `GOOGLE_SHEETS_CREDENTIALS` (full JSON) set

## Vercel Deployment

- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] All environment variables added
- [ ] Build succeeds
- [ ] Deployment successful
- [ ] Production OAuth redirect URI updated

## Post-Deployment Testing

- [ ] Can sign in with Google
- [ ] Allow-list filtering works
- [ ] Dashboard loads correctly
- [ ] All four tabs functional
- [ ] Data displays accurately
- [ ] Task toggles work
- [ ] Date filtering works
- [ ] No console errors

## Performance

- [ ] Page load < 3 seconds
- [ ] Time to insight < 2 seconds
- [ ] No layout shifts
- [ ] Mobile responsive

## Security

- [ ] Only allowed users can access
- [ ] Users only see their own data
- [ ] No PII leaks in client-side code
- [ ] HTTPS enforced
- [ ] No credentials in client bundle

## Support

- [ ] Documentation complete
- [ ] Support contact provided
- [ ] User guide available
