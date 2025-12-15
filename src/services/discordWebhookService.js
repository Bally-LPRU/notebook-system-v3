/**
 * Discord Webhook Service
 * Handles Discord webhook notifications for system events
 * Based on admin-settings-system design document
 * Requirements: 5.1, 5.3, 5.4, 5.5
 */

import settingsService from './settingsService';

/**
 * Discord Webhook Service Class
 */
class DiscordWebhookService {
  /**
   * Validate Discord webhook URL format
   * @param {string} url - Discord webhook URL to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateWebhookUrl(url) {
    // Check if URL is provided
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'Webhook URL is required'
      };
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Check if empty after trimming
    if (trimmedUrl.length === 0) {
      return {
        isValid: false,
        error: 'Webhook URL cannot be empty'
      };
    }

    // Discord webhook URL pattern
    // Format: https://discord.com/api/webhooks/{webhook.id}/{webhook.token}
    const discordWebhookPattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    
    // Alternative format: https://discordapp.com/api/webhooks/{webhook.id}/{webhook.token}
    const discordAppWebhookPattern = /^https:\/\/discordapp\.com\/api\/webhooks\/\d+\/[\w-]+$/;

    if (!discordWebhookPattern.test(trimmedUrl) && !discordAppWebhookPattern.test(trimmedUrl)) {
      return {
        isValid: false,
        error: 'Invalid Discord webhook URL format. Expected format: https://discord.com/api/webhooks/{id}/{token}'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Send a notification to Discord webhook
   * @param {string} message - Message to send (can be string or embed object)
   * @param {Object} options - Additional options
   * @param {string} options.webhookUrl - Override webhook URL (optional)
   * @param {string} options.username - Override bot username (optional)
   * @param {string} options.avatarUrl - Override bot avatar (optional)
   * @param {Array} options.embeds - Discord embeds array (optional)
   * @returns {Promise<Object>} Result object with success status
   */
  async sendDiscordNotification(message, options = {}) {
    try {
      // Get webhook URL from options or settings
      let webhookUrl = options.webhookUrl;
      
      if (!webhookUrl) {
        const settings = await settingsService.getSettings();
        webhookUrl = settings.discordWebhookUrl;
        
        // Check if Discord is enabled
        if (!settings.discordEnabled) {
          console.log('Discord notifications are disabled');
          return {
            success: false,
            error: 'Discord notifications are disabled'
          };
        }
      }

      // Validate webhook URL
      const validation = this.validateWebhookUrl(webhookUrl);
      if (!validation.isValid) {
        console.error('Invalid webhook URL:', validation.error);
        return {
          success: false,
          error: validation.error
        };
      }

      // Prepare Discord payload
      const payload = this._formatDiscordPayload(message, options);

      // Send to Discord
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discord webhook error:', response.status, errorText);
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          return {
            success: false,
            error: `Rate limited. Retry after ${retryAfter} seconds`,
            retryAfter: parseInt(retryAfter, 10)
          };
        }

        return {
          success: false,
          error: `Discord API error: ${response.status} ${response.statusText}`
        };
      }

      return {
        success: true,
        error: null
      };

    } catch (error) {
      console.error('Error sending Discord notification:', error);
      
      // Log error but don't fail the operation
      this._logError(error, message);

      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Test Discord webhook connection
   * @param {string} webhookUrl - Webhook URL to test
   * @returns {Promise<Object>} Test result with success status
   */
  async testWebhook(webhookUrl) {
    try {
      // Validate URL first
      const validation = this.validateWebhookUrl(webhookUrl);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Send test message
      const testMessage = {
        content: '✅ Discord webhook test successful!',
        embeds: [{
          title: 'Webhook Connection Test',
          description: 'This is a test message from the Equipment Lending System.',
          color: 0x00ff00, // Green
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Equipment Lending System'
          }
        }]
      };

      const result = await this.sendDiscordNotification(testMessage.content, {
        webhookUrl,
        embeds: testMessage.embeds
      });

      return result;

    } catch (error) {
      console.error('Error testing Discord webhook:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Send notification for new loan request
   * @param {Object} loanRequest - Loan request data
   * @returns {Promise<Object>} Result object
   */
  async notifyNewLoanRequest(loanRequest) {
    try {
      const embed = {
        title: '📋 New Loan Request',
        color: 0x3498db, // Blue
        fields: [
          {
            name: 'Requester',
            value: loanRequest.userName || 'Unknown',
            inline: true
          },
          {
            name: 'Equipment',
            value: loanRequest.equipmentName || 'Unknown',
            inline: true
          },
          {
            name: 'Status',
            value: loanRequest.status || 'pending',
            inline: true
          },
          {
            name: 'Borrow Date',
            value: loanRequest.borrowDate ? new Date(loanRequest.borrowDate).toLocaleDateString() : 'N/A',
            inline: true
          },
          {
            name: 'Return Date',
            value: loanRequest.returnDate ? new Date(loanRequest.returnDate).toLocaleDateString() : 'N/A',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Equipment Lending System'
        }
      };

      if (loanRequest.purpose) {
        embed.fields.push({
          name: 'Purpose',
          value: loanRequest.purpose,
          inline: false
        });
      }

      return await this.sendDiscordNotification('New loan request received', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending new loan request notification:', error);
      this._logError(error, 'New loan request notification');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification for overdue equipment
   * @param {Object} overdueInfo - Overdue equipment information
   * @returns {Promise<Object>} Result object
   */
  async notifyOverdueEquipment(overdueInfo) {
    try {
      const embed = {
        title: '⚠️ Overdue Equipment Alert',
        color: 0xe74c3c, // Red
        fields: [
          {
            name: 'Borrower',
            value: overdueInfo.userName || 'Unknown',
            inline: true
          },
          {
            name: 'Equipment',
            value: overdueInfo.equipmentName || 'Unknown',
            inline: true
          },
          {
            name: 'Days Overdue',
            value: overdueInfo.daysOverdue?.toString() || 'N/A',
            inline: true
          },
          {
            name: 'Expected Return Date',
            value: overdueInfo.returnDate ? new Date(overdueInfo.returnDate).toLocaleDateString() : 'N/A',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Equipment Lending System'
        }
      };

      return await this.sendDiscordNotification('Overdue equipment detected', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending overdue equipment notification:', error);
      this._logError(error, 'Overdue equipment notification');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification when loan request is approved
   * @param {Object} loanRequest - Loan request data
   * @param {string} adminName - Admin who approved
   * @returns {Promise<Object>} Result object
   */
  async notifyLoanApproved(loanRequest, adminName = 'Admin') {
    try {
      const embed = {
        title: '✅ คำขอยืมอุปกรณ์ได้รับการอนุมัติ',
        color: 0x2ecc71, // Green
        fields: [
          {
            name: 'ผู้ขอยืม',
            value: loanRequest.userName || loanRequest._userName || 'Unknown',
            inline: true
          },
          {
            name: 'อุปกรณ์',
            value: loanRequest.equipmentName || loanRequest._equipmentName || 'Unknown',
            inline: true
          },
          {
            name: 'อนุมัติโดย',
            value: adminName,
            inline: true
          },
          {
            name: 'วันที่ยืม',
            value: this._formatDate(loanRequest.borrowDate || loanRequest.startDate),
            inline: true
          },
          {
            name: 'วันที่คืน',
            value: this._formatDate(loanRequest.returnDate || loanRequest.expectedReturnDate),
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      return await this.sendDiscordNotification('คำขอยืมอุปกรณ์ได้รับการอนุมัติ', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending loan approved notification:', error);
      this._logError(error, 'Loan approved notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification when loan request is rejected
   * @param {Object} loanRequest - Loan request data
   * @param {string} adminName - Admin who rejected
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Result object
   */
  async notifyLoanRejected(loanRequest, adminName = 'Admin', reason = '') {
    try {
      const embed = {
        title: '❌ คำขอยืมอุปกรณ์ถูกปฏิเสธ',
        color: 0xe74c3c, // Red
        fields: [
          {
            name: 'ผู้ขอยืม',
            value: loanRequest.userName || loanRequest._userName || 'Unknown',
            inline: true
          },
          {
            name: 'อุปกรณ์',
            value: loanRequest.equipmentName || loanRequest._equipmentName || 'Unknown',
            inline: true
          },
          {
            name: 'ปฏิเสธโดย',
            value: adminName,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      if (reason) {
        embed.fields.push({
          name: 'เหตุผล',
          value: reason,
          inline: false
        });
      }

      return await this.sendDiscordNotification('คำขอยืมอุปกรณ์ถูกปฏิเสธ', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending loan rejected notification:', error);
      this._logError(error, 'Loan rejected notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification when equipment is returned
   * @param {Object} loanRequest - Loan request data
   * @param {string} adminName - Admin who processed return
   * @returns {Promise<Object>} Result object
   */
  async notifyEquipmentReturned(loanRequest, adminName = 'Admin') {
    try {
      const embed = {
        title: '📦 อุปกรณ์ถูกคืนแล้ว',
        color: 0x9b59b6, // Purple
        fields: [
          {
            name: 'ผู้คืน',
            value: loanRequest.userName || loanRequest._userName || 'Unknown',
            inline: true
          },
          {
            name: 'อุปกรณ์',
            value: loanRequest.equipmentName || loanRequest._equipmentName || 'Unknown',
            inline: true
          },
          {
            name: 'รับคืนโดย',
            value: adminName,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      return await this.sendDiscordNotification('อุปกรณ์ถูกคืนแล้ว', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending equipment returned notification:', error);
      this._logError(error, 'Equipment returned notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification for new user registration
   * @param {Object} user - User data
   * @returns {Promise<Object>} Result object
   */
  async notifyNewUserRegistration(user) {
    try {
      const embed = {
        title: '👤 ผู้ใช้ใหม่สมัครสมาชิก',
        color: 0x1abc9c, // Teal
        fields: [
          {
            name: 'ชื่อ',
            value: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || 'Unknown',
            inline: true
          },
          {
            name: 'อีเมล',
            value: user.email || 'Unknown',
            inline: true
          },
          {
            name: 'แผนก',
            value: user.department || 'ไม่ระบุ',
            inline: true
          },
          {
            name: 'สถานะ',
            value: 'รอการอนุมัติ',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      return await this.sendDiscordNotification('มีผู้ใช้ใหม่รอการอนุมัติ', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending new user registration notification:', error);
      this._logError(error, 'New user registration notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification when user is approved
   * @param {Object} user - User data
   * @param {string} adminName - Admin who approved
   * @returns {Promise<Object>} Result object
   */
  async notifyUserApproved(user, adminName = 'Admin') {
    try {
      const embed = {
        title: '✅ ผู้ใช้ได้รับการอนุมัติ',
        color: 0x2ecc71, // Green
        fields: [
          {
            name: 'ชื่อ',
            value: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || 'Unknown',
            inline: true
          },
          {
            name: 'อีเมล',
            value: user.email || 'Unknown',
            inline: true
          },
          {
            name: 'อนุมัติโดย',
            value: adminName,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      return await this.sendDiscordNotification('ผู้ใช้ได้รับการอนุมัติ', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending user approved notification:', error);
      this._logError(error, 'User approved notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification when user is rejected
   * @param {Object} user - User data
   * @param {string} adminName - Admin who rejected
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Result object
   */
  async notifyUserRejected(user, adminName = 'Admin', reason = '') {
    try {
      const embed = {
        title: '❌ ผู้ใช้ถูกปฏิเสธ',
        color: 0xe74c3c, // Red
        fields: [
          {
            name: 'ชื่อ',
            value: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || 'Unknown',
            inline: true
          },
          {
            name: 'อีเมล',
            value: user.email || 'Unknown',
            inline: true
          },
          {
            name: 'ปฏิเสธโดย',
            value: adminName,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      if (reason) {
        embed.fields.push({
          name: 'เหตุผล',
          value: reason,
          inline: false
        });
      }

      return await this.sendDiscordNotification('ผู้ใช้ถูกปฏิเสธ', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending user rejected notification:', error);
      this._logError(error, 'User rejected notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification for new reservation request
   * @param {Object} reservation - Reservation data
   * @returns {Promise<Object>} Result object
   */
  async notifyNewReservation(reservation) {
    try {
      const embed = {
        title: '📅 คำขอจองอุปกรณ์ใหม่',
        color: 0x9b59b6, // Purple
        fields: [
          {
            name: 'ผู้จอง',
            value: reservation.userName || 'Unknown',
            inline: true
          },
          {
            name: 'อุปกรณ์',
            value: reservation.equipmentName || 'Unknown',
            inline: true
          },
          {
            name: 'วันที่จอง',
            value: this._formatDate(reservation.startTime),
            inline: true
          },
          {
            name: 'สถานะ',
            value: 'รอการอนุมัติ',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ระบบยืม-คืนอุปกรณ์'
        }
      };

      if (reservation.purpose) {
        embed.fields.push({
          name: 'วัตถุประสงค์',
          value: reservation.purpose,
          inline: false
        });
      }

      return await this.sendDiscordNotification('มีคำขอจองอุปกรณ์ใหม่', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending new reservation notification:', error);
      this._logError(error, 'New reservation notification');
      return { success: false, error: error.message };
    }
  }

  /**
   * Format date for display
   * @private
   * @param {*} date - Date to format
   * @returns {string} Formatted date
   */
  _formatDate(date) {
    if (!date) return 'N/A';
    
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  /**
   * Send notification for critical setting changes
   * @param {Object} changeInfo - Setting change information
   * @returns {Promise<Object>} Result object
   */
  async notifyCriticalSettingChange(changeInfo) {
    try {
      const embed = {
        title: '🔧 Critical Setting Changed',
        color: 0xf39c12, // Orange
        fields: [
          {
            name: 'Setting',
            value: changeInfo.settingName || 'Unknown',
            inline: true
          },
          {
            name: 'Changed By',
            value: changeInfo.adminName || 'Unknown Admin',
            inline: true
          },
          {
            name: 'Old Value',
            value: this._formatValue(changeInfo.oldValue),
            inline: true
          },
          {
            name: 'New Value',
            value: this._formatValue(changeInfo.newValue),
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Equipment Lending System'
        }
      };

      if (changeInfo.reason) {
        embed.fields.push({
          name: 'Reason',
          value: changeInfo.reason,
          inline: false
        });
      }

      return await this.sendDiscordNotification('Critical system setting changed', {
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error sending critical setting change notification:', error);
      this._logError(error, 'Critical setting change notification');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format Discord payload
   * @private
   * @param {string|Object} message - Message content
   * @param {Object} options - Additional options
   * @returns {Object} Formatted Discord payload
   */
  _formatDiscordPayload(message, options = {}) {
    const payload = {};

    // Add content if it's a string
    if (typeof message === 'string') {
      payload.content = message;
    }

    // Add username override
    if (options.username) {
      payload.username = options.username;
    }

    // Add avatar URL override
    if (options.avatarUrl) {
      payload.avatar_url = options.avatarUrl;
    }

    // Add embeds
    if (options.embeds && Array.isArray(options.embeds)) {
      payload.embeds = options.embeds;
    }

    return payload;
  }

  /**
   * Format value for display
   * @private
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  _formatValue(value) {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  /**
   * Log error to console and potentially to error tracking service
   * @private
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   */
  _logError(error, context) {
    console.error(`Discord webhook error in ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, etc.
  }
}

// Export singleton instance
export default new DiscordWebhookService();
