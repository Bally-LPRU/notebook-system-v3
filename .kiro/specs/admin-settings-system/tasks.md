# Implementation Plan

- [x] 1. Set up settings infrastructure and data models





  - Create Firestore collections structure for settings, closedDates, categoryLimits, and settingsAuditLog
  - Define TypeScript/JavaScript types for all settings data models
  - Set up Firestore security rules for settings collections
  - Create Firestore indexes for audit log queries
  - _Requirements: 1.2, 8.1, 8.2_

- [x] 2. Implement core settings service





  - [x] 2.1 Create settingsService with CRUD operations


    - Implement getSettings(), updateSetting(), updateMultipleSettings()
    - Add validation logic for all setting types
    - Implement error handling and retry logic
    - _Requirements: 1.2, 1.5, 3.1, 4.1_

  - [x] 2.2 Write property test for settings persistence


    - **Property 1: Settings persistence**
    - **Validates: Requirements 3.1, 4.1, 5.2, 6.1**

  - [x] 2.3 Write property test for settings validation


    - **Property 3: Settings validation**
    - **Validates: Requirements 3.4, 4.4, 5.1**

  - [x] 2.4 Write unit tests for settings service


    - Test CRUD operations
    - Test error handling
    - Test validation logic
    - _Requirements: 1.2, 1.5_

- [x] 3. Implement settings context and caching





  - [x] 3.1 Create SettingsContext with state management


    - Implement context provider with all settings state
    - Add loading and error states
    - Implement real-time Firestore listeners
    - _Requirements: 1.2, 10.1_

  - [x] 3.2 Implement caching layer with settingsCache utility


    - Create in-memory cache with TTL
    - Implement cache invalidation logic
    - Add cache synchronization across instances
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 3.3 Write property test for cache invalidation


    - **Property 21: Cache invalidation on update**
    - **Validates: Requirements 10.2**

  - [x] 3.4 Write property test for cache-first retrieval


    - **Property 22: Cache-first retrieval**
    - **Validates: Requirements 10.3**

  - [x] 3.5 Write property test for cache refresh


    - **Property 23: Cache refresh on expiration**
    - **Validates: Requirements 10.4**

- [x] 4. Create admin settings page structure




  - [x] 4.1 Create AdminSettingsPage component with tab navigation


    - Implement main settings page layout
    - Add tab navigation for different setting categories
    - Implement admin-only access control
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 4.2 Write property test for access control


    - **Property 2: Access control enforcement**
    - **Validates: Requirements 1.3**

  - [x] 4.3 Write unit tests for AdminSettingsPage


    - Test tab navigation
    - Test admin access control
    - Test loading states
    - _Requirements: 1.1, 1.3_

- [x] 5. Implement closed dates management





  - [x] 5.1 Create ClosedDatesTab component


    - Implement UI for viewing closed dates list
    - Add form for adding new closed dates with reason
    - Implement delete functionality for closed dates
    - Display dates in chronological order
    - _Requirements: 2.1, 2.5, 2.6_

  - [x] 5.2 Add closed dates methods to settingsService


    - Implement addClosedDate(), removeClosedDate(), getClosedDates()
    - Implement isDateClosed() utility method
    - Add real-time updates for closed dates
    - _Requirements: 2.1, 2.6, 2.7_

  - [x] 5.3 Create ClosedDatePicker component


    - Extend existing date picker to disable closed dates
    - Show tooltip on hover explaining why date is disabled
    - Apply to borrow, return, and reservation date pickers
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 5.4 Write property test for closed date enforcement


    - **Property 4: Closed date enforcement**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [x] 5.5 Write property test for closed date persistence


    - **Property 5: Closed date persistence and retrieval**
    - **Validates: Requirements 2.1, 2.5**

  - [x] 5.6 Write property test for closed date removal


    - **Property 6: Closed date removal**
    - **Validates: Requirements 2.6, 2.7**

- [x] 6. Implement loan rules settings





  - [x] 6.1 Create LoanRulesTab component


    - Add input for maximum loan duration with validation
    - Add input for maximum advance booking period with validation
    - Display current values with units (days)
    - Implement save functionality with validation
    - _Requirements: 3.1, 3.4, 3.5, 4.1, 4.4_

  - [x] 6.2 Integrate loan duration enforcement in loan request form


    - Update EnhancedLoanRequestForm to use maxLoanDuration setting
    - Limit return date picker based on setting
    - Display maximum duration to user
    - _Requirements: 3.2, 3.3_

  - [x] 6.3 Integrate advance booking enforcement in reservation form


    - Update ReservationForm to use maxAdvanceBookingDays setting
    - Limit reservation start date picker based on setting
    - Display maximum booking period to user
    - _Requirements: 4.2, 4.3, 4.5_

  - [x] 6.4 Write property test for loan duration enforcement


    - **Property 7: Loan duration enforcement**
    - **Validates: Requirements 3.2**



  - [x] 6.5 Write property test for immediate settings application


    - **Property 8: Immediate settings application**
    - **Validates: Requirements 3.3, 4.3, 6.4**

  - [x] 6.6 Write property test for advance booking enforcement

    - **Property 9: Advance booking period enforcement**
    - **Validates: Requirements 4.2, 4.5**

- [x] 7. Implement category limits management




  - [x] 7.1 Create CategoryLimitsTab component


    - Display list of all equipment categories
    - Add input fields for setting limit per category
    - Show current borrowed count per category
    - Implement save functionality
    - _Requirements: 6.1, 6.5_

  - [x] 7.2 Create CategoryLimitEditor component


    - Reusable component for editing single category limit
    - Include validation for positive integers
    - Show visual indicator when limit is reached
    - _Requirements: 6.1, 6.4_

  - [x] 7.3 Implement category limit enforcement in loan request


    - Add validation in loanRequestService to check category limits
    - Query user's current borrowed equipment by category
    - Prevent loan request if limit exceeded
    - Display limit information in error message
    - _Requirements: 6.2, 6.3, 6.6_

  - [x] 7.4 Write property test for category limit enforcement


    - **Property 12: Category limit enforcement**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 7.5 Write property test for default category limit



    - **Property 13: Default category limit application**
    - **Validates: Requirements 6.6**

- [x] 8. Checkpoint - Ensure all core settings features work




  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Discord webhook integration




  - [x] 9.1 Create discordWebhookService


    - Implement sendDiscordNotification() method
    - Add URL validation for Discord webhooks
    - Implement test webhook functionality
    - Add error handling and logging
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [x] 9.2 Create DiscordWebhookConfig component in NotificationsTab


    - Add input for Discord webhook URL with validation
    - Implement test button to send test message
    - Show connection status indicator
    - Add option to enable/disable webhook
    - Mask URL in display (show last 4 chars only)
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 9.3 Integrate Discord notifications with system events


    - Send notification on new loan request
    - Send notification on overdue equipment
    - Send notification on critical setting changes
    - _Requirements: 5.3, 8.5_

  - [x] 9.4 Write property test for Discord webhook delivery


    - **Property 10: Discord webhook notification delivery**
    - **Validates: Requirements 5.3**

  - [x] 9.5 Write property test for Discord webhook error handling


    - **Property 11: Discord webhook error handling**
    - **Validates: Requirements 5.5**

  - [x] 9.6 Write unit tests for discordWebhookService


    - Test URL validation
    - Test message formatting
    - Test error handling
    - _Requirements: 5.1, 5.5_

- [-] 10. Implement system notifications


  - [x] 10.1 Create SystemNotificationComposer component


    - Add form with title and content fields
    - Add option to request feedback
    - Add priority selector (low, medium, high)
    - Add expiration date picker
    - Implement send functionality
    - _Requirements: 7.1, 7.2_

  - [x] 10.2 Implement system notification delivery


    - Create notification documents in Firestore
    - Send notifications to all active users via NotificationContext
    - Track delivery and read status
    - _Requirements: 7.2, 7.3_

  - [x] 10.3 Implement notification display on user login


    - Update login flow to check for unread system notifications
    - Display modal or banner with unread notifications
    - Allow users to mark as read
    - _Requirements: 7.4_

  - [x] 10.4 Create notification history viewer


    - Display all sent notifications with timestamps
    - Show delivery statistics (sent, read, responded)
    - Add filtering by date and type
    - _Requirements: 7.5_

  - [x] 10.5 Implement feedback response mechanism


    - Add response form to notifications with feedback enabled
    - Store user responses in notification document
    - Display aggregated feedback to admins
    - _Requirements: 7.6_

  - [x] 10.6 Write property test for notification persistence and delivery


    - **Property 14: System notification persistence and delivery**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 10.7 Write property test for unread notification display



    - **Property 15: Unread notification display**
    - **Validates: Requirements 7.4**

- [x] 11. Implement audit logging




  - [x] 11.1 Add audit logging to settingsService


    - Implement logSettingChange() method
    - Capture admin ID, timestamp, setting name, old/new values
    - Include IP address and user agent
    - Store in settingsAuditLog collection
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Create AuditLogTab component


    - Display audit log entries in table format
    - Show newest entries first
    - Include columns for timestamp, admin, setting, old/new values
    - _Requirements: 8.3_

  - [x] 11.3 Create AuditLogViewer component with filtering


    - Add date range filter
    - Add administrator filter
    - Add setting type filter
    - Implement pagination for large logs
    - _Requirements: 8.4_

  - [x] 11.4 Implement critical setting change notifications


    - Identify critical settings (loan duration, category limits, closed dates)
    - Send notification to all admins when critical setting changes
    - Include old and new values in notification
    - _Requirements: 8.5_

  - [x] 11.5 Write property test for audit log creation


    - **Property 16: Audit log creation**
    - **Validates: Requirements 8.1, 8.2**

  - [x] 11.6 Write property test for audit log ordering


    - **Property 17: Audit log ordering**
    - **Validates: Requirements 8.3**

  - [x] 11.7 Write property test for critical setting notifications


    - **Property 18: Critical setting notifications**
    - **Validates: Requirements 8.5**

- [x] 12. Implement import/export functionality





  - [x] 12.1 Create ImportExportTab component


    - Add export button to download settings as JSON
    - Add import file picker with validation
    - Show preview of settings to be imported
    - Display import/export history
    - _Requirements: 9.1, 9.2_

  - [x] 12.2 Implement settings export functionality


    - Generate JSON file with all current settings
    - Exclude sensitive data by default (webhook URLs)
    - Add option to include sensitive data with confirmation
    - Include metadata (export date, admin, version)
    - _Requirements: 9.1, 9.5_

  - [x] 12.3 Implement settings import functionality

    - Validate JSON file format and structure
    - Create automatic backup before import
    - Show confirmation dialog with changes preview
    - Apply imported settings with transaction
    - Handle validation errors gracefully
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 12.4 Write property test for export completeness


    - **Property 19: Settings export completeness**
    - **Validates: Requirements 9.1, 9.5**

  - [x] 12.5 Write property test for import validation and backup


    - **Property 20: Settings import validation and backup**
    - **Validates: Requirements 9.2, 9.3, 9.4**

  - [x] 12.6 Write unit tests for import/export


    - Test JSON generation
    - Test validation logic
    - Test backup creation
    - _Requirements: 9.2, 9.3, 9.4_

- [x] 13. Create custom hooks for settings access




  - [x] 13.1 Create useSettings hook


    - Provide access to all settings from context
    - Include loading and error states
    - Implement refresh functionality
    - _Requirements: 1.2_

  - [x] 13.2 Create useClosedDates hook


    - Provide access to closed dates
    - Implement isDateClosed() utility
    - Include real-time updates
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 13.3 Create useCategoryLimits hook


    - Provide access to category limits
    - Implement getCategoryLimit() utility
    - Include default limit fallback
    - _Requirements: 6.2, 6.6_

  - [x] 13.4 Write property tests for custom hooks


    - Test useSettings with various scenarios
    - Test useClosedDates with date checking
    - Test useCategoryLimits with limit retrieval
    - _Requirements: 1.2, 2.2, 6.2_

- [x] 14. Update existing components to use settings





  - [x] 14.1 Update EnhancedLoanRequestForm


    - Use maxLoanDuration from settings
    - Use closed dates to disable date picker
    - Use category limits for validation
    - _Requirements: 2.2, 3.2, 6.2_

  - [x] 14.2 Update ReservationForm


    - Use maxAdvanceBookingDays from settings
    - Use closed dates to disable date picker
    - _Requirements: 2.4, 4.2_

  - [x] 14.3 Update date picker components


    - Apply closed dates across all date pickers
    - Show tooltips for disabled dates
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 14.4 Write integration tests for updated components


    - Test loan form with settings
    - Test reservation form with settings
    - Test date pickers with closed dates
    - _Requirements: 2.2, 2.4, 3.2, 4.2_

- [x] 15. Add settings validation utilities





  - [x] 15.1 Create settingsValidation utility


    - Implement validation functions for each setting type
    - Add URL validation for Discord webhooks
    - Add range validation for durations and limits
    - Add date validation for closed dates
    - _Requirements: 1.5, 3.4, 4.4, 5.1_

  - [x] 15.2 Write property tests for validation utilities


    - Test with various invalid inputs
    - Verify all invalid inputs are rejected
    - Test edge cases (zero, negative, very large numbers)
    - _Requirements: 1.5, 3.4, 4.4_

- [x] 16. Implement UI polish and user experience improvements





  - [x] 16.1 Add loading states and skeletons


    - Show loading indicators while fetching settings
    - Add skeleton loaders for settings tabs
    - Implement optimistic updates for better UX
    - _Requirements: 1.2_

  - [x] 16.2 Add success/error notifications


    - Show toast notifications on successful save
    - Display clear error messages on failures
    - Add confirmation dialogs for destructive actions
    - _Requirements: 1.5_

  - [x] 16.3 Add help text and tooltips


    - Add explanatory text for each setting
    - Include tooltips with examples
    - Add links to documentation
    - _Requirements: 1.4_

  - [x] 16.4 Write accessibility tests


    - Test keyboard navigation
    - Test screen reader compatibility
    - Test color contrast
    - _Requirements: 1.1, 1.4_

- [x] 17. Final checkpoint - Comprehensive testing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Documentation and deployment preparation





  - [x] 18.1 Create admin documentation


    - Write guide for using settings page
    - Document each setting and its effect
    - Include troubleshooting section
    - _Requirements: All_

  - [x] 18.2 Create migration guide


    - Document how to migrate from hardcoded values
    - Provide default settings configuration
    - Include rollback procedures
    - _Requirements: All_

  - [x] 18.3 Update Firestore security rules


    - Deploy updated security rules
    - Test rules with different user roles
    - _Requirements: 1.3, 8.1_

  - [x] 18.4 Create Firestore indexes


    - Deploy required indexes for audit log queries
    - Test query performance
    - _Requirements: 8.3, 8.4_
