# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BOM 기반 생산기록 시스템** - A BOM (Bill of Materials) based production recording system that manages material mixing and raw material tracking for manufacturing processes.

Replaces manual data collection via Google Forms with an automated BOM-based calculation system that generates required raw material information by simply selecting products.

## Project Structure

Main application located in `배합일지/production-system/` directory, built with Next.js 15.5.2, TypeScript, and Tailwind CSS.

## Development Commands

First, navigate to `배합일지/production-system/` directory:

```bash
# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture Overview

### Frontend (React/Next.js)
- **Main Page** (`app/page.tsx`): Production data entry interface with product selection, weight calculation, and material management
- **Components**:
  - `ProductSelector`: Searchable product selection dropdown
  - `MaterialCard`: Individual material input card with serial lot and inventory quantity inputs

### Backend (API Routes)
- `/api/products`: Retrieve grouped BOM data from Google Sheets
- `/api/calculate`: Calculate material quantities based on input weight
- `/api/save`: Save production data to storage spreadsheet
- `/api/serial-lot`: Retrieve serial lot reference data
- `/api/materials`: Retrieve all unique material options for dropdown selection

### Data Services
- **GoogleSheetsService** (`lib/googleSheets.ts`): Singleton service for Google Sheets API operations
- **BOMService** (`lib/bomService.ts`): BOM data processing and grouping logic
- **MockData** (`lib/mockData.ts`): Fallback data for testing

### Type Definitions
- `types/index.ts`: TypeScript interfaces for BOMRawData, Material, Product, ProductionData

## Google Sheets Integration

### Required Environment Variables (.env.local)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BOM_SPREADSHEET_ID=1WlabNwKwMWW-cKA_go2Q680g3S7wYDpb5iCzE_YIZdM
STORAGE_SPREADSHEET_ID=1DJyHnnLDQmiZEnGXr1nIpTZ1orFhDyXUuZEe9hpKAwQ
```

### Spreadsheet Structure
- **BOM Sheet**: Products grouped by production item code (A) + production item name (B) + production quantity (E)
- **Storage Sheet**: Horizontal data storage with dynamic header expansion capability
- **Serial Lot Sheet**: Serial lot and inventory quantity reference data

## Core Business Logic

### Material Calculation Formula
```
Calculated Consumption = (Input Weight / Base Production Quantity) × Original Consumption
```

### Data Flow
1. User selects product from dropdown
2. System fetches BOM data and groups materials
3. User inputs production weight (in grams)
4. System calculates material quantities proportionally
5. User inputs serial lot and inventory quantity for each material
6. Data saved to storage spreadsheet in horizontal format

## Domain-Specific Terminology

- **배합일지**: Mixing record / Manufacturing record
- **생산품목**: Produced final product
- **소모품목**: Consumed raw materials
- **시리얼로트**: Product serial number/lot number
- **재고수량**: Current inventory quantity of raw materials
- **소비기한**: Product expiration date (default: today + 14 months - 1 day)

## Key Implementation Details

- Weight units: UI displays in grams (g), internally stored in kilograms (kg)
- Material duplication: Users can copy/delete material entries for multiple lot handling
- Dynamic headers: Storage sheet automatically expands columns as needed
- Error handling: Comprehensive validation for required fields and API failures
- Mock data fallback: Uses mockData.ts when Google Sheets unavailable

## Important Unit Handling

The system handles weight units carefully:
- **Input**: Users enter weights in grams (g)
- **Internal calculation**: BOM data stored in kilograms (kg), calculations done in kg
- **Display**: UI shows grams (g) with proper conversion (kg × 1000)
- **Storage**: Production weight saved as grams, material weights converted from kg to g

Always ensure proper unit conversion when modifying calculation or storage logic.