import React from 'react';

const Header = ({ title = "Requisition Form for Food and Refreshments" }) => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold mb-2">Sri Eshwar College of Engineering</h1>
      <p className="text-sm text-gray-600">
        (An Autonomous Institution and Affiliated to Anna University, Chennai)
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Kondampatti (Post), Kinathukadavu (Tk.), Coimbatore - 641 202
      </p>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
};

export default Header;