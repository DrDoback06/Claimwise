# Style Guide Setup Instructions

The Writing Room AI integration requires the Writing Style Guide files to be accessible. The system will automatically try to load them from multiple locations.

## Automatic File Loading

The `styleGuideService` will attempt to load files from:
1. `/data/` directory in the public folder (for browser access)
2. Database cache (if previously loaded)
3. Fallback minimal guide (if files not found)

## Manual Setup (Optional)

To ensure the style guide files are accessible, copy them to the public/data directory:

```powershell
# From the workspace root directory
New-Item -ItemType Directory -Path "claimwise-omniscience/public/data" -Force
Copy-Item "Writing Style Guide.md" "claimwise-omniscience/public/data/" -Force
Copy-Item "Overview - Writing Style Guide.md" "claimwise-omniscience/public/data/" -Force
Copy-Item "claimwise-omniscience/src/src/data/BUZZWORDS_REFERENCE.md" "claimwise-omniscience/public/data/" -Force
```

## Alternative: Database Override

You can also manually load the style guide content into the database:

1. Open the browser console in your app
2. Load the style guide content
3. The service will automatically cache it in the database for future use

## Verification

The style guide service will:
- Load on first use
- Cache in database automatically
- Use fallback content if files are unavailable
- Log warnings if files cannot be loaded (check browser console)

## Files Required

- `Writing Style Guide.md` - Full style guide
- `Overview - Writing Style Guide.md` - Overview document
- `BUZZWORDS_REFERENCE.md` - Buzzwords reference (already in src/src/data/)

All files are optional - the system will work with fallback content if they're not available.

