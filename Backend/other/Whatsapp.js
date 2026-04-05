import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
dotenv.config();
import prisma from "../db/prisma.js";

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
    const formattedTodayLegacy = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${String(today.getFullYear()).slice(-2)}`;

    const formattedTodayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;

    const eventsToday = await prisma.basicEvent.findMany({
      where: {
        OR: [{ startDate: formattedTodayIso }, { startDate: formattedTodayLegacy }],
      },
      orderBy: { startTime: "asc" },
    });
    if (eventsToday.length === 0) {
      const noEventsMessage = "No events scheduled for today.";
      console.log(noEventsMessage);

      await sendEmail(recipientEmails, "No Events Scheduled", noEventsMessage);
      return;
    }

    let htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1 style="text-align: center;">Auto Scheduling Events for ${formattedTodayIso}</h1>
          <table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>Event Name</th>
              <th>Type of Event</th>
              <th>Department</th>
              <th>Venue</th>
              <th>Event Start</th>
              <th>Event End</th>
              <th>Status</th>
            </tr>`;

    eventsToday.forEach((event) => {
      const eventStartTimeFormatted = convertTo12HourFormat(event.startTime || "00:00");
      const eventEndTimeFormatted = convertTo12HourFormat(event.endTime || "00:00");

      htmlContent += `
        <tr>
          <td>${event.eventName || ""}</td>
          <td>${event.eventType || ""}</td>
          <td>${Array.isArray(event.departments) && event.departments.length ? event.departments[0] : ""}</td>
          <td>${event.eventVenue || ""}</td>
          <td>${event.startDate || ""} at ${eventStartTimeFormatted}</td>
          <td>${event.endDate || ""} at ${eventEndTimeFormatted}</td>
          <td>${event.status || ""}</td>
        </tr>`;
    });

    htmlContent += `
          </table>
        </body>
      </html>`;

    await sendEmail(recipientEmails, `Events Scheduled for ${formattedTodayIso}`, htmlContent);
    console.log("Email sent for today's events.");
  } catch (err) {
    console.error("Error:", err);
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("EMAIL_USER/EMAIL_PASS not set; skipping email send.");
    return;
  }

  var sender = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  var composeMail = {
    from: user,
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
