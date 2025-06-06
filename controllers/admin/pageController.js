import Page from "../../models/page.js";

// GET page by type
export const getPage = async (req, res) => {
  try {
    const { type } = req.params;
    const page = await Page.findOne({ type });
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create or replace page
export const createOrReplacePage = async (req, res) => {
  try {
    const { type } = req.params;
    const { description } = req.body;
    const page = await Page.findOneAndUpdate(
      { type },
      { description, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.status(201).json(page);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT update existing page
export const updatePage = async (req, res) => {
  try {
    const { type } = req.params;
    const { description } = req.body;
    const page = await Page.findOneAndUpdate(
      { type },
      { description, updatedAt: Date.now() },
      { new: true }
    );
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
