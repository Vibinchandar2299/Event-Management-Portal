import ExcelJS from "exceljs";
import Event from "../Schema/EventSchema.js";
import moment from "moment";

export const ExcelConversion = async (req, res) => {
  try {
    const { fromDate, toDate, departments, year, fullYear, selectedeventtype } =
      req.query;
    console.log("Required data for the PDF:", req.query);

    const events = await Event.find({});
    console.log("events are", events);

    const currentDate = moment();
    const oneYearAgo = currentDate
      .clone()
      .subtract(1, "year")
      .format("YYYY-MM-DD");

    const filteredEvents = events.filter((event) => {
      const eventStartDate = moment(event.eventstartdate, "DD/MM/YY").format(
        "YYYY-MM-DD"
      );
      const eventEndDate = moment(event.eventenddate, "DD/MM/YY").format(
        "YYYY-MM-DD"
      );

      const from = moment(fromDate).format("YYYY-MM-DD");
      const to = moment(toDate).format("YYYY-MM-DD");

      if (!(eventStartDate >= from && eventEndDate <= to)) {
        return false;
      }

      if (year && !year.some((y) => event.year.includes(y))) {
        return false;
      }

      const isAllDepartments = departments && departments.includes("All");
      const departmentMatch =
        isAllDepartments ||
        (departments &&
          event.departments &&
          event.departments.some((dept) => event.departments.includes(dept)));

      const specificationMatch =
        selectedeventtype &&
        event.departmentspecification &&
        selectedeventtype.some((spec) =>
          event.departmentspecification.includes(spec)
        );

      if (departmentMatch || (selectedeventtype && specificationMatch)) {
        return true;
      }

      return false;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Events Report");

    worksheet.mergeCells("A1", "K1");
    worksheet.getCell("A1").value = "Sri Eshwar College of Engineering";
    worksheet.getCell("A1").font = { size: 18, bold: true };

    worksheet.mergeCells("A2", "K2");
    worksheet.getCell("A2").value = "Coimbatore";
    worksheet.getCell("A2").font = { size: 14 };

    worksheet.mergeCells("A4", "K4");
    worksheet.getCell("A4").value = `Events Report for ${
      fromDate && toDate ? `${fromDate} to ${toDate}` : "All Events"
    }`;
    worksheet.getCell("A4").font = { size: 16, color: { argb: "0066CC" } };

    const headerRow = worksheet.addRow([
      "Department",
      "Title",
      "Organizer",
      "Resource Person",
      "Start Date",
      "End Date",
      "Start Time",
      "End Time",
      "Venue",
      "Type of Event",
      "Status",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "CCCCCC" },
      };
    });

    worksheet.columns = [
      { key: "departments", width: 50 },
      { key: "eventname", width: 30 },
      { key: "organizer", width: 20 },
      { key: "resourceperson", width: 20 },
      { key: "eventstartdate", width: 15 },
      { key: "eventenddate", width: 15 },
      { key: "eventstarttime", width: 15 },
      { key: "eventendtime", width: 15 },
      { key: "venue", width: 20 },
      { key: "typeofevent", width: 20 },
      { key: "status", width: 15 },
    ];

    filteredEvents.sort((a, b) => {
      const deptA =
        Array.isArray(a.departments) && a.departments[0]
          ? a.departments[0]
          : "";
      const deptB =
        Array.isArray(b.departments) && b.departments[0]
          ? b.departments[0]
          : "";
      return deptA.localeCompare(deptB);
    });
    filteredEvents.forEach((event) => {
      const formattedResourcePersons =
        event.resourceperson && Array.isArray(event.resourceperson)
          ? event.resourceperson
              .map((rp) => {
                const [name, specialization] = Object.entries(rp)[0];
                return `${name || "Unknown"} (${specialization || "Unknown"})`;
              })
              .join(", ")
          : "Not Available";

      worksheet.addRow({
        departments: event.departments
          ? event.departments.join(", ")
          : "Not Available",
        eventname: event.eventname || "Not Available",
        organizer: event.organizer || "Not Available",
        resourceperson: formattedResourcePersons,
        eventstartdate: event.eventstartdate || "Not Available",
        eventenddate: event.eventenddate || "Not Available",
        eventstarttime: event.eventstarttime || "Not Available",
        eventendtime: event.eventendtime || "Not Available",
        venue: event.venue || "Not Available",
        typeofevent: event.typeofevent || "Not Available",
        status: event.status || "Not Available",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="events-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).send("Failed to generate Excel");
  }
};
