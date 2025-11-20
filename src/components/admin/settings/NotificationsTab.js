/**
 * Notifications Tab Component
 * Manages notification settings including Discord webhook configuration
 * Requirements: 5.1, 5.2, 5.6
 */

import React from 'react';
import DiscordWebhookConfig from './DiscordWebhookConfig';

/**
 * Notifications Tab Component
 * 
 * Provides interface for managing notification settings:
 * - Discord webhook configuration
 * - System notification settings (to be added in task 10)
 * 
 * @component
 * @returns {JSX.Element} Notifications settings tab
 */
const NotificationsTab = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure how the system sends notifications for important events
        </p>
      </div>

      {/* Discord Webhook Configuration */}
      <DiscordWebhookConfig />

      {/* System Notifications Section - Placeholder for task 10 */}
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          System Notifications
        </h3>
        <p className="text-sm text-gray-500">
          System notification composer will be available here (Task 10)
        </p>
      </div>
    </div>
  );
};

export default NotificationsTab;
