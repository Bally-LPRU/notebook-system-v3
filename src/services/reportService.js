import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  and
} from 'firebase/firestore';
import { db } from '../config/firebase';
import EquipmentService from './equipmentService';
import LoanRequestService from './loanRequestService';
import ReservationService from './reservationService';
import { LOAN_REQUEST_STATUS } from '../types/loanRequest';
import { RESERVATION_STATUS } from '../types/reservation';

class ReportService {
  /**
   * Generate monthly equipment usage report
   * @param {number} year - Year for the report
   * @param {number} month - Month for the report (1-12)
   * @returns {Promise<Object>} Monthly usage report
   */
  static async generateMonthlyUsageReport(year, month) {
    try {
      // Create date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Get all loan requests for the month
      const loanRequestsRef = collection(db, 'loanRequests');
      const loanQuery = query(
        loanRequestsRef,
        and(
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        ),
        orderBy('createdAt', 'desc')
      );

      const loanSnapshot = await getDocs(loanQuery);
      const loanRequests = [];
      
      loanSnapshot.forEach((doc) => {
        loanRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Get all reservations for the month
      const reservationsRef = collection(db, 'reservations');
      const reservationQuery = query(
        reservationsRef,
        and(
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        ),
        orderBy('createdAt', 'desc')
      );

      const reservationSnapshot = await getDocs(reservationQuery);
      const reservations = [];
      
      reservationSnapshot.forEach((doc) => {
        reservations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Get equipment details for all requests
      const equipmentIds = [...new Set([
        ...loanRequests.map(req => req.equipmentId),
        ...reservations.map(res => res.equipmentId)
      ])];

      const equipmentDetails = {};
      for (const equipmentId of equipmentIds) {
        try {
          const equipment = await EquipmentService.getEquipmentById(equipmentId);
          if (equipment) {
            equipmentDetails[equipmentId] = equipment;
          }
        } catch (error) {
          console.error(`Error fetching equipment ${equipmentId}:`, error);
        }
      }

      // Calculate statistics
      const stats = {
        totalLoanRequests: loanRequests.length,
        approvedLoans: loanRequests.filter(req => req.status === LOAN_REQUEST_STATUS.APPROVED).length,
        rejectedLoans: loanRequests.filter(req => req.status === LOAN_REQUEST_STATUS.REJECTED).length,
        returnedLoans: loanRequests.filter(req => req.status === LOAN_REQUEST_STATUS.RETURNED).length,
        overdueLoans: loanRequests.filter(req => req.status === LOAN_REQUEST_STATUS.OVERDUE).length,
        totalReservations: reservations.length,
        approvedReservations: reservations.filter(res => res.status === RESERVATION_STATUS.APPROVED).length,
        completedReservations: reservations.filter(res => res.status === RESERVATION_STATUS.COMPLETED).length,
        cancelledReservations: reservations.filter(res => res.status === RESERVATION_STATUS.CANCELLED).length
      };

      // Calculate equipment usage frequency
      const equipmentUsage = {};
      [...loanRequests, ...reservations].forEach(request => {
        const equipmentId = request.equipmentId;
        if (!equipmentUsage[equipmentId]) {
          equipmentUsage[equipmentId] = {
            equipment: equipmentDetails[equipmentId],
            loanCount: 0,
            reservationCount: 0,
            totalUsage: 0
          };
        }
        
        if (request.hasOwnProperty('borrowDate')) {
          equipmentUsage[equipmentId].loanCount++;
        } else {
          equipmentUsage[equipmentId].reservationCount++;
        }
        equipmentUsage[equipmentId].totalUsage++;
      });

      // Sort equipment by usage
      const popularEquipment = Object.values(equipmentUsage)
        .sort((a, b) => b.totalUsage - a.totalUsage)
        .slice(0, 10);

      return {
        period: {
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleDateString('th-TH', { month: 'long' }),
          startDate,
          endDate
        },
        stats,
        popularEquipment,
        loanRequests: loanRequests.map(req => ({
          ...req,
          equipment: equipmentDetails[req.equipmentId]
        })),
        reservations: reservations.map(res => ({
          ...res,
          equipment: equipmentDetails[res.equipmentId]
        })),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating monthly usage report:', error);
      throw error;
    }
  }

  /**
   * Generate popular equipment report
   * @param {Date} startDate - Start date for the report
   * @param {Date} endDate - End date for the report
   * @param {number} limit - Number of top equipment to include
   * @returns {Promise<Array>} Popular equipment list
   */
  static async generatePopularEquipmentReport(startDate, endDate, limit = 10) {
    try {
      // Get all loan requests in the date range
      const loanRequestsRef = collection(db, 'loanRequests');
      const loanQuery = query(
        loanRequestsRef,
        and(
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate),
          where('status', 'in', [
            LOAN_REQUEST_STATUS.APPROVED,
            LOAN_REQUEST_STATUS.BORROWED,
            LOAN_REQUEST_STATUS.RETURNED
          ])
        )
      );

      const loanSnapshot = await getDocs(loanQuery);
      const loanRequests = [];
      
      loanSnapshot.forEach((doc) => {
        loanRequests.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Get all reservations in the date range
      const reservationsRef = collection(db, 'reservations');
      const reservationQuery = query(
        reservationsRef,
        and(
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate),
          where('status', 'in', [
            RESERVATION_STATUS.APPROVED,
            RESERVATION_STATUS.COMPLETED
          ])
        )
      );

      const reservationSnapshot = await getDocs(reservationQuery);
      const reservations = [];
      
      reservationSnapshot.forEach((doc) => {
        reservations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Count equipment usage
      const equipmentUsage = {};
      
      [...loanRequests, ...reservations].forEach(request => {
        const equipmentId = request.equipmentId;
        if (!equipmentUsage[equipmentId]) {
          equipmentUsage[equipmentId] = {
            equipmentId,
            loanCount: 0,
            reservationCount: 0,
            totalUsage: 0
          };
        }
        
        if (request.hasOwnProperty('borrowDate')) {
          equipmentUsage[equipmentId].loanCount++;
        } else {
          equipmentUsage[equipmentId].reservationCount++;
        }
        equipmentUsage[equipmentId].totalUsage++;
      });

      // Get equipment details and sort by usage
      const popularEquipment = [];
      
      for (const usage of Object.values(equipmentUsage)) {
        try {
          const equipment = await EquipmentService.getEquipmentById(usage.equipmentId);
          if (equipment) {
            popularEquipment.push({
              ...usage,
              equipment
            });
          }
        } catch (error) {
          console.error(`Error fetching equipment ${usage.equipmentId}:`, error);
        }
      }

      return popularEquipment
        .sort((a, b) => b.totalUsage - a.totalUsage)
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating popular equipment report:', error);
      throw error;
    }
  }

  /**
   * Generate overdue users report
   * @returns {Promise<Array>} List of users with overdue equipment
   */
  static async generateOverdueUsersReport() {
    try {
      // Get all overdue loan requests
      const loanRequestsRef = collection(db, 'loanRequests');
      const overdueQuery = query(
        loanRequestsRef,
        where('status', '==', LOAN_REQUEST_STATUS.OVERDUE),
        orderBy('expectedReturnDate', 'asc')
      );

      const overdueSnapshot = await getDocs(overdueQuery);
      const overdueLoans = [];
      
      overdueSnapshot.forEach((doc) => {
        overdueLoans.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Get user and equipment details
      const overdueUsers = [];
      
      for (const loan of overdueLoans) {
        try {
          // Get user details
          const userRef = collection(db, 'users');
          const userQuery = query(userRef, where('__name__', '==', loan.userId));
          const userSnapshot = await getDocs(userQuery);
          const user = userSnapshot.docs[0]?.data();

          // Get equipment details
          const equipment = await EquipmentService.getEquipmentById(loan.equipmentId);

          if (user && equipment) {
            const daysOverdue = Math.floor(
              (new Date() - loan.expectedReturnDate.toDate()) / (1000 * 60 * 60 * 24)
            );

            overdueUsers.push({
              loanId: loan.id,
              user: {
                id: loan.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                department: user.department
              },
              equipment: {
                id: equipment.id,
                name: equipment.name,
                category: equipment.category,
                serialNumber: equipment.serialNumber
              },
              borrowDate: loan.borrowDate.toDate(),
              expectedReturnDate: loan.expectedReturnDate.toDate(),
              daysOverdue,
              purpose: loan.purpose
            });
          }
        } catch (error) {
          console.error(`Error processing overdue loan ${loan.id}:`, error);
        }
      }

      return overdueUsers.sort((a, b) => b.daysOverdue - a.daysOverdue);
    } catch (error) {
      console.error('Error generating overdue users report:', error);
      throw error;
    }
  }

  /**
   * Generate equipment utilization report
   * @returns {Promise<Object>} Equipment utilization statistics
   */
  static async generateEquipmentUtilizationReport() {
    try {
      const equipmentStats = await EquipmentService.getEquipmentStats();
      const loanStats = await LoanRequestService.getLoanRequestStats();
      const reservationStats = await ReservationService.getReservationStats();

      // Calculate utilization rates
      const totalEquipment = equipmentStats.total;
      const utilizationRate = totalEquipment > 0 ? 
        ((equipmentStats.borrowed / totalEquipment) * 100).toFixed(1) : 0;
      
      const availabilityRate = totalEquipment > 0 ? 
        ((equipmentStats.available / totalEquipment) * 100).toFixed(1) : 0;

      const maintenanceRate = totalEquipment > 0 ? 
        ((equipmentStats.maintenance / totalEquipment) * 100).toFixed(1) : 0;

      return {
        equipment: equipmentStats,
        loans: loanStats,
        reservations: reservationStats,
        utilization: {
          utilizationRate: parseFloat(utilizationRate),
          availabilityRate: parseFloat(availabilityRate),
          maintenanceRate: parseFloat(maintenanceRate)
        },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating equipment utilization report:', error);
      throw error;
    }
  }

  /**
   * Export report data to CSV format
   * @param {Array} data - Data to export
   * @param {Array} headers - CSV headers
   * @returns {string} CSV content
   */
  static exportToCSV(data, headers) {
    try {
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      );
      
      return [csvHeaders, ...csvRows].join('\n');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Download file as blob
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType = 'text/csv') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Generate and download monthly usage report as CSV
   * @param {number} year - Year
   * @param {number} month - Month
   */
  static async downloadMonthlyUsageCSV(year, month) {
    try {
      const report = await this.generateMonthlyUsageReport(year, month);
      
      // Prepare loan requests data for CSV
      const loanData = report.loanRequests.map(loan => ({
        'วันที่ขอยืม': loan.createdAt?.toDate().toLocaleDateString('th-TH'),
        'ชื่ออุปกรณ์': loan.equipment?.name || 'ไม่ระบุ',
        'ประเภท': loan.equipment?.category || 'ไม่ระบุ',
        'หมายเลขซีเรียล': loan.equipment?.serialNumber || 'ไม่ระบุ',
        'วันที่ยืม': loan.borrowDate?.toDate().toLocaleDateString('th-TH'),
        'วันที่คืน': loan.expectedReturnDate?.toDate().toLocaleDateString('th-TH'),
        'สถานะ': this.getStatusText(loan.status),
        'วัตถุประสงค์': loan.purpose || 'ไม่ระบุ'
      }));

      const headers = [
        'วันที่ขอยืม', 'ชื่ออุปกรณ์', 'ประเภท', 'หมายเลขซีเรียล',
        'วันที่ยืม', 'วันที่คืน', 'สถานะ', 'วัตถุประสงค์'
      ];

      const csvContent = this.exportToCSV(loanData, headers);
      const filename = `รายงานการใช้งาน_${year}_${month.toString().padStart(2, '0')}.csv`;
      
      this.downloadFile(csvContent, filename);
    } catch (error) {
      console.error('Error downloading monthly usage CSV:', error);
      throw error;
    }
  }

  /**
   * Generate and download popular equipment report as CSV
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  static async downloadPopularEquipmentCSV(startDate, endDate) {
    try {
      const popularEquipment = await this.generatePopularEquipmentReport(startDate, endDate);
      
      const data = popularEquipment.map((item, index) => ({
        'อันดับ': index + 1,
        'ชื่ออุปกรณ์': item.equipment?.name || 'ไม่ระบุ',
        'ประเภท': item.equipment?.category || 'ไม่ระบุ',
        'ยี่ห้อ': item.equipment?.brand || 'ไม่ระบุ',
        'รุ่น': item.equipment?.model || 'ไม่ระบุ',
        'จำนวนครั้งที่ยืม': item.loanCount,
        'จำนวนครั้งที่จอง': item.reservationCount,
        'รวมการใช้งาน': item.totalUsage
      }));

      const headers = [
        'อันดับ', 'ชื่ออุปกรณ์', 'ประเภท', 'ยี่ห้อ', 'รุ่น',
        'จำนวนครั้งที่ยืม', 'จำนวนครั้งที่จอง', 'รวมการใช้งาน'
      ];

      const csvContent = this.exportToCSV(data, headers);
      const filename = `อุปกรณ์ยอดนิยม_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`;
      
      this.downloadFile(csvContent, filename);
    } catch (error) {
      console.error('Error downloading popular equipment CSV:', error);
      throw error;
    }
  }

  /**
   * Generate and download overdue users report as CSV
   */
  static async downloadOverdueUsersCSV() {
    try {
      const overdueUsers = await this.generateOverdueUsersReport();
      
      const data = overdueUsers.map(item => ({
        'ชื่อ-นามสกุล': `${item.user.firstName} ${item.user.lastName}`,
        'อีเมล': item.user.email,
        'เบอร์โทร': item.user.phoneNumber || 'ไม่ระบุ',
        'สังกัด': item.user.department || 'ไม่ระบุ',
        'ชื่ออุปกรณ์': item.equipment.name,
        'หมายเลขซีเรียล': item.equipment.serialNumber,
        'วันที่ยืม': item.borrowDate.toLocaleDateString('th-TH'),
        'วันที่ครบกำหนด': item.expectedReturnDate.toLocaleDateString('th-TH'),
        'จำนวนวันที่เกิน': item.daysOverdue,
        'วัตถุประสงค์': item.purpose || 'ไม่ระบุ'
      }));

      const headers = [
        'ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทร', 'สังกัด', 'ชื่ออุปกรณ์',
        'หมายเลขซีเรียล', 'วันที่ยืม', 'วันที่ครบกำหนด', 'จำนวนวันที่เกิน', 'วัตถุประสงค์'
      ];

      const csvContent = this.exportToCSV(data, headers);
      const filename = `ผู้ใช้คืนล่าช้า_${new Date().toISOString().split('T')[0]}.csv`;
      
      this.downloadFile(csvContent, filename);
    } catch (error) {
      console.error('Error downloading overdue users CSV:', error);
      throw error;
    }
  }

  /**
   * Get status text in Thai
   * @param {string} status - Status code
   * @returns {string} Thai status text
   */
  static getStatusText(status) {
    const statusMap = {
      [LOAN_REQUEST_STATUS.PENDING]: 'รอการอนุมัติ',
      [LOAN_REQUEST_STATUS.APPROVED]: 'อนุมัติแล้ว',
      [LOAN_REQUEST_STATUS.REJECTED]: 'ปฏิเสธ',
      [LOAN_REQUEST_STATUS.BORROWED]: 'กำลังยืม',
      [LOAN_REQUEST_STATUS.RETURNED]: 'คืนแล้ว',
      [LOAN_REQUEST_STATUS.OVERDUE]: 'คืนล่าช้า'
    };
    
    return statusMap[status] || status;
  }
}

export default ReportService;