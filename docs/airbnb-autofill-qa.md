# Airbnb Autofill QA Matrix

## Manual QA

### Happy Path
- Open `/properties/new`.
- Paste a valid Airbnb listing URL (for a public listing).
- Click `Import`.
- Verify success summary appears and key fields are prefilled:
  - Property name
  - Host name
  - Full address/location (if available)
  - Google Maps URL (if coordinates were present)
  - House rules / check-in instructions (if detected)
  - Airbnb listing URL in Social links
- Edit one imported field manually and save the property.
- Confirm saved property persists edited values.

### Partial Data
- Use a listing URL where Airbnb exposes minimal metadata.
- Click `Import`.
- Verify notes mention partial extraction and missing fields.
- Confirm form remains editable and save still works.

### Invalid URL
- Try blank value, non-URL text, and non-Airbnb URL.
- Verify validation message appears and no fields are changed.

### Resilience
- Simulate unreachable listing (private, removed, or temporary network failure).
- Verify user-facing error message appears.
- Confirm existing form values are preserved.

### Edit Mode
- Open `/properties/[propertyId]/edit`.
- Confirm Airbnb import block is not shown (create-only behavior).
- Confirm Airbnb listing URL field is visible in Social links and can be updated.

### Persistence
- Save with `Airbnb listing URL` populated.
- Re-open edit page and verify value is loaded from DB.

## Notes
- Airbnb page structure can vary by region and experiment flags. Parser is best-effort and intentionally non-blocking.
