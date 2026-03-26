import React from "react";

const CommunicationMedia = ({ Communicationform }) => {
  console.log("=== CommunicationMedia Debug ===");
  console.log("Communicationform prop:", Communicationform);
  console.log("Communicationform type:", typeof Communicationform);
  console.log("Communicationform keys:", Communicationform ? Object.keys(Communicationform) : "No data");
  
  // Destructure relevant fields from Communicationform
  const {
    eventPoster,
    videos,
    onStageRequirements,
    flexBanners,
    receptionTVStreamingRequirements,
    communication,
  } = Communicationform || {};

  const renderPills = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <span className="text-sm text-slate-500">None</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold text-slate-800">Communication and Media</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Event Poster</p>
          {renderPills(eventPoster)}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Videos</p>
          {renderPills(videos)}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Onstage Requirements</p>
          {renderPills(onStageRequirements)}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Flex Banners</p>
          {renderPills(flexBanners)}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Reception TV Streaming Requirements</p>
          {renderPills(receptionTVStreamingRequirements)}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Communication</p>
          {renderPills(communication)}
        </div>
      </div>
    </div>
  );
};

export default CommunicationMedia;
