import { jsPDF } from "jspdf";
import Event from "../Schema/EventSchema.js";
import Endform from "../Schema/EndForm.js";
import moment from "moment";
import axios from "axios";
import FoodForm from "../Schema/foodform/main.js";
import GuestRoom from "../Schema/guestroom/main.js";
import TransportRequest from "../Schema/transportform/main.js";
import MediaRequirements from "../Schema/MedaiRequirements.js";
import mongoose from 'mongoose';

const PdfConversion = async (filteredEvents, fromDate, toDate, res) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Sri Eshwar College of Engineering", 10, 10);
  doc.setFontSize(14);
  doc.text("Coimbatore", 10, 18);

  const imageUrl = "https://digri.ai/wp-content/uploads/2023/12/Logo-2-768x258.png";
  try {
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBase64 = Buffer.from(imageResponse.data, "binary").toString("base64");
    doc.addImage(`data:image/png;base64,${imageBase64}`, "PNG", 160, 5, 40, 20);
  } catch (error) {
    console.error("Error fetching the image:", error);
  }

  doc.setFontSize(18);
  doc.setTextColor(0, 102, 204);
  doc.text(
    `Events Report for ${fromDate && toDate ? `${fromDate} to ${toDate}` : "All Events"}`,
    10, 40
  );

  let y = 50;
  const pageHeight = doc.internal.pageSize.height;

  filteredEvents.sort((a, b) => {
    const aDepartment = a.departments && a.departments[0] ? a.departments[0] : "";
    const bDepartment = b.departments && b.departments[0] ? b.departments[0] : "";
    return aDepartment.localeCompare(bDepartment);
  });

  let currentDepartment = "";

  filteredEvents.forEach((event, index) => {
    const eventDepartment = event.departments && event.departments[0] ? event.departments[0] : "";

    if (eventDepartment && eventDepartment !== currentDepartment) {
      currentDepartment = eventDepartment;
      doc.setFontSize(16);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${currentDepartment} Department`, 105, y, { align: "center" });
      y += 10;
      if (y + 120 > pageHeight) {
        doc.addPage();
        y = 10;
      }
    }

    if (y + 120 > pageHeight) {
      doc.addPage();
      y = 10;
    }

    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Event ${index + 1}:`, 10, y);

    doc.setFontSize(12);
    doc.setFont("Helvetica", "normal");

    doc.setDrawColor(0, 102, 204);
    doc.rect(10, y + 2, 190, 120);

    if (event.departments && event.departments.length > 0) {
      doc.text(`Department: ${event.departments.join(", ")}`, 20, y + 10);
    }

    if (event.departmentspecification && event.departmentspecification.length > 0) {
      doc.text(`Department Specification: ${event.departmentspecification.join(", ")}`, 20, y + 20);
    } else {
      doc.text(`Department Specification: All`, 20, y + 20);
    }

    doc.text(`Title: ${event.eventname}`, 20, y + 30);
    doc.text(`Organizer: ${event.organizer}`, 20, y + 40);

if (event.resourceperson && Array.isArray(event.resourceperson)) {
  const formattedResourcePersons = event.resourceperson
    .map(rp => {
      const [name, specialization] = Object.entries(rp)[0];
      return `${name || 'Unknown'} (${specialization || 'Unknown'})`; 
    })
    .join(", ");
  doc.text(`Resource Person: ${formattedResourcePersons}`, 20, y + 50);
} else {
  doc.text(`Resource Person: Unknown (Unknown)`, 20, y + 50); 
}


    doc.text(`Start Date: ${event.eventstartdate}`, 20, y + 60);
    doc.text(`End Date: ${event.eventenddate}`, 20, y + 70);
    doc.text(`Start Time: ${event.eventstarttime}`, 20, y + 80);
    doc.text(`End Time: ${event.eventendtime}`, 20, y + 90);
    doc.text(`Venue: ${event.venue}`, 20, y + 100);

    if (event.typeofevent) {
      doc.text(`Type of Event: ${event.typeofevent}`, 20, y + 110);
    }

    doc.text(`Status: ${event.status}`, 20, y + 120);

    y += 130;

    if (y + 130 > pageHeight) {
      doc.addPage();
      y = 10;
    }
  });

  const pdfOutput = doc.output("arraybuffer");
  const buffer = Buffer.from(pdfOutput);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="events-report.pdf"');
  res.send(buffer);
};

export const generatePdf = async (req, res) => {
  try {
    const { fromDate, toDate, departments, year, fullYear, selectedeventtype } = req.query;
    console.log("Required data for the PDF:", req.query);

    const events = await Event.find({});
    console.log("events are", events);

    const currentDate = moment();
    const oneYearAgo = currentDate.clone().subtract(1, "year").format("YYYY-MM-DD");

    const from = moment(fromDate).format("YYYY-MM-DD");
    const to = moment(toDate).format("YYYY-MM-DD");

    const filteredEvents = events.filter((event) => {
      const eventStartDate = moment(event.eventstartdate, "DD/MM/YY").format("YYYY-MM-DD");
      const eventEndDate = moment(event.eventenddate, "DD/MM/YY").format("YYYY-MM-DD");

      if (fullYear) {
        if (eventEndDate > to) {
          return false;
        }
      } else {
        if (!(eventStartDate >= from && eventEndDate <= to)) {
          return false; 
        }
      }

      if (year && !year.some(y => event.year.includes(y))) {
        return false;
      }

      const isAllDepartments = departments && departments.includes("All");
      const departmentMatch = isAllDepartments || (departments && event.departments && event.departments.some(dept => event.departments.includes(dept)));

      const specificationMatch = selectedeventtype && event.departmentspecification && selectedeventtype.some(spec => event.departmentspecification.includes(spec));

      if (departmentMatch || (selectedeventtype && specificationMatch)) {
        return true;
      }

      return false;
    });

    console.log("Filtered Events:", filteredEvents);
    console.log("resource persons", events[0].resourceperson);

    PdfConversion(filteredEvents, fromDate, toDate, res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Failed to generate PDF");
  }
};

export const generateSingleEventPdf = async (req, res) => {
  console.log('=== ENTERING generateSingleEventPdf ===');
  console.log('Request query:', req.query);
  console.log('Response object:', res);
  
  try {
    const { eventId } = req.query;
    console.log('PDF Download Request - eventId:', eventId);
    
    if (!eventId) {
      console.log('No eventId provided');
      return res.status(400).json({ error: "Missing eventId" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.log('Invalid ObjectId:', eventId);
      return res.status(400).json({ error: "Invalid eventId format" });
    }
    
    console.log('Looking for eventId:', eventId, typeof eventId);
    
    // First try to find in EndForm collection (this is what the frontend is using)
    let endform = await Endform.findById(eventId);
    console.log('Result of Endform.findById:', endform);
    
    if (!endform) {
      // Fallback to Event collection
      const event = await Event.findById(eventId);
      console.log('Result of Event.findById:', event);
      
      if (!event) {
        console.log('Event not found for eventId:', eventId);
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Use event data directly
      console.log('Using Event data for PDF generation');
      return generatePdfFromEvent(event, res);
    }
    
    // Use endform data - need to populate the related data
    console.log('Using Endform data for PDF generation');
    console.log('About to call generatePdfFromEndform with endform:', endform._id);
    console.log('Endform object keys:', Object.keys(endform));
    console.log('Response object type:', typeof res);
    console.log('generatePdfFromEndform function type:', typeof generatePdfFromEndform);
    
    // Test if the function is accessible
    if (typeof generatePdfFromEndform !== 'function') {
      console.error('generatePdfFromEndform is not a function!');
      console.error('Available functions:', Object.keys(this));
      throw new Error('generatePdfFromEndform is not a function');
    }
    
    try {
      console.log('Calling generatePdfFromEndform...');
      console.log('Function exists:', !!generatePdfFromEndform);
      console.log('Function is function:', typeof generatePdfFromEndform === 'function');
      
      const result = await generatePdfFromEndform(endform, res);
      console.log('generatePdfFromEndform completed successfully');
      return result;
    } catch (error) {
      console.error('Error in generatePdfFromEndform:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      throw error;
    }
    
  } catch (error) {
    console.error("Error generating single event PDF:", error);
    res.status(500).json({ 
      error: "Failed to generate event PDF",
      details: error.message 
    });
  }
};

const generatePdfFromEvent = async (event, res) => {
  try {
    // Fetch all sub-forms using iqacNumber
    const iqacNumber = event.iqacNumber;
    let foodForm, guestRoom, transport, media;
    
    try {
      [foodForm, guestRoom, transport, media] = await Promise.all([
        FoodForm.findOne({ iqacNumber }),
        GuestRoom.findOne({ iqacNumber }),
        TransportRequest.findOne({ "basicDetails.iqacNumber": iqacNumber }),
        MediaRequirements.findOne({ iqacNumber }),
      ]);
    } catch (dbError) {
      console.error('Error fetching sub-forms:', dbError);
      foodForm = null;
      guestRoom = null;
      transport = null;
      media = null;
    }
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: `Event Details - ${event.eventName || 'Event'}`,
      subject: 'Event Information',
      author: 'Sri Eshwar College of Engineering',
      creator: 'Event Management System'
    });
    
    // Header
    doc.setFontSize(18);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Sri Eshwar College of Engineering", 10, 10);
    
    doc.setFontSize(14);
    doc.setFont("Helvetica", "normal");
    doc.text("Coimbatore", 10, 18);
    
    let y = 40;
    
    // Title
    doc.setFontSize(16);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Event Details", 105, y, { align: "center" });
    y += 15;
    
    // Helper functions
    function safeText(text) {
      if (text === undefined || text === null) return '';
      return String(text).replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
    }
    
    function checkPageBreak() {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    
    function addSection(title, data, indent = 0) {
      if (!data || Object.keys(data).length === 0) return;
      
      console.log('Adding section:', title);
      
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text(title, 20 + indent, y + 10);
      checkPageBreak();
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont("Helvetica", "normal");
      
      // Helper function to extract clean data from MongoDB documents
      function extractCleanData(obj, level = 0) {
        if (!obj || typeof obj !== 'object') return obj;
        
        // If it's a MongoDB document, extract the _doc property
        if (obj._doc) {
          obj = obj._doc;
        }
        
        const cleanObj = {};
        
        for (const [key, value] of Object.entries(obj)) {
          // Skip MongoDB internal properties
          if (key.startsWith('$') || key === '__v' || key === '_id' || key === 'createdAt' || key === 'updatedAt') {
            continue;
          }
          
          if (Array.isArray(value)) {
            cleanObj[key] = value.map(item => extractCleanData(item, level + 1));
          } else if (value && typeof value === 'object' && !(value instanceof Date)) {
            cleanObj[key] = extractCleanData(value, level + 1);
          } else {
            cleanObj[key] = value;
          }
        }
        
        return cleanObj;
      }
      
      // Extract clean data
      const cleanData = extractCleanData(data);
      console.log('=== PDF GENERATION DEBUG ===');
      console.log('Section title:', title);
      console.log('Original data type:', typeof data);
      console.log('Original data keys:', Object.keys(data || {}));
      console.log('Original data sample:', JSON.stringify(data, null, 2).substring(0, 500));
      console.log('Clean data type:', typeof cleanData);
      console.log('Clean data keys:', Object.keys(cleanData || {}));
      console.log('Clean data sample:', JSON.stringify(cleanData, null, 2).substring(0, 500));
      
      // Check if this is a MongoDB document with _doc property
      if (data && typeof data === 'object' && data._doc) {
        console.log('Found _doc property, extracting...');
        const docData = extractCleanData(data._doc);
        console.log('Extracted _doc data:', docData);
      }
      
      // Check for MongoDB document properties
      if (data && typeof data === 'object') {
        const mongoProps = Object.keys(data).filter(key => key.startsWith('$') || key === '__v' || key === '_id');
        if (mongoProps.length > 0) {
          console.log('Found MongoDB properties:', mongoProps);
        }
      }
      
      // More aggressive cleaning - try to extract actual data from MongoDB documents
      let finalData = cleanData;
      if (data && typeof data === 'object') {
        // If the data has _doc property, use that
        if (data._doc) {
          console.log('Using _doc data directly');
          finalData = data._doc;
        }
        // If the data has $__ property, it's likely a populated document
        else if (data.$__ && data._doc) {
          console.log('Using populated document _doc data');
          finalData = data._doc;
        }
        // If the data has parent property, try to extract from there
        else if (data.parent && typeof data.parent === 'object') {
          console.log('Using parent data');
          finalData = data.parent;
        }
      }
      
      console.log('Final data to display:', finalData);
      
      // Special handling for transport form data structure
      function formatTransportData(data) {
        if (!data || typeof data !== 'object') return data;
        
        console.log('formatTransportData called with:', typeof data, Object.keys(data || {}));
        
        const formatted = {};
        
        // Helper function to convert MongoDB subdocuments to plain objects
        function convertToPlainObject(obj) {
          if (!obj || typeof obj !== 'object') return obj;
          
          // If it's a MongoDB document, convert to plain object
          if (obj.toObject) {
            console.log('Converting MongoDB document to plain object');
            return obj.toObject();
          }
          
          // If it's already a plain object, return as is
          if (obj.constructor === Object) {
            return obj;
          }
          
          // For other cases, try to extract data
          const plainObj = {};
          for (const [key, value] of Object.entries(obj)) {
            if (key.startsWith('$') || key === '__v' || key === '_id') continue;
            plainObj[key] = value;
          }
          return plainObj;
        }
        
        // Handle basicDetails
        if (data.basicDetails) {
          console.log('Processing basicDetails:', data.basicDetails);
          const basicDetails = convertToPlainObject(data.basicDetails);
          console.log('Converted basicDetails:', basicDetails);
          Object.entries(basicDetails).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              formatted[`Basic Details ${displayKey}`] = value;
            }
          });
        }
        
        // Handle eventDetails
        if (data.eventDetails) {
          console.log('Processing eventDetails:', data.eventDetails);
          const eventDetails = convertToPlainObject(data.eventDetails);
          console.log('Converted eventDetails:', eventDetails);
          Object.entries(eventDetails).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              formatted[`Event Details ${displayKey}`] = value;
            }
          });
        }
        
        // Handle travelDetails
        if (data.travelDetails) {
          console.log('Processing travelDetails:', data.travelDetails);
          const travelDetails = convertToPlainObject(data.travelDetails);
          console.log('Converted travelDetails:', travelDetails);
          Object.entries(travelDetails).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              formatted[`Travel Details ${displayKey}`] = value;
            }
          });
        }
        
        // Handle driverDetails
        if (data.driverDetails) {
          console.log('Processing driverDetails:', data.driverDetails);
          const driverDetails = convertToPlainObject(data.driverDetails);
          console.log('Converted driverDetails:', driverDetails);
          Object.entries(driverDetails).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              formatted[`Driver Details ${displayKey}`] = value;
            }
          });
        }
        
        console.log('Final formatted data:', formatted);
        return formatted;
      }
      
      // Display the data in a structured way
      function displayNestedData(obj, level = 0) {
        Object.entries(obj).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            let displayValue = value;
            
            if (Array.isArray(value)) {
              // Special handling for transportform array
              if (key === 'transportform' && value.length > 0) {
                console.log('Processing transportform array with', value.length, 'items');
                value.forEach((item, index) => {
                  console.log('Transport item', index, ':', item);
                  if (item && typeof item === 'object') {
                    // Extract the actual data from the MongoDB document
                    const transportData = item._doc || item;
                    console.log('Extracted transport data:', transportData);
                    const formattedData = formatTransportData(transportData);
                    Object.entries(formattedData).forEach(([formattedKey, formattedValue]) => {
                      const text = `${formattedKey}: ${safeText(formattedValue)}`;
                      if (text.length > 80) {
                        const words = text.split(' ');
                        let line = '';
                        words.forEach(word => {
                          if ((line + word).length > 80) {
                            doc.text(line, 25 + indent + (level * 10), y);
                            checkPageBreak();
                            y += 8;
                            line = word + ' ';
                          } else {
                            line += word + ' ';
                          }
                        });
                        if (line) {
                          doc.text(line, 25 + indent + (level * 10), y);
                          checkPageBreak();
                          y += 8;
                        }
                      } else {
                        doc.text(text, 25 + indent + (level * 10), y);
                        checkPageBreak();
                        y += 8;
                      }
                    });
                  }
                });
                return; // Skip the normal array display since we handled it specially
              }
              displayValue = value.join(', ');
            } else if (typeof value === 'object' && value !== null) {
              // For nested objects, display them recursively
              const nestedData = extractCleanData(value);
              if (Object.keys(nestedData).length > 0) {
                // Check if this looks like transport form data
                if (nestedData.basicDetails || nestedData.eventDetails || nestedData.travelDetails || nestedData.driverDetails) {
                  const formattedData = formatTransportData(nestedData);
                  Object.entries(formattedData).forEach(([formattedKey, formattedValue]) => {
                    const text = `${formattedKey}: ${safeText(formattedValue)}`;
                    if (text.length > 80) {
                      const words = text.split(' ');
                      let line = '';
                      words.forEach(word => {
                        if ((line + word).length > 80) {
                          doc.text(line, 25 + indent + (level * 10), y);
                          checkPageBreak();
                          y += 8;
                          line = word + ' ';
                        } else {
                          line += word + ' ';
                        }
                      });
                      if (line) {
                        doc.text(line, 25 + indent + (level * 10), y);
                        checkPageBreak();
                        y += 8;
                      }
                    } else {
                      doc.text(text, 25 + indent + (level * 10), y);
                      checkPageBreak();
                      y += 8;
                    }
                  });
                  return; // Skip the normal display since we handled it specially
                }
                
                // Add a subheading for the nested object
                y += 5;
                doc.setFontSize(11);
                doc.setFont("Helvetica", "bold");
                doc.text(`${displayKey}:`, 25 + indent + (level * 10), y);
                checkPageBreak();
                y += 8;
                
                // Display nested data
                displayNestedData(nestedData, level + 1);
                return; // Skip the normal display since we handled it recursively
              } else {
                displayValue = 'No data';
              }
            }
            
            const text = `${displayKey}: ${safeText(displayValue)}`;
            if (text.length > 80) {
              // Split long text
              const words = text.split(' ');
              let line = '';
              words.forEach(word => {
                if ((line + word).length > 80) {
                  doc.text(line, 25 + indent + (level * 10), y);
                  checkPageBreak();
                  y += 8;
                  line = word + ' ';
                } else {
                  line += word + ' ';
                }
              });
              if (line) {
                doc.text(line, 25 + indent + (level * 10), y);
                checkPageBreak();
                y += 8;
              }
            } else {
              doc.text(text, 25 + indent + (level * 10), y);
              checkPageBreak();
              y += 8;
            }
          }
        });
      }
      
      displayNestedData(finalData);
      y += 5;
    }
    
    // Basic Event Information
    const basicInfo = {
      'IQAC Number': event.iqacNumber,
      'Event Name': event.eventName,
      'Event Type': event.eventType,
      'Venue': event.eventVenue,
      'Start Date': event.startDate,
      'End Date': event.endDate,
      'Start Time': event.startTime,
      'End Time': event.endTime,
      'Year': event.year,
      'Status': event.status
    };
    
    if (event.departments && event.departments.length > 0) {
      basicInfo['Departments'] = event.departments.join(', ');
    }
    
    if (event.academicdepartment && event.academicdepartment.length > 0) {
      basicInfo['Academic Departments'] = event.academicdepartment.join(', ');
    }
    
    if (event.professional && event.professional.length > 0) {
      basicInfo['Professional'] = event.professional.join(', ');
    }
    
    addSection('Basic Event Information', basicInfo);
    
    // Description
    if (event.description) {
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text("Description", 20, y + 10);
      checkPageBreak();
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont("Helvetica", "normal");
      const descLines = doc.splitTextToSize(safeText(event.description), 170);
      descLines.forEach(line => {
        doc.text(line, 25, y);
        checkPageBreak();
        y += 8;
      });
      y += 5;
    }
    
    // Organizers
    if (event.organizers && event.organizers.length > 0) {
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text("Organizers", 20, y + 10);
      checkPageBreak();
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont("Helvetica", "normal");
      event.organizers.forEach((org, idx) => {
        const orgText = `- ${safeText(org.name)} (${safeText(org.designation)}, ${safeText(org.phone)}`;
        doc.text(orgText, 25, y);
        checkPageBreak();
        y += 8;
      });
      y += 5;
    }
    
    // Resource Persons
    if (event.resourcePersons && event.resourcePersons.length > 0) {
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text("Resource Persons", 20, y + 10);
      checkPageBreak();
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont("Helvetica", "normal");
      event.resourcePersons.forEach((rp, idx) => {
        const rpText = `- ${safeText(rp.name)} (${safeText(rp.affiliation)})`;
        doc.text(rpText, 25, y);
        checkPageBreak();
        y += 8;
      });
      y += 5;
    }
    
    // Transport Form
    if (transport) {
      addSection('Transport Form', transport);
    }
    
    // Food Form
    if (foodForm) {
      addSection('Food Form', foodForm);
    }
    
    // Guest Room Form
    if (guestRoom) {
      addSection('Guest Room Form', guestRoom);
    }
    
    // Media/Communication Form
    if (media) {
      addSection('Media/Communication Form', media);
    }
    
    // Generate PDF buffer
    const pdfOutput = doc.output("arraybuffer");
    
    if (!pdfOutput || pdfOutput.byteLength === 0) {
      throw new Error("Generated PDF is empty or invalid");
    }
    
    const buffer = Buffer.from(pdfOutput);
    
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="event-${event._id}.pdf"`);
    res.setHeader("Content-Length", buffer.length);
    
    // Send the PDF
    res.send(buffer);
    
  } catch (error) {
    console.error("Error generating PDF from event:", error);
    res.status(500).json({ 
      error: "Failed to generate event PDF",
      details: error.message 
    });
  }
};

export async function generatePdfFromEndform(endform, res) {
  console.log('=== GENERATING PDF FROM ENDFORM ===');
  console.log('Endform ID:', endform._id);
  
  try {
    // Populate the endform with all related data
    const populatedEndform = await Endform.findById(endform._id)
      .populate('transportform')
      .populate('guestform')
      .populate('communicationform')
      .populate('foodform')
      .populate('amenityform')
      .exec();

    console.log('Populated endform:', populatedEndform);
    console.log('About to access transportform...');
    console.log('Transport form data:', populatedEndform.transportform);
    console.log('Transport form type:', typeof populatedEndform.transportform);
    console.log('Transport form length:', populatedEndform.transportform?.length);
    console.log('About to create PDF document...');

    // Also fetch the associated Event data
    let eventData = null;
    if (populatedEndform.eventdata) {
      eventData = await Event.findById(populatedEndform.eventdata).exec();
      console.log('Associated Event data:', eventData);
    }

    // Create PDF document using jsPDF
    const doc = new jsPDF();
    console.log('PDF document created successfully');

    // Set PDF properties
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="event-${endform._id}.pdf"`);
    console.log('PDF properties set successfully');

    // Track current Y position
    let currentY = 20;

    // Helper function to add sections with proper positioning
    function addSection(title, content, level = 0) {
      const indent = '  '.repeat(level);
      const sectionText = `${indent}${title}`;
      
      // Set font for title
      doc.setFontSize(12 + level);
      doc.setFont('helvetica', 'bold');
      doc.text(sectionText, 10, currentY);
      currentY += 8;
      
      if (content) {
        const contentText = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Split content into lines if it's too long
        const lines = doc.splitTextToSize(`${indent}${contentText}`, 180);
        doc.text(lines, 10, currentY);
        currentY += (lines.length * 5) + 5;
      } else {
        currentY += 5;
      }
      
      // Check if we need a new page
      if (currentY > 280) {
        doc.addPage();
        currentY = 20;
      }
    }

    // Helper function to extract clean data from MongoDB documents
    function extractCleanData(obj, level = 0) {
      if (!obj || typeof obj !== 'object') return obj;
      
      // If it's a MongoDB document, extract the _doc property
      if (obj._doc) {
        obj = obj._doc;
      }
      
      const cleanObj = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip MongoDB internal properties
        if (key.startsWith('$') || key === '__v' || key === '_id' || key === 'createdAt' || key === 'updatedAt') {
          continue;
        }
        
        if (Array.isArray(value)) {
          cleanObj[key] = value.map(item => extractCleanData(item, level + 1));
        } else if (value && typeof value === 'object' && !(value instanceof Date)) {
          cleanObj[key] = extractCleanData(value, level + 1);
        } else {
          cleanObj[key] = value;
        }
      }
      
      return cleanObj;
    }

    // Helper function to format data for display
    function formatValue(value) {
      if (value === null || value === undefined) return 'N/A';
      if (value instanceof Date) return value.toLocaleDateString();
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') {
        // Handle nested objects like cameraAction
        const entries = Object.entries(value);
        if (entries.length > 0) {
          return entries.map(([key, val]) => {
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val;
            return `${displayKey}: ${displayVal}`;
          }).join(', ');
        }
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    }

    console.log('Starting to add sections to PDF...');

    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Sri Eshwar College of Engineering', 105, currentY, { align: 'center' });
    currentY += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Event Management System - Event Report', 105, currentY, { align: 'center' });
    currentY += 15;
    
    // Add a line separator
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, currentY, 200, currentY);
    currentY += 10;

    // Add Basic Event Information
    console.log('Adding Basic Event Information section');
    addSection('Basic Event Information', '');
    addSection('Event ID:', endform._id.toString(), 1);
    addSection('IQAC Number:', endform.iqacno, 1);
    addSection('Status:', endform.status, 1);
    addSection('Created Date:', new Date(endform.createdat).toLocaleDateString(), 1);

    // Add Event data if available
    if (eventData) {
      addSection('Event Name:', eventData.eventName, 1);
      addSection('Event Type:', eventData.eventType, 1);
      addSection('Event Venue:', eventData.eventVenue, 1);
      addSection('Start Date:', eventData.startDate, 1);
      addSection('End Date:', eventData.endDate, 1);
      addSection('Start Time:', eventData.startTime, 1);
      addSection('End Time:', eventData.endTime, 1);
      
      // Add Year if available
      if (eventData.year) {
        addSection('Year:', eventData.year, 1);
      }
      
      // Add Categories if available
      if (eventData.categories) {
        addSection('Year Categories:', eventData.categories, 1);
      }
      
      // Add Departments if available
      if (eventData.departments && eventData.departments.length > 0) {
        addSection('Departments:', eventData.departments.join(', '), 1);
      }
      
      // Add Academic Departments if available
      if (eventData.academicdepartment && eventData.academicdepartment.length > 0) {
        addSection('Academic Departments:', eventData.academicdepartment.join(', '), 1);
      }
      
      // Add Professional Societies if available
      if (eventData.professional && eventData.professional.length > 0) {
        addSection('Professional Societies:', eventData.professional.join(', '), 1);
      }
      
      // Add Logos if available
      if (eventData.logos && eventData.logos.length > 0) {
        addSection('Logos:', eventData.logos.join(', '), 1);
      }
      
      // Add Description if available
      if (eventData.description) {
        addSection('Description:', eventData.description, 1);
      }
    }

    // Add Transport Form Information
    if (populatedEndform.transportform && populatedEndform.transportform.length > 0) {
      console.log('Adding Transport Form Information section');
      addSection('Transport Form Information', '');
      
      populatedEndform.transportform.forEach((transport, index) => {
        const cleanTransport = extractCleanData(transport);
        addSection(`Transport Request ${index + 1}:`, '', 1);
        
        // Basic Details
        if (cleanTransport.basicDetails) {
          addSection('Basic Details:', '', 2);
          Object.entries(cleanTransport.basicDetails).forEach(([key, value]) => {
            // Skip empty, null, or undefined values
            if (value === null || value === undefined || value === '' || 
                (Array.isArray(value) && value.length === 0)) {
              return;
            }
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = formatValue(value);
            addSection(`${displayKey}:`, displayValue, 3);
          });
        }
        
        // Event Details
        if (cleanTransport.eventDetails) {
          addSection('Event Details:', '', 2);
          Object.entries(cleanTransport.eventDetails).forEach(([key, value]) => {
            // Skip empty, null, or undefined values
            if (value === null || value === undefined || value === '' || 
                (Array.isArray(value) && value.length === 0)) {
              return;
            }
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = formatValue(value);
            addSection(`${displayKey}:`, displayValue, 3);
          });
        }
        
        // Travel Details
        if (cleanTransport.travelDetails) {
          addSection('Travel Details:', '', 2);
          Object.entries(cleanTransport.travelDetails).forEach(([key, value]) => {
            // Skip empty, null, or undefined values
            if (value === null || value === undefined || value === '' || 
                (Array.isArray(value) && value.length === 0)) {
              return;
            }
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = formatValue(value);
            addSection(`${displayKey}:`, displayValue, 3);
          });
        }
        
        // Driver Details
        if (cleanTransport.driverDetails) {
          addSection('Driver Details:', '', 2);
          Object.entries(cleanTransport.driverDetails).forEach(([key, value]) => {
            // Skip empty, null, or undefined values
            if (value === null || value === undefined || value === '' || 
                (Array.isArray(value) && value.length === 0)) {
              return;
            }
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = formatValue(value);
            addSection(`${displayKey}:`, displayValue, 3);
          });
        }
      });
    }

    // Add Guest Room Information
    if (populatedEndform.guestform) {
      console.log('Adding Guest Room Information section');
      addSection('Guest Room Information', '');
      const cleanGuest = extractCleanData(populatedEndform.guestform);
      Object.entries(cleanGuest).forEach(([key, value]) => {
        // Skip empty, null, or undefined values
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return;
        }
        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = formatValue(value);
        addSection(`${displayKey}:`, displayValue, 1);
      });
    }

    // Add Communication Form Information
    if (populatedEndform.communicationform) {
      console.log('Adding Communication Form Information section');
      addSection('Communication Form Information', '');
      const cleanCommunication = extractCleanData(populatedEndform.communicationform);
      Object.entries(cleanCommunication).forEach(([key, value]) => {
        // Skip empty, null, or undefined values
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return;
        }
        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = formatValue(value);
        addSection(`${displayKey}:`, displayValue, 1);
      });
    }

    // Add Food Form Information
    if (populatedEndform.foodform) {
      console.log('Adding Food Form Information section');
      addSection('Food Form Information', '');
      const cleanFood = extractCleanData(populatedEndform.foodform);
      Object.entries(cleanFood).forEach(([key, value]) => {
        // Skip empty, null, or undefined values
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return;
        }
        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = formatValue(value);
        addSection(`${displayKey}:`, displayValue, 1);
      });
    }

    console.log('All sections added successfully');
    console.log('Finalizing PDF...');

    // Generate PDF buffer and send
    const pdfOutput = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfOutput);
    
    console.log('PDF generated successfully, size:', buffer.length, 'bytes');
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="event-${endform._id}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the PDF
    res.send(buffer);
    console.log('PDF finalized successfully');

  } catch (error) {
    console.error('Error generating PDF from endform:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
