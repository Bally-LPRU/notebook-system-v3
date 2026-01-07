const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* ผู้พัฒนาและระบบ */}
          <div>
            <div className="flex items-center mb-2">
              <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center mr-2">
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">ระบบยืม-คืนอุปกรณ์</span>
            </div>
            <p className="text-gray-400 text-xs">ผู้พัฒนา: นายพิสิฐ เทียมเย็น</p>
          </div>

          {/* เจ้าหน้าที่ให้บริการ */}
          <div>
            <p className="font-medium mb-1">เจ้าหน้าที่ให้บริการ</p>
            <div className="text-gray-400 text-xs space-y-0.5">
              <p>นายพิสิฐ เทียมเย็น <a href="tel:0898555668" className="text-blue-400 hover:text-blue-300">089-8555668</a></p>
              <p>นายธนวัฒน์ แต้คำ <a href="tel:0644699559" className="text-blue-400 hover:text-blue-300">064-4699559</a></p>
            </div>
          </div>

          {/* สถานที่ */}
          <div>
            <p className="font-medium mb-1">สถานที่ให้บริการ</p>
            <p className="text-gray-400 text-xs">ห้องบริการวิชาการ ชั้น 2 อาคาร 36</p>
            <p className="text-gray-400 text-xs">คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 pt-3 border-t border-gray-700 text-center text-xs text-gray-500">
          © {currentYear} Equipment Lending System
        </div>
      </div>
    </footer>
  );
};

export default Footer;