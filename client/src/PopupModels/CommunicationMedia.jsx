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

  return (
    <div className="w-full overflow-auto">
      <h1 className="main-heading">Communication and Media</h1>
      <table>
        <thead>
          <tr>
            <th>Event Poster</th>
            <th>Videos</th>
            <th>Onstage Requirements</th>
            <th>Flex Banners</th>
            <th>Reception TV Streaming Requirements</th>
            <th>Communication</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ul>
                {eventPoster &&
                  eventPoster.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </td>
            <td>
              <ul>
                {videos &&
                  videos.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </td>
            <td>
              <ul>
                {onStageRequirements &&
                  onStageRequirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            </td>
            <td>
              <ul>
                {flexBanners &&
                  flexBanners.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </td>
            <td>
              <ul>
                {receptionTVStreamingRequirements &&
                  receptionTVStreamingRequirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            </td>
            <td>
              <ul>
                {communication &&
                  communication.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CommunicationMedia;
