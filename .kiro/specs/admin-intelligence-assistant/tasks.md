# Implementation Plan: Admin Intelligence Assistant

## Overview

แผนการพัฒนาระบบ Admin Intelligence Assistant แบ่งเป็น 6 phases หลัก โดยเริ่มจาก core services ไปจนถึง UI components และ integration

## Tasks

- [x] 1. Set up core types and interfaces
  - [x] 1.1 Create alert types and constants
    - Create `src/types/adminAlert.js` with ALERT_TYPE, ALERT_PRIORITY enums
    - Define Alert, QuickAction interfaces
    - _Requirements: 1.1, 1.2, 8.2, 8.3_

  - [x] 1.2 Create equipment utilization types
    - Create `src/types/equipmentUtilization.js` with EQUIPMENT_CLASSIFICATION enum
    - Define EquipmentUtilization interface
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.3 Create user reliability types
    - Create `src/types/userReliability.js` with reliability interfaces
    - Define UserReliability interface
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.4 Create data management types
    - Create `src/types/dataManagement.js` with EXPORT_FORMAT, DATA_TYPE enums
    - Define ExportOptions, ImportResult, DeleteOptions interfaces
    - _Requirements: 5.1, 6.1, 7.1_

- [x] 2. Implement Proactive Alert Engine
  - [x] 2.1 Create proactive alert service
    - Create `src/services/proactiveAlertService.js`
    - Implement calculateOverduePriority function
    - Implement isNoShow function
    - Implement createAlert, resolveAlert functions
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 2.2 Write property test for alert priority calculation

    - **Property 1: Alert Priority Escalation**
    - Test priority calculation for random overdue durations
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 Write property test for no-show detection

    - **Property 2: No-Show Detection Timing**
    - Test no-show detection for random reservation times
    - **Validates: Requirements 2.1**

  - [x] 2.4 Implement overdue loan detection
    - Create function to scan for overdue loans
    - Create alerts for newly overdue loans
    - Implement priority escalation for existing alerts
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.5 Implement no-show reservation detection
    - Create function to scan for no-show reservations
    - Create alerts for no-show reservations
    - Track no-show patterns per user
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 2.6 Write property test for repeat no-show detection

    - **Property 3: Repeat No-Show Offender Detection**
    - Test flagging logic for random user no-show histories
    - **Validates: Requirements 2.4, 2.5**

- [x] 3. Checkpoint - Ensure alert engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Equipment Usage Analyzer
  - [x] 4.1 Create equipment usage analyzer service
    - Create `src/services/equipmentUsageAnalyzerService.js`
    - Implement calculateUtilizationRate function
    - Implement classifyEquipment function
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Write property test for utilization rate calculation

    - **Property 5: Utilization Rate Calculation**
    - Test calculation for random borrowed/total days
    - **Validates: Requirements 3.1**

  - [x] 4.3 Write property test for equipment classification

    - **Property 4: Equipment Utilization Classification**
    - Test classification for random utilization data
    - **Validates: Requirements 3.2, 3.3**

  - [x] 4.4 Implement equipment utilization calculation
    - Create function to calculate utilization for all equipment
    - Store results in equipmentUtilization collection
    - Generate monthly utilization reports
    - _Requirements: 3.1, 3.4, 3.6_

  - [x] 4.5 Implement equipment recommendations
    - Create function to generate inventory recommendations
    - Identify high-demand equipment needing more units
    - Identify idle equipment for potential removal
    - _Requirements: 3.5_

- [x] 5. Implement User Reliability Tracker
  - [x] 5.1 Create user reliability service
    - Create `src/services/userReliabilityService.js`
    - Implement calculateReliabilityScore function
    - Implement isRepeatNoShowOffender function
    - Implement classifyUser function
    - _Requirements: 10.1, 10.2_

  - [x] 5.2 Write property test for reliability score calculation

    - **Property 6: User Reliability Score Calculation**
    - Test score calculation for random user histories
    - **Validates: Requirements 10.1**

  - [x] 5.3 Write property test for low reliability flagging

    - **Property 7: Low Reliability User Flagging**
    - Test flagging for random reliability scores
    - **Validates: Requirements 10.2**

  - [x] 5.4 Implement user statistics calculation
    - Create function to calculate user statistics
    - Calculate on-time return rate, no-show rate
    - Store results in userReliability collection
    - _Requirements: 10.3_

  - [x] 5.5 Implement top user identification
    - Create function to identify top borrowers
    - Create function to identify most reliable users
    - _Requirements: 10.5_

  - [x] 5.6 Write property test for user statistics accuracy

    - **Property 23: User Statistics Accuracy**
    - Test statistics calculation for random user data
    - **Validates: Requirements 10.3**

  - [-] 5.7 Write property test for top user identification

    - **Property 24: Top User Identification**
    - Test ranking for random user sets
    - **Validates: Requirements 10.5**

- [x] 6. Checkpoint - Ensure analytics tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Data Management Service
  - [x] 7.1 Create data management service
    - Create `src/services/dataManagementService.js`
    - Implement validateImportData function
    - Implement convertToCSV, convertToJSON functions
    - _Requirements: 5.2, 6.2_

  - [x] 7.2 Write property test for export format validity

    - **Property 9: Export Format Validity**
    - Test CSV and JSON output validity
    - **Validates: Requirements 5.2**

  - [x] 7.3 Implement data export functionality
    - Create exportData function with format options
    - Implement date range and status filters
    - Include all required fields in export
    - Generate summary report with export
    - _Requirements: 5.1, 5.3, 5.4, 5.6_

  - [x] 7.4 Write property test for export data completeness

    - **Property 8: Export Data Completeness**
    - Test that exports contain all required fields
    - **Validates: Requirements 5.4**

  - [x] 7.5 Write property test for export filter correctness

    - **Property 10: Export Filter Correctness**
    - Test date range filter for random data
    - **Validates: Requirements 5.3**

  - [x] 7.6 Implement data import functionality
    - Create importData function with validation
    - Implement preview before apply
    - Implement rollback on failure
    - Display import summary
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 7.7 Write property test for import validation

    - **Property 11: Import Validation**
    - Test validation for random valid/invalid data
    - **Validates: Requirements 6.2, 6.3**

  - [x] 7.8 Write property test for import rollback

    - **Property 12: Import Rollback on Failure**
    - Test atomic operation behavior
    - **Validates: Requirements 6.5**

  - [x] 7.9 Implement data deletion functionality
    - Create deleteData function with confirmation
    - Implement backup creation before delete
    - Implement date range filter for deletion
    - Log all deletions to audit log
    - Implement automatic restore on failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 7.10 Write property test for delete backup creation

    - **Property 13: Delete Backup Creation**
    - Test backup is created before deletion
    - **Validates: Requirements 7.3**

  - [x] 7.11 Write property test for delete date range filter

    - **Property 14: Delete Date Range Filter**
    - Test only filtered records are deleted
    - **Validates: Requirements 7.4**

  - [x] 7.12 Write property test for delete audit logging

    - **Property 15: Delete Audit Logging**
    - Test audit log entries are created
    - **Validates: Requirements 7.6**

  - [x] 7.13 Write property test for delete rollback

    - **Property 16: Delete Rollback on Failure**
    - Test automatic restore on failure
    - **Validates: Requirements 7.7**

- [x] 8. Checkpoint - Ensure data management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Alert Dashboard
  - [x] 9.1 Create useAdminAlerts hook
    - Create `src/hooks/useAdminAlerts.js`
    - Implement real-time alert subscription
    - Implement alert filtering and grouping
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 9.2 Write property test for alert grouping

    - **Property 17: Alert Grouping by Priority**
    - Test grouping for random alert sets
    - **Validates: Requirements 8.2**

  - [x] 9.3 Write property test for alert filtering

    - **Property 19: Alert Filter Correctness**
    - Test filter for random filter combinations
    - **Validates: Requirements 8.4**

  - [x] 9.4 Create AlertDashboard component
    - Create `src/components/admin/AlertDashboard.js`
    - Display alerts grouped by priority
    - Show alert details with quick actions
    - Implement filter controls
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.5 Write property test for alert display completeness

    - **Property 18: Alert Display Completeness**
    - Test display contains required fields
    - **Validates: Requirements 8.3**

  - [x] 9.6 Implement alert resolution
    - Create resolveAlert function
    - Log resolution action
    - Update alert statistics
    - _Requirements: 8.5, 8.6_

  - [x] 9.7 Write property test for alert resolution logging

    - **Property 20: Alert Resolution Logging**
    - Test resolution logging for random alerts
    - **Validates: Requirements 8.5**

  - [x] 9.8 Write property test for alert statistics accuracy

    - **Property 21: Alert Statistics Accuracy**
    - Test statistics for random alert sets
    - **Validates: Requirements 8.6**

- [x] 10. Implement Scheduled Reports
  - [x] 10.1 Create scheduled report service
    - Create `src/services/scheduledReportService.js`
    - Implement daily summary report generation
    - Implement weekly utilization report generation
    - Store reports in scheduledReports collection
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.2 Write property test for report storage

    - **Property 22: Report Storage**
    - Test reports are persisted and retrievable
    - **Validates: Requirements 9.3**

  - [x] 10.3 Create ReportHistoryViewer component
    - Create `src/components/admin/ReportHistoryViewer.js`
    - Display report history with download options
    - Allow report preferences configuration
    - _Requirements: 9.4, 9.5_

- [x] 11. Implement Data Management Console UI
  - [x] 11.1 Create DataManagementConsole component
    - Create `src/components/admin/DataManagementConsole.js`
    - Implement export tab with format and filter options
    - Implement import tab with preview and validation
    - Implement delete tab with confirmation
    - _Requirements: 5.1, 5.5, 6.1, 6.4, 7.1, 7.2, 7.5_

  - [x] 11.2 Create ExportProgress component
    - Show export progress with cancel option
    - Display summary after completion
    - _Requirements: 5.5, 5.6_

  - [x] 11.3 Create ImportPreview component
    - Show preview of changes before applying
    - Display validation errors with correction options
    - _Requirements: 6.3, 6.4_

  - [x] 11.4 Create DeleteConfirmation component
    - Require typed confirmation phrase
    - Show progress during deletion
    - _Requirements: 7.2, 7.5_

- [x] 12. Implement Usage Analytics Dashboard
  - [x] 12.1 Create UsageAnalyticsDashboard component
    - Create `src/components/admin/UsageAnalyticsDashboard.js`
    - Display equipment utilization statistics
    - Show high-demand and idle equipment lists
    - Display recommendations
    - _Requirements: 3.4, 3.5_

  - [x] 12.2 Create UserReliabilityDashboard component
    - Create `src/components/admin/UserReliabilityDashboard.js`
    - Display user behavior statistics
    - Show top borrowers and reliable users
    - Show flagged users for review
    - _Requirements: 10.3, 10.4, 10.5_

- [x] 13. Implement Cloud Functions for Background Jobs
  - [x] 13.1 Create overdue loan checker function
    - Create `functions/checkOverdueLoansAdvanced.js`
    - Run hourly to detect new overdue loans
    - Create/escalate alerts automatically
    - _Requirements: 1.1, 1.2_

  - [x] 13.2 Create no-show reservation checker function
    - Create `functions/checkNoShowReservations.js`
    - Run every 30 minutes to detect no-shows
    - Create alerts and track patterns
    - _Requirements: 2.1, 2.4_

  - [x] 13.3 Create daily report generator function
    - Create `functions/generateDailyReport.js`
    - Run daily at midnight
    - Generate and store daily summary
    - _Requirements: 9.1_

  - [x] 13.4 Create weekly analytics function
    - Create `functions/generateWeeklyAnalytics.js`
    - Run weekly on Sunday
    - Calculate equipment utilization
    - Calculate user reliability scores
    - _Requirements: 3.6, 9.2_

- [x] 14. Integration and Navigation
  - [x] 14.1 Add routes for new pages
    - Add AlertDashboard route
    - Add DataManagementConsole route
    - Add UsageAnalyticsDashboard route
    - Add UserReliabilityDashboard route
    - Add ReportHistoryViewer route

  - [x] 14.2 Update admin sidebar navigation
    - Add Intelligence section with new menu items
    - Add badge for unresolved alerts count

  - [x] 14.3 Update AdminDashboard with intelligence widgets
    - Add alert summary widget
    - Add quick links to intelligence features

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all features work end-to-end
  - Test Cloud Functions in emulator

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Cloud Functions require Firebase CLI for deployment
