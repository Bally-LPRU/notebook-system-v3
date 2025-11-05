import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  and,
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import EquipmentManagementService from './equipmentManagementService';
import EquipmentExportService from './equipmentExportService';
import { EQUIPMENT_MANAGEMENT_STATUS } from '../types/equipmentManagement';

class EquipmentReportService {
  static REPORT_TEMPLATES_COLLECTION = 'equipmentReportTemplates';
  static GENERATED_REPORTS_COLLECTION = 'equipmentGeneratedReports';

  /**
   * Generate equipment inventory report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Inventory report data
   */
  static async generateInventoryReport(filters = {}) {
    try {
      const {
        categories = [],
        statuses = [],
        dateRange = null,
        includeImages = false
      } = filters;

      // Get equipment data
      const equipmentData = await EquipmentManagementService.getEquipmentList({
        categories,
        statuses,
        dateRange,
        limit: 10000 // Get all equipment for report
      });

      const equipment = equipmentData.equipment;

      // Calculate statistics
      const stats = this.calculateInventoryStats(equipment);

      // Group by category
      const categoryBreakdown = this.groupEquipmentByCategory(equipment);

      // Group by status
      const statusBreakdown = this.groupEquipmentByStatus(equipment);

      // Calculate value statistics
      const valueStats = this.calculateValueStats(equipment);

      return {
        reportType: 'inventory',
        generatedAt: new Date(),
        filters,
        summary: {
          totalEquipment: equipment.length,
          totalValue: valueStats.totalValue,
          averageValue: valueStats.averageValue,
          ...stats
        },
        equipment,
        categoryBreakdown,
        statusBreakdown,
        valueStats,
        chartData: {
          categoryChart: this.prepareCategoryChartData(categoryBreakdown),
          statusChart: this.prepareStatusChartData(statusBreakdown),
          valueChart: this.prepareValueChartData(equipment)
        }
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw error;
    }
  }

  /**
   * Generate equipment utilization report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Utilization report data
   */
  static async generateUtilizationReport(filters = {}) {
    try {
      const {
        dateRange = {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        }
      } = filters;

      // Get equipment data
      const equipmentData = await EquipmentManagementService.getEquipmentList({
        limit: 10000
      });

      const equipment = equipmentData.equipment;

      // Calculate utilization metrics
      const utilizationStats = this.calculateUtilizationStats(equipment);

      // Get most viewed equipment
      const mostViewed = equipment
        .filter(item => item.viewCount > 0)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 10);

      // Get recently added equipment
      const recentlyAdded = equipment
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 10);

      // Get recently updated equipment
      const recentlyUpdated = equipment
        .sort((a, b) => {
          const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt);
          const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt);
          return dateB - dateA;
        })
        .slice(0, 10);

      return {
        reportType: 'utilization',
        generatedAt: new Date(),
        filters,
        summary: utilizationStats,
        mostViewed,
        recentlyAdded,
        recentlyUpdated,
        chartData: {
          utilizationTrend: this.prepareUtilizationTrendData(equipment),
          categoryUtilization: this.prepareCategoryUtilizationData(equipment)
        }
      };
    } catch (error) {
      console.error('Error generating utilization report:', error);
      throw error;
    }
  }

  /**
   * Generate equipment maintenance report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Maintenance report data
   */
  static async generateMaintenanceReport(filters = {}) {
    try {
      // Get equipment data
      const equipmentData = await EquipmentManagementService.getEquipmentList({
        statuses: [EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE, EQUIPMENT_MANAGEMENT_STATUS.RETIRED],
        limit: 10000
      });

      const equipment = equipmentData.equipment;

      // Get equipment needing maintenance (based on age or usage)
      const needsMaintenance = this.identifyMaintenanceNeeds(equipment);

      // Get warranty expiring soon
      const warrantyExpiring = this.getWarrantyExpiring(equipment);

      // Calculate maintenance statistics
      const maintenanceStats = this.calculateMaintenanceStats(equipment);

      return {
        reportType: 'maintenance',
        generatedAt: new Date(),
        filters,
        summary: maintenanceStats,
        equipmentInMaintenance: equipment.filter(item => 
          item.status === EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE
        ),
        retiredEquipment: equipment.filter(item => 
          item.status === EQUIPMENT_MANAGEMENT_STATUS.RETIRED
        ),
        needsMaintenance,
        warrantyExpiring,
        chartData: {
          maintenanceByCategory: this.prepareMaintenanceByCategoryData(equipment),
          warrantyStatus: this.prepareWarrantyStatusData(equipment)
        }
      };
    } catch (error) {
      console.error('Error generating maintenance report:', error);
      throw error;
    }
  }

  /**
   * Generate custom report based on template
   * @param {Object} template - Report template
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Custom report data
   */
  static async generateCustomReport(template, filters = {}) {
    try {
      const {
        fields = [],
        groupBy = null,
        sortBy = 'name',
        sortOrder = 'asc',
        includeCharts = true,
        includeImages = false
      } = template;

      // Get equipment data with filters
      const equipmentData = await EquipmentManagementService.getEquipmentList({
        ...filters,
        sortBy,
        sortOrder,
        limit: 10000
      });

      const equipment = equipmentData.equipment;

      // Filter fields if specified
      const reportData = fields.length > 0 
        ? equipment.map(item => this.extractFields(item, fields))
        : equipment;

      // Group data if specified
      const groupedData = groupBy 
        ? this.groupDataBy(reportData, groupBy)
        : null;

      // Generate statistics
      const statistics = this.generateCustomStatistics(reportData, template);

      // Generate charts if requested
      const chartData = includeCharts 
        ? this.generateCustomCharts(reportData, template)
        : null;

      return {
        reportType: 'custom',
        template: template.name || 'Custom Report',
        generatedAt: new Date(),
        filters,
        summary: {
          totalRecords: reportData.length,
          ...statistics
        },
        data: reportData,
        groupedData,
        chartData
      };
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  /**
   * Get predefined report templates
   * @returns {Array} Array of predefined templates
   */
  static getPredefinedTemplates() {
    return [
      {
        id: 'inventory_summary',
        name: 'สรุปภาพรวมอุปกรณ์',
        description: 'รายงานสรุปจำนวนและมูลค่าอุปกรณ์ทั้งหมด',
        type: 'inventory',
        fields: [
          'equipmentNumber', 'name', 'category.name', 'status', 
          'purchasePrice', 'purchaseDate', 'location.building'
        ],
        groupBy: 'category.name',
        includeCharts: true,
        chartTypes: ['pie', 'bar']
      },
      {
        id: 'equipment_by_category',
        name: 'อุปกรณ์จำแนกตามประเภท',
        description: 'รายงานอุปกรณ์แยกตามประเภทพร้อมสถิติ',
        type: 'inventory',
        fields: [
          'equipmentNumber', 'name', 'brand', 'model', 'status', 'purchasePrice'
        ],
        groupBy: 'category.name',
        includeCharts: true,
        chartTypes: ['bar', 'doughnut']
      },
      {
        id: 'high_value_equipment',
        name: 'อุปกรณ์มูลค่าสูง',
        description: 'รายงานอุปกรณ์ที่มีมูลค่าสูง (เกิน 50,000 บาท)',
        type: 'inventory',
        fields: [
          'equipmentNumber', 'name', 'category.name', 'brand', 'model',
          'purchasePrice', 'purchaseDate', 'responsiblePerson.name'
        ],
        filters: {
          priceRange: { min: 50000 }
        },
        sortBy: 'purchasePrice',
        sortOrder: 'desc',
        includeCharts: true
      },
      {
        id: 'equipment_utilization',
        name: 'การใช้งานอุปกรณ์',
        description: 'รายงานการใช้งานและความนิยมของอุปกรณ์',
        type: 'utilization',
        fields: [
          'equipmentNumber', 'name', 'category.name', 'viewCount',
          'lastViewed', 'status'
        ],
        sortBy: 'viewCount',
        sortOrder: 'desc',
        includeCharts: true,
        chartTypes: ['line', 'bar']
      },
      {
        id: 'maintenance_schedule',
        name: 'กำหนดการบำรุงรักษา',
        description: 'รายงานอุปกรณ์ที่ต้องบำรุงรักษาและหมดประกัน',
        type: 'maintenance',
        fields: [
          'equipmentNumber', 'name', 'category.name', 'status',
          'purchaseDate', 'warrantyExpiry', 'responsiblePerson.name'
        ],
        includeCharts: true
      }
    ];
  }

  /**
   * Save custom report template
   * @param {Object} template - Template data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Saved template
   */
  static async saveReportTemplate(template, userId) {
    try {
      const templateData = {
        name: template.name.trim(),
        description: template.description?.trim() || '',
        type: template.type || 'custom',
        fields: template.fields || [],
        groupBy: template.groupBy || null,
        sortBy: template.sortBy || 'name',
        sortOrder: template.sortOrder || 'asc',
        filters: template.filters || {},
        includeCharts: template.includeCharts || false,
        chartTypes: template.chartTypes || [],
        includeImages: template.includeImages || false,
        createdBy: userId,
        createdAt: serverTimestamp(),
        isPublic: false,
        usageCount: 0
      };

      const docRef = await addDoc(collection(db, this.REPORT_TEMPLATES_COLLECTION), templateData);
      
      return {
        id: docRef.id,
        ...templateData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error saving report template:', error);
      throw error;
    }
  }

  /**
   * Get user's custom report templates
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of templates
   */
  static async getUserReportTemplates(userId) {
    try {
      const templatesRef = collection(db, this.REPORT_TEMPLATES_COLLECTION);
      const q = query(
        templatesRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return templates;
    } catch (error) {
      console.error('Error getting user report templates:', error);
      return [];
    }
  }

  /**
   * Calculate inventory statistics
   * @param {Array} equipment - Equipment array
   * @returns {Object} Statistics object
   */
  static calculateInventoryStats(equipment) {
    const stats = {
      active: 0,
      maintenance: 0,
      retired: 0,
      lost: 0
    };

    equipment.forEach(item => {
      switch (item.status) {
        case EQUIPMENT_MANAGEMENT_STATUS.ACTIVE:
          stats.active++;
          break;
        case EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE:
          stats.maintenance++;
          break;
        case EQUIPMENT_MANAGEMENT_STATUS.RETIRED:
          stats.retired++;
          break;
        case EQUIPMENT_MANAGEMENT_STATUS.LOST:
          stats.lost++;
          break;
      }
    });

    return stats;
  }

  /**
   * Calculate value statistics
   * @param {Array} equipment - Equipment array
   * @returns {Object} Value statistics
   */
  static calculateValueStats(equipment) {
    const values = equipment
      .map(item => item.purchasePrice || 0)
      .filter(price => price > 0);

    if (values.length === 0) {
      return {
        totalValue: 0,
        averageValue: 0,
        minValue: 0,
        maxValue: 0
      };
    }

    const totalValue = values.reduce((sum, value) => sum + value, 0);
    const averageValue = totalValue / values.length;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return {
      totalValue,
      averageValue,
      minValue,
      maxValue
    };
  }

  /**
   * Group equipment by category
   * @param {Array} equipment - Equipment array
   * @returns {Object} Grouped data
   */
  static groupEquipmentByCategory(equipment) {
    const grouped = {};
    
    equipment.forEach(item => {
      const categoryName = item.category?.name || 'ไม่ระบุประเภท';
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          name: categoryName,
          count: 0,
          totalValue: 0,
          equipment: []
        };
      }
      
      grouped[categoryName].count++;
      grouped[categoryName].totalValue += item.purchasePrice || 0;
      grouped[categoryName].equipment.push(item);
    });

    return grouped;
  }

  /**
   * Group equipment by status
   * @param {Array} equipment - Equipment array
   * @returns {Object} Grouped data
   */
  static groupEquipmentByStatus(equipment) {
    const grouped = {};
    
    equipment.forEach(item => {
      const status = item.status || 'ไม่ระบุสถานะ';
      if (!grouped[status]) {
        grouped[status] = {
          status,
          count: 0,
          totalValue: 0,
          equipment: []
        };
      }
      
      grouped[status].count++;
      grouped[status].totalValue += item.purchasePrice || 0;
      grouped[status].equipment.push(item);
    });

    return grouped;
  }

  /**
   * Prepare chart data for categories
   * @param {Object} categoryBreakdown - Category breakdown data
   * @returns {Object} Chart data
   */
  static prepareCategoryChartData(categoryBreakdown) {
    const labels = Object.keys(categoryBreakdown);
    const data = labels.map(label => categoryBreakdown[label].count);
    const colors = this.generateColors(labels.length);

    return {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'จำนวนอุปกรณ์ตามประเภท'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    };
  }

  /**
   * Prepare chart data for status
   * @param {Object} statusBreakdown - Status breakdown data
   * @returns {Object} Chart data
   */
  static prepareStatusChartData(statusBreakdown) {
    const labels = Object.keys(statusBreakdown);
    const data = labels.map(label => statusBreakdown[label].count);
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'สถานะอุปกรณ์'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    };
  }

  /**
   * Generate colors for charts
   * @param {number} count - Number of colors needed
   * @returns {Array} Array of color codes
   */
  static generateColors(count) {
    const baseColors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }

  /**
   * Extract specific fields from equipment object
   * @param {Object} item - Equipment item
   * @param {Array} fields - Fields to extract
   * @returns {Object} Extracted data
   */
  static extractFields(item, fields) {
    const extracted = {};
    
    fields.forEach(fieldKey => {
      const value = EquipmentExportService.getFieldValue(item, fieldKey);
      const label = EquipmentExportService.getFieldLabel(fieldKey);
      extracted[label] = value;
    });
    
    return extracted;
  }

  /**
   * Group data by specified field
   * @param {Array} data - Data array
   * @param {string} groupByField - Field to group by
   * @returns {Object} Grouped data
   */
  static groupDataBy(data, groupByField) {
    const grouped = {};
    
    data.forEach(item => {
      const groupValue = item[groupByField] || 'ไม่ระบุ';
      if (!grouped[groupValue]) {
        grouped[groupValue] = [];
      }
      grouped[groupValue].push(item);
    });
    
    return grouped;
  }

  /**
   * Generate custom statistics based on template
   * @param {Array} data - Report data
   * @param {Object} template - Report template
   * @returns {Object} Statistics
   */
  static generateCustomStatistics(data, template) {
    const stats = {};
    
    // Basic count
    stats.totalRecords = data.length;
    
    // If template specifies numeric fields, calculate statistics
    const numericFields = template.fields?.filter(field => 
      field.includes('Price') || field.includes('Count')
    ) || [];
    
    numericFields.forEach(field => {
      const values = data
        .map(item => parseFloat(item[field]) || 0)
        .filter(value => value > 0);
      
      if (values.length > 0) {
        stats[`${field}_total`] = values.reduce((sum, value) => sum + value, 0);
        stats[`${field}_average`] = stats[`${field}_total`] / values.length;
        stats[`${field}_min`] = Math.min(...values);
        stats[`${field}_max`] = Math.max(...values);
      }
    });
    
    return stats;
  }

  /**
   * Generate custom charts based on template
   * @param {Array} data - Report data
   * @param {Object} template - Report template
   * @returns {Object} Chart data
   */
  static generateCustomCharts(data, template) {
    const charts = {};
    
    if (template.groupBy) {
      const grouped = this.groupDataBy(data, template.groupBy);
      const labels = Object.keys(grouped);
      const counts = labels.map(label => grouped[label].length);
      
      charts.groupedChart = {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'จำนวน',
            data: counts,
            backgroundColor: this.generateColors(labels.length)
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `จำนวนตาม${template.groupBy}`
            }
          }
        }
      };
    }
    
    return charts;
  }

  /**
   * Calculate utilization statistics
   * @param {Array} equipment - Equipment array
   * @returns {Object} Utilization statistics
   */
  static calculateUtilizationStats(equipment) {
    const totalEquipment = equipment.length;
    const equipmentWithViews = equipment.filter(item => (item.viewCount || 0) > 0);
    const totalViews = equipment.reduce((sum, item) => sum + (item.viewCount || 0), 0);
    
    return {
      totalEquipment,
      equipmentWithViews: equipmentWithViews.length,
      utilizationRate: totalEquipment > 0 ? (equipmentWithViews.length / totalEquipment * 100).toFixed(1) : 0,
      totalViews,
      averageViews: totalEquipment > 0 ? (totalViews / totalEquipment).toFixed(1) : 0
    };
  }

  /**
   * Calculate maintenance statistics
   * @param {Array} equipment - Equipment array
   * @returns {Object} Maintenance statistics
   */
  static calculateMaintenanceStats(equipment) {
    const inMaintenance = equipment.filter(item => 
      item.status === EQUIPMENT_MANAGEMENT_STATUS.MAINTENANCE
    ).length;
    
    const retired = equipment.filter(item => 
      item.status === EQUIPMENT_MANAGEMENT_STATUS.RETIRED
    ).length;
    
    const warrantyExpiring = this.getWarrantyExpiring(equipment).length;
    
    return {
      inMaintenance,
      retired,
      warrantyExpiring,
      maintenanceRate: equipment.length > 0 ? (inMaintenance / equipment.length * 100).toFixed(1) : 0
    };
  }

  /**
   * Get equipment with warranty expiring soon
   * @param {Array} equipment - Equipment array
   * @param {number} daysAhead - Days ahead to check (default 30)
   * @returns {Array} Equipment with expiring warranty
   */
  static getWarrantyExpiring(equipment, daysAhead = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    return equipment.filter(item => {
      if (!item.warrantyExpiry) return false;
      
      const warrantyDate = item.warrantyExpiry.toDate ? 
        item.warrantyExpiry.toDate() : 
        new Date(item.warrantyExpiry);
      
      return warrantyDate <= cutoffDate && warrantyDate >= new Date();
    });
  }

  /**
   * Identify equipment that needs maintenance
   * @param {Array} equipment - Equipment array
   * @returns {Array} Equipment needing maintenance
   */
  static identifyMaintenanceNeeds(equipment) {
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
    
    return equipment.filter(item => {
      // Equipment older than 1 year without recent maintenance
      const purchaseDate = item.purchaseDate?.toDate ? 
        item.purchaseDate.toDate() : 
        new Date(item.purchaseDate);
      
      return purchaseDate < oneYearAgo && 
             item.status === EQUIPMENT_MANAGEMENT_STATUS.ACTIVE &&
             (item.viewCount || 0) > 10; // High usage equipment
    });
  }
}

export default EquipmentReportService;