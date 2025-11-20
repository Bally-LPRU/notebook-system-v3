/**
 * Discord Webhook Configuration Component
 * Allows admins to configure Discord webhook for system notifications
 * Requirements: 5.1, 5.2, 5.6
 */

import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import discordWebhookService from '../../../services/discordWebhookService';
import settingsService from '../../../services/settingsService';

/**
 * Discord Webhook Configuration Component
 * 
 * Provides interface for:
 * - Entering and validating Discord webhook URL
 * - Testing webhook connection
 * - Enabling/disabling Discord notifications
 * - Masking URL for security
 * 
 * @component
 * @returns {JSX.Element} Discord webhook configuration interface
 */
const DiscordWebhookConfig = () => {
  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { currentUser } = useAuth();
  
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setWebhookUrl(settings.discordWebhookUrl || '');
      setIsEnabled(settings.discordEnabled || false);
    }
  }, [settings]);

  /**
   * Mask webhook URL for security
   * Shows only last 4 characters
   */
  const getMaskedUrl = (url) => {
    if (!url || url.length <= 4) return url;
    const lastFour = url.slice(-4);
    return '•'.repeat(url.length - 4) + lastFour;
  };

  /**
   * Handle URL input change
   */
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setWebhookUrl(newUrl);
    setValidationError('');
    setTestStatus(null);
    setSaveStatus(null);
  };

  /**
   * Validate webhook URL
   */
  const validateUrl = () => {
    if (!webhookUrl.trim()) {
      setValidationError('');
      return true;
    }

    const validation = discordWebhookService.validateWebhookUrl(webhookUrl);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return false;
    }

    setValidationError('');
    return true;
  };

  /**
   * Test webhook connection
   */
  const handleTestWebhook = async () => {
    // Validate first
    if (!validateUrl()) {
      return;
    }

    if (!webhookUrl.trim()) {
      setValidationError('Please enter a webhook URL to test');
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    try {
      const result = await discordWebhookService.testWebhook(webhookUrl);
      
      if (result.success) {
        setTestStatus({
          type: 'success',
          message: 'Webhook test successful! Check your Discord channel.'
        });
      } else {
        setTestStatus({
          type: 'error',
          message: `Test failed: ${result.error}`
        });
      }
    } catch (error) {
      setTestStatus({
        type: 'error',
        message: `Test failed: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * Save webhook configuration
   */
  const handleSave = async () => {
    // Validate URL if provided
    if (webhookUrl.trim() && !validateUrl()) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const adminId = currentUser?.uid || 'unknown';
      const adminName = currentUser?.displayName || currentUser?.email || 'Admin';

      // Update webhook URL
      await updateSetting(
        'discordWebhookUrl',
        webhookUrl.trim() || null,
        adminId,
        adminName
      );

      // Update enabled status
      await updateSetting(
        'discordEnabled',
        isEnabled,
        adminId,
        adminName
      );

      setSaveStatus({
        type: 'success',
        message: 'Discord webhook configuration saved successfully'
      });

      // Clear test status
      setTestStatus(null);
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: `Failed to save: ${error.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle enable/disable toggle
   */
  const handleToggleEnabled = (e) => {
    setIsEnabled(e.target.checked);
    setSaveStatus(null);
  };

  /**
   * Toggle URL visibility
   */
  const toggleUrlVisibility = () => {
    setShowFullUrl(!showFullUrl);
  };

  /**
   * Check if configuration has changed
   */
  const hasChanges = () => {
    return (
      webhookUrl !== (settings.discordWebhookUrl || '') ||
      isEnabled !== (settings.discordEnabled || false)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Discord Webhook Configuration
        </h3>
        <p className="text-sm text-gray-600">
          Configure Discord webhook to receive system notifications for important events
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggleEnabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Enable Discord Notifications
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500 ml-7">
          When enabled, system will send notifications to Discord for important events
        </p>
      </div>

      {/* Webhook URL Input */}
      <div className="mb-6">
        <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL
        </label>
        <div className="relative">
          <input
            type={showFullUrl ? 'text' : 'password'}
            id="webhookUrl"
            value={webhookUrl}
            onChange={handleUrlChange}
            onBlur={validateUrl}
            placeholder="https://discord.com/api/webhooks/..."
            disabled={isSaving || settingsLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {webhookUrl && (
            <button
              type="button"
              onClick={toggleUrlVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              title={showFullUrl ? 'Hide URL' : 'Show URL'}
            >
              {showFullUrl ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        
        {validationError && (
          <p className="mt-1 text-sm text-red-600">{validationError}</p>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Get your webhook URL from Discord: Server Settings → Integrations → Webhooks
        </p>
      </div>

      {/* Connection Status */}
      {testStatus && (
        <div
          className={`mb-6 p-4 rounded-md ${
            testStatus.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {testStatus.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                testStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {testStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Status */}
      {saveStatus && (
        <div
          className={`mb-6 p-4 rounded-md ${
            saveStatus.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {saveStatus.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                saveStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {saveStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={handleTestWebhook}
          disabled={!webhookUrl.trim() || isTesting || isSaving || settingsLoading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Testing...
            </>
          ) : (
            'Test Webhook'
          )}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges() || isSaving || settingsLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          How to set up Discord webhook:
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Open your Discord server</li>
          <li>Go to Server Settings → Integrations</li>
          <li>Click "Create Webhook" or select an existing webhook</li>
          <li>Copy the webhook URL</li>
          <li>Paste it here and click "Test Webhook"</li>
          <li>If successful, enable notifications and save</li>
        </ol>
      </div>
    </div>
  );
};

export default DiscordWebhookConfig;
