import React from "react";

export function FormHeader() {
  return (
    <div className="bg-gray-100 xl:w-full p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="https://digri.ai/wp-content/uploads/2023/12/Logo-2-768x258.png"
            alt="College Logo"
            className="h-16 w-32"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sri Eshwar College of Engineering
            </h1>
            <p className="text-sm text-gray-600">(An Autonomous Institution)</p>
            <p className="text-sm text-gray-600">
              Kondampatti (Post), Kinathukadavu (Tk.), Coimbatore - 641 202
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold">Transport Requisition Form</h2>
          <p className="text-sm text-gray-600">IQAC/2024/001/e</p>
        </div>
      </div>
    </div>
  );
}
