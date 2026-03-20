import nodemailer from "nodemailer";
import Event from "../../Schema/EventSchema.js";
import Cron from "node-cron";

const sendEmail = async (to, subject, htmlContent) => {
  const sender = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "vijayguhan10@gmail.com",
      pass: "evan qsmw lbyy ucld",
    },
  });

  const composeMail = {
    from: "vijayguhan10@gmail.com",
    to: to.join(", "),
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await sender.sendMail(composeMail);
    console.log("Mail sent successfully:", info.response);
  } catch (err) {
    console.log("Some problem occurred:", err);
  }
};

const sendAutoSchedulingEmail = async () => {
  try {
    const recipientEmails = [
      "vijayguhan10@gmail.com",
      "sabari.m2023cse@sece.ac.in",
      "sabarim636901@gmail.com",
    ];

    const now = new Date();
    const eventsToday = await Event.find({
      startDate: { $lte: now.toISOString().split("T")[0] },
      endDate: { $gte: now.toISOString().split("T")[0] },
    });

    if (eventsToday.length === 0) {
      console.log("No events scheduled for today.");
      return;
    }

    let htmlContent = `
      <html>
  <head>
    <title>Event Details</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        margin: 0;
        padding: 0;
      }
      .container {
        background: white;
        width: 100%;
      }
      .logo {
      margin-left:300px;
        text-align: center;
        width: 60%;
      }
      .logo img {
        width: 60%;
        height: auto;
      }
      .event-card {
        border-radius: 0;
        padding: 0;
        background-color: #e9f5ff;
        width: 100%;
      }
    .event-header {
  background-color: #007BFF;
  color: white;
  margin: 10px auto;
  font-size: 20px;
  width: 90%;
  text-align: center;
}

      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: left;
      }
      th {
        background-color: #f0f0f0;
      }
     .section-title {
  font-size: 18px;
  font-weight: bold;
  text-align: left;
  margin-top: 10px;
  margin-bottom: 10px;
  width: 100%;
}

    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <img src="https://sece.irins.org/assets/profile_images/358809.png" alt="College Logo" />
      </div>
      <h1 style="text-align: center; color: #007BFF; width: 100%;">Today's Event Report</h1>
    </div>
  </body>
</html>

    `;

    eventsToday.forEach((event, index) => {
      htmlContent += `
        <div class="event-card">
          <div class="event-header">Event ${index + 1}: ${event.eventName}</div>
          <table>
            <tr><th>Department</th><td>${event.departments.join(", ")}</td></tr>
            <tr><th>Event Venue</th><td>${event.eventVenue}</td></tr>
            <tr><th>Start Date</th><td>${event.startDate}</td></tr>
            <tr><th>End Date</th><td>${event.endDate}</td></tr>
            <tr><th>Start Time</th><td>${event.startTime}</td></tr>
            <tr><th>End Time</th><td>${event.endTime}</td></tr>
            <tr><th>Event Type</th><td>${event.eventType}</td></tr>
            <tr><th>Description</th><td>${event.description}</td></tr>
          </table>

          <div class="section-title">Organizers:</div>
          <table>
            <tr><th>Employee ID</th><th>Name</th><th>Designation</th><th>Phone</th></tr>
            ${event.organizers
              .map(
                (org) => `
              <tr>
                <td>${org.employeeId}</td>
                <td>${org.name}</td>
                <td>${org.designation}</td>
                <td>${org.phone}</td>
              </tr>
            `
              )
              .join("")}
          </table>

          <div class="section-title">Resource Persons:</div>
          <table>
            <tr><th>Name</th><th>Affiliation</th></tr>
            ${event.resourcePersons
              .map(
                (res) => `
              <tr>
                <td>${res.name}</td>
                <td>${res.affiliation}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      `;
    });

    htmlContent += `</div></body></html>`;

    await sendEmail(recipientEmails, "Today's Event Report", htmlContent);
  } catch (err) {
    console.error("Error:", err);
  }
};

// Cron.schedule("* * * * * *", async () => {
//   console.log("Cron started...");
//   try {
//     await sendAutoSchedulingEmail();
//     console.log("Email process completed");
//   } catch (error) {
//     console.error("Error during email sending:", error);
//   }
// });

export { sendAutoSchedulingEmail };
