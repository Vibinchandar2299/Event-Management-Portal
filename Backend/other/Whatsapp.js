import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
dotenv.config();
import Event from "../Schema/EventSchema.js";

const convertTo12HourFormat = (time) => {
  let [hours, minutes] = time.split(":").map(Number);
  let period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutes} ${period}`;
};

export const sendAutoSchedulingEmail = async () => {
  try {
    const recipientEmails = [
      "vijayguhan10@gmail.com",
      "sabari.m2023cse@sece.ac.in",
      "sabarim636901@gmail.com",
    ];

    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(
      2,
      "0"
    )}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(
      today.getFullYear()
    ).slice(-2)}`;

    const eventsToday = await Event.find({ eventstartdate: formattedToday });
    if (eventsToday.length === 0) {
      const noEventsMessage = "No events scheduled for today.";
      console.log(noEventsMessage);

      await sendEmail(recipientEmails, "No Events Scheduled", noEventsMessage);
      return;
    }

    let htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1 style="text-align: center;">Auto Scheduling Events for ${formattedToday}</h1>
          <table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>Event Name</th>
              <th>Type of Event</th>
              <th>Department</th>
              <th>Venue</th>
              <th>Event Start</th>
              <th>Event End</th>
              <th>Status</th>
              <th>Design Status</th>
            </tr>`;

    eventsToday.forEach((event) => {
      const eventStartTimeFormatted = convertTo12HourFormat(
        event.eventstarttime
      );
      const eventEndTimeFormatted = convertTo12HourFormat(event.eventendtime);

      htmlContent += `
        <tr>
          <td>${event.eventname}</td>
          <td>${event.typeofevent}</td>
          <td>${event.departments[0]}</td>
          <td>${event.venue}</td>
          <td>${event.eventstartdate} at ${eventStartTimeFormatted}</td>
          <td>${event.eventenddate} at ${eventEndTimeFormatted}</td>
          <td>${event.status}</td>
          <td>${event.designstatus}</td>
        </tr>`;
    });

    htmlContent += `
          </table>
        </body>
      </html>`;

    await sendEmail(
      recipientEmails,
      `Events Scheduled for ${formattedToday}`,
      htmlContent
    );
    console.log("Email sent for today's events.");
  } catch (err) {
    console.error("Error:", err);
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  var sender = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "sabarim6369@gmail.com",
      pass: "gsdn ofbj bvqp bwxt",
    },
  });
  var composeMail = {
    from: "sabarim6369@gmail.com",
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

cron.schedule("0 0 12 * * *", async () => {
  console.log(
    "Running scheduled task: Sending auto-scheduling email at 12:00 PM"
  );
  await sendAutoSchedulingEmail();
});
