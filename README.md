

# Internal Medicine Residency Program Scheduling App
by Berke Cenktug Korucu, MD

Jersey City Medical Center 
Department of Medicine 
PGY-3 Chief Resident

This is a React-based web application designed to manage residents, rotations, and schedules for the JC Internal Medicine Residency Program. It allows users to input resident data, define rotation requirements, review configurations, and generate schedules.

MIT License © 2025 Berke Cenktug Korucu

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Components](#components)
- [How It Works](#how-it-works)
- [Contributing](#contributing)

## Features
- **Residents Management**: Add, save, load, and undo resident data with vacation preferences.
- **Rotations Configuration**: Define mandatory and optional rotations with constraints (min/max or exact counts).
- **Review**: Visualize residents, rotations, and vacation distribution before scheduling.
- **Schedules**: Placeholder for generating schedules (to be implemented).
- **Responsive UI**: Flexible layouts adapt to screen size.

## Prerequisites
- Node.js (v14+ recommended)
- npm or yarn
- Basic familiarity with React and Material-UI (MUI)

## Installation
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd residency-scheduling-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   Or with yarn:
   ```bash
   yarn install
   ```

3. **Run the App**:
   ```bash
   npm start
   ```
   Opens at `http://localhost:3000` in your browser.

## Usage
1. **Residents Tab**:
   - Enter resident names (one per line), click "Add".
   - Use "Demo" for sample data, "Save" to export JSON, "Load" to import, "Undo" to revert changes.
   - Click "Rotations" to switch tabs.

2. **Rotations Tab**:
   - Select a rotation set (PGY-1, PGY-2, PGY-3, Custom).
   - Toggle rotations, set mandatory status, and define constraints.
   - Add new rotations, save/load configurations, undo changes.
   - Click "Review" to proceed.

3. **Review Tab**:
   - View residents with preferences, mandatory/non-mandatory rotations, and vacation distribution.
   - Click "Create Schedule" to switch to Schedules tab.

4. **Schedules Tab**:
   - Placeholder for future schedule generation functionality.

## File Structure
```
src/
├── components/
│   ├── ResidentsTab.js       # Manage resident input and data
│   ├── ResidentInput.js      # Input form for residents
│   ├── ResidentList.js       # Display resident list
│   ├── RotationsTab.js       # Configure rotation sets
│   ├── ReviewTab.js          # Review data before scheduling
│   ├── SchedulesTab.js       # Placeholder for schedule generation
│   └── ...                   # Other components (if added)
├── utils/
│   └── assignResidentData.js # Utility to assign resident data
├── App.js                    # Main app with tab navigation
└── index.js                  # Entry point
```

## Components

### `App.js`
- **Purpose**: Root component managing tab navigation and state.
- **State**: 
  - `tabValue`: Current tab index (0: Residents, 1: Rotations, 2: Review, 3: Schedules).
  - `residents`: Array of resident objects.
  - `rotations`: Object with rotation sets (PGY-1, PGY-2, PGY-3, Custom).
  - `selectedSet`: Current rotation set (e.g., "PGY-1").
- **UI**: Uses MUI `Tabs` for navigation, passes state and `setTabValue` to child components.

### `ResidentsTab.js`
- **Purpose**: Manage resident data entry and operations.
- **Features**: 
  - Add residents via `ResidentInput`.
  - Save/load JSON files, undo changes.
  - "Rotations" button switches to Rotations tab (index 1).
- **UI**: Top-right `ButtonGroup` (Save/Load/Undo) with "Rotations" below, matching width.

### `ResidentInput.js`
- **Purpose**: Form to input resident names.
- **Features**: Text area for names, "Add" and "Demo" buttons.
- **UI**: Text field with vertical button stack on the right.

### `ResidentList.js`
- **Purpose**: Display list of residents (assumed, not provided).
- **Features**: Shows resident details, likely editable.

### `RotationsTab.js`
- **Purpose**: Configure rotation sets and constraints.
- **Features**: 
  - Select rotation set, toggle inclusion/mandatory status.
  - Set min/max or exact counts, add new rotations.
  - Save/load configurations, undo changes.
  - "Review" button switches to Review tab (index 2).
- **UI**: Top-right `ButtonGroup` (Save/Load/Undo) with large "Review" button below.

### `ReviewTab.js`
- **Purpose**: Summarize data before scheduling.
- **Features**: 
  - Displays residents with group/vacation preferences.
  - Lists mandatory and non-mandatory rotations with constraints.
  - Shows vacation distribution in a color-coded table.
  - "Create Schedule" button switches to Schedules tab (index 3).
- **UI**: 
  - Three flex boxes (Residents, Mandatory, Non-Mandatory) align in a row (>1200px) or stack.
  - Each box has readable lists (name bold, details below).
  - "Create Schedule" button in top-right corner, aligned with "Review" title.

### `SchedulesTab.js`
- **Purpose**: Placeholder for schedule generation (not fully implemented).
- **Features**: Displays residents and rotations data.

### `assignResidentData.js`
- **Purpose**: Utility to assign vacation blocks to residents (assumed logic).

## How It Works
1. **State Management**:
   - `App.js` holds global state (`residents`, `rotations`, `selectedSet`) and passes it to tabs.
   - Each tab updates state via setters (`setResidents`, `setRotations`, `setSelectedSet`).

2. **Tab Navigation**:
   - `setTabValue` from `App.js` is passed to tabs for switching (e.g., "Rotations" → index 1, "Review" → index 2).
   - Buttons in `ResidentsTab`, `RotationsTab`, and `ReviewTab` use this to navigate.

3. **Data Flow**:
   - **Residents**: Entered in `ResidentInput`, processed in `ResidentsTab`, displayed in `ResidentList` and `ReviewTab`.
   - **Rotations**: Configured in `RotationsTab`, filtered and shown in `ReviewTab`.
   - **Vacations**: Calculated in `ReviewTab` from resident data, visualized in a table.

4. **UI Enhancements**:
   - **ResidentsTab**: "Rotations" button moved to top-right, matching `ButtonGroup` width.
   - **RotationsTab**: "Review" button in top-right, large and aligned with Save/Load/Undo.
   - **ReviewTab**: 
     - First three boxes use flex layout (row on wide screens, stack on narrow).
     - Improved readability with bold names, secondary details, and more spacing.
     - "Create Schedule" button in top-right, aligned with title.

## Contributing
1. Fork the repo.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit changes (`git commit -m "Add feature"`).
4. Push to branch (`git push origin feature-name`).
5. Open a pull request.

Feel free to report issues or suggest improvements via GitHub Issues.

