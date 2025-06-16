import Contact from "../../models/contact.js";
import { sendEmail } from "../../services/emailService.js";

// Get Contacts
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne();
    if (!contact) return res.status(404).json({ message: "No contact found" });
    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create Contacts
export const createContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      {},
      { ...req.body, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.status(201).json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Contacts
export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      {},
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Contact Enquiry
export const contactEnquiery = async (req, res) => {
  try {
    const { email, message, phone, subject } = req.body;

    if (!email || !message || !phone || !subject) {
      return res.status(400).json({
        success: false,
        message: "All fields (email, message, phone, subject) are required.",
      });
    }

    const htmlContent = `
      <p>${message}</p>
      <p><strong>From:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
    `;

    const recipients = [
      "info@infotechedge.in",
      "sale@solvezone.in",
      "mkt@solvezone.in",
    ];

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient,
          subject: `${subject}`,
          html: htmlContent,
        });
        console.log(`Enquiry email sent to ${recipient}`);
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
    });
  } catch (error) {
    console.error("Error in contactEnquiery:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
