# ESOP CSV Templates

This folder contains downloadable CSV templates for ESOP data upload.

## Files

- `esop-template-india.csv` - Template for Indian market stocks (NSE/BSE)
- `esop-template-usa.csv` - Template for US market stocks (NASDAQ/NYSE)

## Usage

These files are served from `/templates/` URL path and downloaded via the upload page.

## Required Fields

All templates include the following required fields:
- ticker, company, grantDate, quantity, vested, status, exercisePrice

## Updating Templates

To update sample data or add new scenarios:
1. Edit the CSV files directly
2. Ensure all required fields are present
3. Test download from upload page
4. Verify uploaded data displays correctly in analytics

Last Updated: November 17, 2025
