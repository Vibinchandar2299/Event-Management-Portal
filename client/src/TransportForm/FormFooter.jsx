import React from 'react';

export function FormFooter() {
  return (
    <div className="mt-8 border-t pt-6">
      {/* <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-gray-700">Signature of Faculty Member/Staff</p>
          <div className="mt-2 h-20 border rounded"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Recommended by Dean/HOD/Section Head</p>
          <div className="mt-2 h-20 border rounded"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Transport Incharge</p>
          <div className="mt-2 h-20 border rounded"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Clearance from Dean IQAC</p>
          <div className="mt-2 h-20 border rounded"></div>
        </div>
      </div> */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Reset
        </button>
        <div className="flex justify-end space-x-2">
            <button
              type="submit"
              className="rounded-md bg-green-600 px-6 h-10 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Yes, Save Data
            </button>

            <button
              type="button"
              onClick={() => navigate("/forms/end")}
              className="rounded-md bg-red-600 px-6 h-10 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              No, Go to EndForm
            </button>
          </div>
      </div>
    </div>
  );
}