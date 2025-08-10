# Certificate Generation Setup

## Overview

This Laravel backend includes certificate generation functionality using Node.js scripts with Puppeteer for PDF generation.

## Prerequisites

-   Node.js (v20.18.0 or higher)
-   npm (v11.2.0 or higher)
-   PHP with Laravel framework

## Installation Steps

1. **Install Node.js Dependencies**

    ```bash
    cd backend
    npm install
    ```

2. **Key Dependencies**
    - `puppeteer` (v24.15.0) - For headless browser PDF generation
    - Other dependencies are listed in `package.json`

## Certificate Generation Scripts

### Single Certificate

-   **Script**: `generate-certificate.cjs`
-   **Template**: `resources/certificate_template.html`
-   **Usage**: Accepts JSON input via stdin, outputs PDF to stdout

### Bulk Certificates

-   **Script**: `generate-bulk-certificates.cjs`
-   **Template**: Same as single certificate
-   **Usage**: Processes multiple recipients in one PDF

## API Endpoints

### Single Certificate Generation

-   **POST** `/api/certificates`
-   **Required fields**: `signatories`, `message`, `format`
-   **Optional fields**: `name`, `controlNumber`, `associate`, `logoUrl`

### Bulk Certificate Generation

-   **POST** `/api/certificates/bulk`
-   **Required fields**: `recipients`, `signatories`, `message`, `format`
-   **Optional fields**: `logoUrl`

## Control Number (CN) Formatting

### Automatic CN Formatting

-   **Input**: Users can enter just numbers (e.g., "123", "456")
-   **Output**: Automatically formatted as "CN-XXXXX" (e.g., "CN-00123", "CN-00456")
-   **Padding**: Numbers are zero-padded to 5 digits
-   **Letter Filtering**: Any non-numeric characters are automatically removed

### Input Examples

| User Input | Processed | Display on Certificate |
| ---------- | --------- | ---------------------- |
| `123`      | `123`     | `CN-00123`             |
| `CN456`    | `456`     | `CN-00456`             |
| `789abc`   | `789`     | `CN-00789`             |
| `1000`     | `1000`    | `CN-01000`             |
| `12345`    | `12345`   | `CN-12345`             |

### Bulk Processing Features

-   **Smart Parsing**: Automatically extracts numbers from mixed input
-   **Format Support**:
    -   Tab-separated: `Name\t123`
    -   Comma-separated: `Name,456`
    -   Letters after comma ignored: `Name,789abc` → extracts `789`
-   **Frontend Validation**: Input fields automatically filter non-numeric characters

## Auto-Sizing Features

### Recipient Name Auto-Sizing

-   Names longer than 15 characters automatically reduce font size
-   Prevents text overflow while maintaining readability
-   Font sizes: 2.2rem (default) → 1.8rem → 1.6rem → 1.4rem

### Message Body Auto-Sizing

-   **NEW**: Appreciation messages automatically resize when exceeding 3 lines
-   Estimation based on text length and actual line measurement
-   Progressive font size reduction for longer messages:
    -   **3+ lines**: 1.0rem (from 1.08rem base)
    -   **4+ lines**: 0.95rem
    -   **5+ lines**: 0.9rem
    -   **6+ lines**: 0.85rem
-   Line height also adjusts to maintain proper spacing
-   Minimum font size: 0.8rem to ensure readability

## Troubleshooting

### Common Issues

1. **"Cannot find module 'puppeteer'" Error**

    - **Solution**: Run `npm install` in the backend directory
    - **Cause**: Missing Node.js dependencies

2. **PDF Generation Fails**

    - Check Laravel logs: `storage/logs/laravel.log`
    - Verify Node.js scripts have execute permissions
    - Ensure all required assets exist in `public/Assets/`

3. **Missing CN Number Error**

    - This was typically caused by missing puppeteer dependency
    - Ensure `controlNumber` field is provided in requests

4. **Message Text Appears Too Small**

    - The system automatically resizes long messages to fit within 3 lines
    - For very long messages (>600 characters), consider breaking into shorter sentences
    - Font will not go below 0.8rem for readability

5. **Control Number Not Formatting**
    - Ensure you're sending numeric values in the `controlNumber` field
    - Backend automatically extracts numbers and formats as CN-XXXXX
    - Check that the number is being properly processed in frontend

## Required Assets

-   `public/Assets/disaster_logo.png` - Main logo
-   `public/Assets/background.jpg` - Certificate background

## File Structure

```
backend/
├── app/Http/Controllers/CertificateController.php
├── generate-certificate.cjs
├── generate-bulk-certificates.cjs
├── resources/certificate_template.html
├── package.json
└── public/Assets/
    ├── disaster_logo.png
    └── background.jpg
```

## Notes

-   Certificates are generated in A4 landscape format
-   Template supports 1-5 signatories with automatic layout adjustment
-   Font size auto-adjusts based on recipient name length
-   Message body font auto-adjusts to fit within 3 lines
-   **NEW**: Control numbers automatically formatted as CN-XXXXX
-   **NEW**: Smart parsing extracts numbers from mixed input formats
-   **FIXED**: Bulk generation now ensures consistent message formatting across all certificates
-   **FIXED**: AOR Submit button now properly submits reports instead of saving as drafts
-   **FIXED**: AOR data mapping now correctly matches template expectations
-   Background images are converted to base64 for offline generation
-   Dynamic font sizing ensures professional appearance regardless of content length
-   Frontend input validation prevents invalid control number formats

## AOR Template Format

The After Operation Report (AOR) template has been completely redesigned to match official format requirements:

### Paper Format

-   **Paper Size**: Legal (8.5" x 14") for official compliance
-   **Layout**: Single column format for better readability
-   **Margins**: 1cm top/bottom, 1.5cm left/right

### Section Structure

The template follows the standard AOR format with these sections:

1. **Header** - Associate's institution logo (left), institution name, associate name (once), and address (center), PCGA logo (right)
2. **Report Header** - FOR, DATE, SUBJECT information
3. **Authority** - Listed as numbered items
4. **Date, Time, and Place of Activity** - Event details
5. **Personnel Involved** - Participants and organizers
6. **Narrations of Events** - Comprehensive event description
    - Event Overview
    - Training Agenda
    - Participants (with positions)
    - Key Outcomes (numbered)
    - Challenges (numbered)
    - Conclusion
7. **Recommendations** - Numbered list of recommendations
8. **Attachments** - Photos in 2-column grid layout
9. **Signatures** - Prepared by and Approved by with digital signatures

### Data Display Features

-   **Dynamic Header**: Institution name replaces "HEADQUARTERS", associate name appears once, associate logo replaces left logo, address at bottom
-   **Smart Data Mapping**: Associate input automatically maps to correct template sections
-   **Numbered Lists**: Recommendations, outcomes, and challenges display as numbered items
-   **Photo Grid**: Uploaded photos display in professional 2-column layout
-   **Digital Signatures**: Both prepared by and approved by signatures display properly
-   **Fallback Content**: Default values display when associate input is empty

## AOR Data Mapping

The AOR template expects specific field names that differ from the frontend form field names. The system now correctly maps:

### Form Field → Template Field Mapping

| Frontend Form Field | Template Expected Field | Description                       |
| ------------------- | ----------------------- | --------------------------------- |
| `forName`           | `for`                   | Recipient name                    |
| `authorities`       | `authority`             | Authority array                   |
| `place`             | `location`              | Event location                    |
| `personnelInvolved` | `auxiliaryPersonnel`    | Personnel involved                |
| `trainingAgenda`    | `objective`             | Training objectives               |
| `eventOverview`     | `summary`               | Event summary                     |
| `keyOutcomes`       | `activities`            | Converted to activities structure |

### Additional Template Fields

-   `activityType` - Mapped from `eventName`
-   `pcgPersonnel` - Empty array (form doesn't collect PCG personnel separately)
-   `activities` - Complex structure created from `keyOutcomes`
