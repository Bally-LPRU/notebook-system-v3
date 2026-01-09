/**
 * Firebase Cloud Functions Entry Point
 * 
 * This file exports all Cloud Functions for the Equipment Lending System.
 */

const { checkOverdueLoans, sendLoanReminders, cancelExpiredReservations } = require('./checkOverdueLoans');
const { checkOverdueLoansAdvanced } = require('./checkOverdueLoansAdvanced');
const { checkNoShowReservations } = require('./checkNoShowReservations');
const { generateDailyReport } = require('./generateDailyReport');
const { generateWeeklyAnalytics } = require('./generateWeeklyAnalytics');

// Export all functions
exports.checkOverdueLoans = checkOverdueLoans;
exports.sendLoanReminders = sendLoanReminders;
exports.cancelExpiredReservations = cancelExpiredReservations;

// Admin Intelligence Assistant Functions
exports.checkOverdueLoansAdvanced = checkOverdueLoansAdvanced;
exports.checkNoShowReservations = checkNoShowReservations;
exports.generateDailyReport = generateDailyReport;
exports.generateWeeklyAnalytics = generateWeeklyAnalytics;
