# Admin Settings System - User Guide

## Overview

The Admin Settings System provides a centralized interface for managing all system configurations related to the equipment lending system. This guide will help you understand and effectively use each setting.

## Accessing the Settings Page

1. Log in with an administrator account
2. Navigate to the Admin Dashboard
3. Click on "Settings" in the admin menu
4. You will see a tabbed interface with different setting categories

**Note:** Only users with administrator role can access the settings page. Non-admin users will be redirected if they attempt to access this page.

## Settings Categories

### 1. General Settings

This tab contains system-wide configuration options.

**Available Settings:**
- System name and description
- Default language preferences
- Time zone settings

### 2. Loan Rules

Configure rules that govern equipment borrowing.

#### Maximum Loan Duration

**What it does:** Sets the maximum number of days a user can borrow equipment.

**How to use:**
1. Enter a positive number (in days)
2. Click "Save"
3. The new limit applies immediately to all new loan requests

**Example:** If set to 14 days, users cannot select a return date more than 14 days from the borrow date.

**Validation:**
- Must be a positive integer
- Recommended range: 1-90 days
- Cannot be zero or negative

**Effect:** 
- Existing loans are not affected
- New loan requests will be limited by this duration
- The date picker in the loan request form will disable dates beyond this limit

#### Maximum Advance Booking Period

**What it does:** Sets how far in advance users can reserve equipment.

**How to use:**
1. Enter a positive number (in days)
2. Click "Save"
3. The new limit applies immediately to all new reservations

**Example:** If set to 30 days, users cannot reserve equipment for dates more than 30 days in the future.

**Validation:**
- Must be a positive integer
- Recommended range: 7-90 days
- Cannot be zero or negative

**Effect:**
- Existing reservations are not affected
- New reservations will be limited by this period
- The date picker in the reservation form will disable dates beyond this limit

### 3. Closed Dates

Manage dates when the system is closed and equipment cannot be borrowed or returned.

#### Adding a Closed Date

1. Click "Add Closed Date"
2. Select the date from the calendar
3. Enter a reason (e.g., "Public Holiday", "System Maintenance")
4. Click "Save"

**Effect:**
- The date will be disabled in all date pickers (borrow, return, reservation)
- Users will see a tooltip explaining why the date is unavailable
- Changes apply immediately

#### Viewing Closed Dates

- All closed dates are displayed in chronological order
- Each entry shows the date and reason
- Past closed dates are shown in a different color

#### Removing a Closed Date

1. Find the date in the list
2. Click the "Delete" button
3. Confirm the deletion
4. The date becomes available immediately

**Best Practices:**
- Add closed dates well in advance
- Provide clear reasons for each closed date
- Review and remove past closed dates periodically
- Consider recurring holidays (add them annually)

### 4. Category Limits

Set limits on how many items users can borrow from each equipment category.

#### Setting a Category Limit

1. Find the category in the list
2. Enter the maximum number of items
3. Click "Save"

**What it does:** Prevents users from borrowing more than the specified number of items from that category at the same time.

**Example:** If "Cameras" has a limit of 2, a user cannot borrow a third camera while they have 2 cameras already borrowed.

**Validation:**
- Must be a positive integer
- Recommended range: 1-10 items
- Cannot be zero (use default limit instead)

**Default Limit:**
- If no specific limit is set for a category, the default system-wide limit applies
- Set the default limit at the top of the tab
- Recommended default: 3 items

**Effect:**
- Applies to all users immediately
- Users will see an error message if they try to exceed the limit
- The error message shows the current count and the limit

**Viewing Current Usage:**
- Each category shows the current borrowed count across all users
- This helps you understand usage patterns
- Use this information to adjust limits as needed

### 5. Notifications

Configure external notifications and system announcements.

#### Discord Webhook Configuration

**What it does:** Sends notifications to a Discord channel when important events occur.

**Setup:**
1. Create a webhook in your Discord server:
   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL
2. Paste the URL in the "Discord Webhook URL" field
3. Click "Test Webhook" to verify it works
4. Click "Save"

**Events that trigger notifications:**
- New loan requests
- Overdue equipment
- Critical setting changes
- System errors

**Security:**
- The URL is stored securely
- Only the last 4 characters are shown in the UI
- The URL is excluded from exports by default

**Testing:**
- Use the "Test Webhook" button to send a test message
- Check your Discord channel to verify receipt
- If the test fails, check the URL and Discord server settings

**Disabling:**
- Toggle the "Enable Discord Notifications" switch to off
- Or delete the webhook URL

#### System Notifications

**What it does:** Send announcements to all users that appear when they log in.

**Creating a Notification:**
1. Click "Create System Notification"
2. Enter a title (e.g., "System Maintenance Scheduled")
3. Enter the content/message
4. Select priority (Low, Medium, High)
5. Optionally set an expiration date
6. Optionally enable feedback request
7. Click "Send"

**Priority Levels:**
- **Low:** General announcements, tips
- **Medium:** Important updates, policy changes
- **High:** Urgent alerts, system downtime

**Feedback Requests:**
- Enable this to collect user responses
- Add a feedback question
- View aggregated responses in the notification history

**Viewing Notification History:**
- See all sent notifications
- View delivery statistics (sent, read, responded)
- Filter by date and type

**Best Practices:**
- Keep messages concise and clear
- Use high priority sparingly
- Set expiration dates for time-sensitive announcements
- Review feedback regularly

### 6. Audit Log

View a complete history of all setting changes.

#### What's Logged

Every setting change records:
- Timestamp
- Administrator who made the change
- Setting name
- Old value
- New value
- IP address
- User agent (browser)

#### Viewing the Audit Log

- Entries are shown in reverse chronological order (newest first)
- Each entry shows all relevant details
- Color coding indicates the type of change

#### Filtering

**By Date Range:**
1. Click "Filter by Date"
2. Select start and end dates
3. Click "Apply"

**By Administrator:**
1. Click "Filter by Admin"
2. Select an administrator from the dropdown
3. Click "Apply"

**By Setting Type:**
1. Click "Filter by Setting"
2. Select a setting category
3. Click "Apply"

**Clearing Filters:**
- Click "Clear All Filters" to reset

#### Critical Setting Notifications

When critical settings are changed (loan duration, category limits, closed dates), all administrators receive a notification. This ensures transparency and accountability.

#### Best Practices

- Review the audit log regularly
- Investigate unexpected changes
- Use filters to track specific settings
- Export audit logs for compliance purposes

### 7. Import/Export

Backup and restore system settings.

#### Exporting Settings

**What it does:** Creates a JSON file containing all current settings.

**How to export:**
1. Click "Export Settings"
2. Choose whether to include sensitive data (webhook URLs)
3. Click "Download"
4. Save the file to a secure location

**What's included:**
- All setting values
- Closed dates
- Category limits
- Metadata (export date, admin, version)

**What's excluded by default:**
- Discord webhook URLs (for security)
- Audit log entries
- User data

**Use cases:**
- Regular backups
- Migrating to another system
- Testing configuration changes
- Disaster recovery

#### Importing Settings

**What it does:** Restores settings from a previously exported JSON file.

**How to import:**
1. Click "Import Settings"
2. Select a JSON file
3. Review the preview of changes
4. Click "Confirm Import"

**Safety features:**
- Automatic backup created before import
- Validation of file format and structure
- Preview of all changes before applying
- Rollback capability if something goes wrong

**Validation:**
- File must be valid JSON
- All required fields must be present
- Values must pass validation rules
- If validation fails, current settings are preserved

**What happens:**
- Current settings are backed up automatically
- New settings are applied in a transaction
- All changes take effect immediately
- Audit log entry is created

**Error Handling:**
- If import fails, an error message shows specific issues
- Current settings remain unchanged
- You can fix the file and try again

#### Import/Export History

- View all past import/export operations
- See who performed each operation
- Check timestamps and results

#### Best Practices

**For Exports:**
- Export settings regularly (weekly recommended)
- Store backups in multiple secure locations
- Include sensitive data only when necessary
- Label files clearly with date and purpose

**For Imports:**
- Always review the preview before confirming
- Test imports in a development environment first
- Keep the original export file as backup
- Verify settings after import

## Troubleshooting

### Common Issues

#### 1. Cannot Access Settings Page

**Symptom:** Redirected when trying to access settings

**Cause:** User account does not have administrator role

**Solution:**
- Contact a system administrator to grant admin privileges
- Verify your role in the user management section

#### 2. Settings Not Saving

**Symptom:** Changes don't persist after clicking save

**Possible Causes:**
- Network connection issue
- Validation error
- Permission issue
- Browser cache problem

**Solutions:**
1. Check your internet connection
2. Look for validation error messages
3. Verify you're still logged in
4. Clear browser cache and try again
5. Check browser console for errors

#### 3. Closed Dates Not Appearing in Date Pickers

**Symptom:** Users can still select closed dates

**Possible Causes:**
- Browser cache
- Date picker not updated
- Closed date not saved properly

**Solutions:**
1. Verify the closed date is in the list
2. Ask users to refresh their browser
3. Check if the date was saved (check audit log)
4. Re-add the closed date if necessary

#### 4. Discord Webhook Not Working

**Symptom:** Test webhook fails or notifications not received

**Possible Causes:**
- Invalid webhook URL
- Discord server settings
- Network firewall
- Webhook deleted in Discord

**Solutions:**
1. Verify the webhook URL is correct
2. Test the webhook in Discord directly
3. Check Discord server permissions
4. Create a new webhook if necessary
5. Check firewall settings

#### 5. Category Limits Not Enforced

**Symptom:** Users can exceed category limits

**Possible Causes:**
- Limit not saved properly
- Cache not updated
- Existing loans counted incorrectly

**Solutions:**
1. Verify the limit is saved (check audit log)
2. Refresh the settings context
3. Check the current borrowed count
4. Review loan request validation logic

#### 6. Import Fails with Validation Error

**Symptom:** Import rejected with error message

**Possible Causes:**
- Invalid JSON format
- Missing required fields
- Invalid values
- Incompatible version

**Solutions:**
1. Validate JSON syntax using a JSON validator
2. Compare with a recent export to check structure
3. Check error message for specific field issues
4. Ensure all values meet validation rules
5. Export current settings and compare formats

### Getting Help

If you encounter issues not covered here:

1. **Check the Audit Log:** Look for recent changes that might have caused the issue
2. **Review Browser Console:** Check for JavaScript errors
3. **Test in Incognito Mode:** Rule out browser extension conflicts
4. **Contact Technical Support:** Provide:
   - Description of the issue
   - Steps to reproduce
   - Screenshots if applicable
   - Browser and version
   - Timestamp of when it occurred

## Best Practices

### Security

1. **Limit Admin Access:** Only grant admin privileges to trusted users
2. **Review Audit Logs:** Regularly check for unauthorized changes
3. **Secure Exports:** Store exported settings in secure locations
4. **Protect Webhook URLs:** Don't share Discord webhook URLs publicly

### Maintenance

1. **Regular Backups:** Export settings weekly
2. **Review Closed Dates:** Remove past dates quarterly
3. **Adjust Limits:** Review category limits based on usage patterns
4. **Clean Notifications:** Archive old system notifications
5. **Monitor Audit Log:** Check for unusual activity monthly

### Performance

1. **Cache Management:** Settings are cached automatically for performance
2. **Batch Updates:** When changing multiple settings, use the import feature
3. **Limit Notifications:** Don't overuse high-priority system notifications
4. **Archive Old Data:** Keep audit log manageable by archiving old entries

### User Experience

1. **Clear Communication:** Provide clear reasons for closed dates
2. **Advance Notice:** Add closed dates well in advance
3. **Reasonable Limits:** Set category limits based on actual availability
4. **Helpful Messages:** Use system notifications to guide users
5. **Test Changes:** Test setting changes in a development environment first

## Appendix

### Setting Value Ranges

| Setting | Minimum | Maximum | Recommended | Default |
|---------|---------|---------|-------------|---------|
| Max Loan Duration | 1 day | 365 days | 7-30 days | 14 days |
| Max Advance Booking | 1 day | 365 days | 14-60 days | 30 days |
| Category Limit | 1 item | 100 items | 2-5 items | 3 items |

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save current tab settings
- `Ctrl/Cmd + E`: Export settings
- `Ctrl/Cmd + F`: Focus search/filter
- `Esc`: Close modal dialogs

### API Rate Limits

- Discord Webhook: 30 requests per minute
- Setting Updates: 100 per minute per admin
- Audit Log Queries: 1000 per hour

### Data Retention

- Audit Log: 2 years
- System Notifications: 90 days after expiration
- Closed Dates: Indefinite (manual cleanup recommended)
- Import/Export History: 1 year

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team
