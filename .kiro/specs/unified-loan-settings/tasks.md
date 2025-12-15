# Implementation Plan

- [x] 1. Create UnifiedLoanSettingsTab component




  - [x] 1.1 Create UnifiedLoanSettingsTab.js with basic structure

    - Create new file at `src/components/admin/settings/UnifiedLoanSettingsTab.js`
    - Import necessary dependencies (React, useAuth, useSettings, etc.)
    - Set up component state for globalSettings, userTypeLimits, hasChanges, isSaving, errors
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Implement GlobalLoanSettingsSection
    - Create section for max loan duration input with validation
    - Create section for max advance booking days input with validation
    - Create optional return time window inputs
    - Add tooltips and help text
    - _Requirements: 2.1, 2.2, 7.1_
  - [x] 1.3 Write property test for numeric range validation

    - **Property 1: Numeric range validation for loan settings**

    - **Validates: Requirements 2.1, 2.2**
  - [x] 1.4 Implement UserTypeLimitsSection
    - Create enable/disable toggle for user type limits system
    - Reuse UserTypeCard component for teacher, staff, student
    - Add visual comparison with global settings
    - Show effective limit (min of global and user type)
    - _Requirements: 3.1, 3.2, 4.1, 4.3_
  - [x] 1.5 Write property test for effective limit calculation

    - **Property 4: Effective limit calculation**
    - **Validates: Requirements 4.3**

- [x] 2. Implement conflict detection and warnings





  - [x] 2.1 Create conflict detection logic


    - Compare user type limits with global limits
    - Generate conflict objects with type, userType, field, message
    - Highlight conflicting values with warning color
    - _Requirements: 3.4, 4.2_

  - [x] 2.2 Write property test for conflict detection

    - **Property 3: Conflict detection for exceeding limits**
    - **Validates: Requirements 3.4, 4.2**
  - [x] 2.3 Create ConflictWarning component


    - Display list of conflicts with explanations
    - Show impact of each conflict
    - _Requirements: 7.3_

- [x] 3. Implement save functionality






  - [x] 3.1 Implement unified save handler

    - Save both global loan rules and user type limits in single operation
    - Show loading indicator during save
    - Display success notification on completion
    - Handle errors and preserve unsaved changes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 2.3, 2.4, 3.3_

  - [x] 3.2 Write property test for settings persistence round-trip

    - **Property 2: Settings persistence round-trip**
    - **Validates: Requirements 2.3, 3.3**

- [x] 4. Update AdminSettingsPage to use unified tab






  - [x] 4.1 Update SETTINGS_TABS configuration

    - Replace separate loan-rules and user-type-limits tabs with single unified tab
    - Update tab icon and description
    - _Requirements: 1.1_

  - [x] 4.2 Update tab rendering logic

    - Import UnifiedLoanSettingsTab
    - Update switch case to render unified tab
    - Remove old tab imports if no longer needed
    - _Requirements: 1.2, 1.3_

- [x] 5. Implement responsive design







  - [x] 5.1 Add responsive grid layout for user type cards





    - 3-column grid on desktop (lg breakpoint)
    - 2-column grid on tablet (md breakpoint)
    - 1-column stack on mobile (default)
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Add help section and tooltips






  - [x] 6.1 Add collapsible help section

    - Include recommended values for each user type
    - Include examples of configuration
    - Explain priority of settings (user type vs global)
    - _Requirements: 7.1, 7.2_

- [x] 7. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Write integration tests





  - [x] 8.1 Write integration test for unified tab rendering

    - Test that both sections render correctly
    - Test responsive layout at different viewport sizes
    - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3_

  - [ ] 8.2 Write integration test for save/load flow
    - Test saving settings and verifying persistence
    - Test error handling during save
    - _Requirements: 5.1, 5.3_

- [x] 9. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
