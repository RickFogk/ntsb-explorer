# NTSB Aviation Accident Explorer

A full-stack web application to search, filter, and analyze aviation accident data from the National Transportation Safety Board (NTSB). Designed to extract probable causes and contributing factors for AI/LLM training datasets.

![NTSB Explorer Screenshot](https://img.shields.io/badge/Accidents-23%2C741-blue) ![Findings](https://img.shields.io/badge/Findings-70%2C093-orange) ![Categories](https://img.shields.io/badge/Categories-5-green)

## Features

- **Search & Filter**: Full-text search across accident records with filters for severity, state, aircraft manufacturer, and date range
- **3,741 Aircraft Manufacturers**: Searchable dropdown with all manufacturers from Cessna to Embraer
- **Categorized Causes**: 70,093 findings organized into 5 NTSB taxonomy categories:
  - Personnel issues (27,851)
  - Aircraft (25,550)
  - Environmental issues (13,751)
  - Organizational issues (735)
  - Not determined (2,202)
- **Export for LLM Training**: JSON export of filtered data with probable causes and contributing factors
- **Dark Theme UI**: Professional investigative research platform design

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **Data Source**: NTSB Aviation Accident Database (2008-2024)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- MySQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RickFogk/ntsb-explorer.git
cd ntsb-explorer
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Push database schema:
```bash
pnpm db:push
```

5. **Download and import NTSB data:**
```bash
# Download the data file from GitHub Releases
curl -L -o ntsb_accidents.jsonl https://github.com/RickFogk/ntsb-explorer/releases/download/v1.0.0/ntsb_accidents.jsonl

# Import into database
node scripts/import-data.mjs
```

6. Start development server:
```bash
pnpm dev
```

## Data Files for LLM Training

Multiple export formats are available for different use cases:

| File | Size | Use Case | Download |
|------|------|----------|----------|
| `ntsb_accidents.jsonl` | 143 MB | Full LLM training data | [Download](https://github.com/RickFogk/ntsb-explorer/releases/download/v1.0.0/ntsb_accidents.jsonl) |
| `ntsb_causes_only.csv` | 11.5 MB | Spreadsheet analysis | [Download](https://github.com/RickFogk/ntsb-explorer/releases/download/v1.0.0/ntsb_causes_only.csv) |
| `ntsb_knowledge_base.md` | 4.5 KB | Cursor/LLM context | [Download](https://github.com/RickFogk/ntsb-explorer/releases/download/v1.0.0/ntsb_knowledge_base.md) |
| `ntsb_cursor_context.json` | 3.2 KB | Compact API context | [Download](https://github.com/RickFogk/ntsb-explorer/releases/download/v1.0.0/ntsb_cursor_context.json) |

### Recommended: JSONL for LLM Training

The JSONL file is ideal for LLM fine-tuning because:
- **One JSON object per line** - Easy to process in streaming pipelines
- **Contains probable causes and contributing factors** - The key data for understanding accident causation
- **143MB is manageable** - Fits most LLM fine-tuning workflows

### For Cursor Specifically

1. **Markdown Knowledge Base** - Download `ntsb_knowledge_base.md` and add it to your project's docs folder. Cursor will use it as context when you ask about aviation accidents.

2. **Compact JSON Context** - Use `ntsb_cursor_context.json` for a smaller context file with summary statistics and sample records.

### For Data Analysis

Use `ntsb_causes_only.csv` for quick analysis in spreadsheets. Contains:
- Event ID and NTSB number
- Event date and aircraft info
- Probable cause text
- Contributing factors (pipe-separated)
- Cause/factor counts

Each record in the JSONL file contains:
- Event details (ID, date, location)
- Aircraft information (make, model, category)
- Injury statistics
- **Probable cause** (official NTSB determination)
- **Contributing factors** (categorized findings)
- Narratives (preliminary and factual reports)

## Data Structure

### Accident Record Fields

| Field | Description |
|-------|-------------|
| `eventId` | Unique NTSB event identifier |
| `ntsbNumber` | NTSB investigation number |
| `eventDate` | Date of accident |
| `city`, `state`, `country` | Location |
| `aircraftMake`, `aircraftModel` | Aircraft information |
| `highestSeverity` | FATL, SERS, MINR, or NONE |
| `probableCause` | Official NTSB determination |
| `contributingFactors` | JSON array of findings |

### Contributing Factor Categories

The NTSB uses a hierarchical taxonomy for categorizing accident causes:

1. **Personnel issues** - Human factors including pilot actions, decisions, and performance
2. **Aircraft** - Mechanical issues, systems failures, and aircraft performance
3. **Environmental issues** - Weather conditions, terrain, and physical environment
4. **Organizational issues** - Management, oversight, and organizational factors
5. **Not determined** - Cause could not be determined from available evidence

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `accidents.getStats` | Get summary statistics |
| `accidents.getFilterOptions` | Get unique states and makes for filters |
| `accidents.search` | Search and filter accidents |
| `accidents.getById` | Get single accident details |
| `accidents.getCategoryStats` | Get categorized cause statistics |

## License

MIT

## Data Source

Data sourced from the [NTSB Aviation Accident Database](https://www.ntsb.gov/Pages/AviationQuery.aspx). This application is not affiliated with or endorsed by the NTSB.
