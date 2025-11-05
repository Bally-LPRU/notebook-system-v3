import React from 'react';
import HelpTooltip from './HelpTooltip';

const FormGuidance = ({ 
  fieldName, 
  helpText, 
  examples = [], 
  formatRequirements = [],
  tips = [],
  showInline = false,
  className = '' 
}) => {
  const fieldGuidance = {
    firstName: {
      helpText: 'กรอกชื่อจริงของคุณตามบัตรประชาชน',
      examples: ['สมชาย', 'Mary', 'อนุชา'],
      formatRequirements: [
        'ใช้ภาษาไทยหรือภาษาอังกฤษ',
        'ไม่ใส่ตัวเลขหรือสัญลักษณ์พิเศษ',
        'ความยาว 1-50 ตัวอักษร'
      ],
      tips: ['ใช้ชื่อที่ปรากฏในเอกสารทางการ']
    },
    lastName: {
      helpText: 'กรอกนามสกุลของคุณตามบัตรประชาชน',
      examples: ['ใจดี', 'Smith', 'รักเรียน'],
      formatRequirements: [
        'ใช้ภาษาไทยหรือภาษาอังกฤษ',
        'ไม่ใส่ตัวเลขหรือสัญลักษณ์พิเศษ',
        'ความยาว 1-50 ตัวอักษร'
      ],
      tips: ['ใช้นามสกุลที่ปรากฏในเอกสารทางการ']
    },
    phoneNumber: {
      helpText: 'กรอกหมายเลขโทรศัพท์มือถือที่สามารถติดต่อได้',
      examples: ['0812345678', '0987654321', '0651234567'],
      formatRequirements: [
        'ใช้ตัวเลข 9-10 หลัก',
        'เริ่มต้นด้วย 06, 08, 09',
        'ไม่ใส่เครื่องหมาย - หรือช่องว่าง'
      ],
      tips: [
        'ใช้เบอร์ที่สามารถรับสายได้',
        'เบอร์นี้จะใช้สำหรับการติดต่อเกี่ยวกับการยืม-คืนอุปกรณ์'
      ]
    },
    department: {
      helpText: 'เลือกสังกัด/แผนกที่คุณสังกัดอยู่',
      examples: [],
      formatRequirements: [
        'เลือกจากรายการที่กำหนดไว้',
        'ไม่สามารถกรอกข้อความเองได้'
      ],
      tips: [
        'หากไม่แน่ใจ ให้เลือก "สำนักงานคณบดี"',
        'สังกัดนี้จะใช้สำหรับการจัดการสิทธิ์การยืมอุปกรณ์'
      ]
    },
    userType: {
      helpText: 'เลือกประเภทผู้ใช้ที่ตรงกับสถานะของคุณ',
      examples: [],
      formatRequirements: [
        'นักศึกษา: สำหรับนักศึกษาทุกระดับ',
        'อาจารย์: สำหรับอาจารย์และผู้สอน',
        'เจ้าหน้าที่: สำหรับบุคลากรและเจ้าหน้าที่'
      ],
      tips: [
        'ประเภทผู้ใช้จะกำหนดสิทธิ์และระยะเวลาการยืมอุปกรณ์',
        'หากไม่แน่ใจ ให้เลือกตามตำแหน่งงานหลักของคุณ'
      ]
    }
  };

  const guidance = fieldGuidance[fieldName] || {
    helpText: helpText || '',
    examples: examples,
    formatRequirements: formatRequirements,
    tips: tips
  };

  const TooltipContent = () => (
    <div className="space-y-2">
      {guidance.helpText && (
        <p className="font-medium">{guidance.helpText}</p>
      )}
      
      {guidance.examples.length > 0 && (
        <div>
          <p className="font-medium text-gray-200 mb-1">ตัวอย่าง:</p>
          <ul className="text-sm space-y-1">
            {guidance.examples.map((example, index) => (
              <li key={index} className="text-gray-300">• {example}</li>
            ))}
          </ul>
        </div>
      )}
      
      {guidance.formatRequirements.length > 0 && (
        <div>
          <p className="font-medium text-gray-200 mb-1">รูปแบบที่ถูกต้อง:</p>
          <ul className="text-sm space-y-1">
            {guidance.formatRequirements.map((req, index) => (
              <li key={index} className="text-gray-300">• {req}</li>
            ))}
          </ul>
        </div>
      )}
      
      {guidance.tips.length > 0 && (
        <div>
          <p className="font-medium text-gray-200 mb-1">เคล็ดลับ:</p>
          <ul className="text-sm space-y-1">
            {guidance.tips.map((tip, index) => (
              <li key={index} className="text-gray-300">💡 {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const InlineGuidance = () => (
    <div className={`mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
      {guidance.helpText && (
        <p className="text-sm text-blue-800 mb-2">{guidance.helpText}</p>
      )}
      
      {guidance.examples.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-blue-700 mb-1">ตัวอย่าง:</p>
          <div className="flex flex-wrap gap-1">
            {guidance.examples.map((example, index) => (
              <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                {example}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {guidance.formatRequirements.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-blue-700 mb-1">รูปแบบที่ถูกต้อง:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            {guidance.formatRequirements.map((req, index) => (
              <li key={index}>• {req}</li>
            ))}
          </ul>
        </div>
      )}
      
      {guidance.tips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-blue-700 mb-1">เคล็ดลับ:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            {guidance.tips.map((tip, index) => (
              <li key={index}>💡 {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (showInline) {
    return <InlineGuidance />;
  }

  return (
    <HelpTooltip content={<TooltipContent />} position="top" trigger="hover">
      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </HelpTooltip>
  );
};

export default FormGuidance;