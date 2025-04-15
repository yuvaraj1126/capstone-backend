const express = require('express');
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// ✅ Use auth middleware here
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user._id; 

    const recipe = new Recipe({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await recipe.save();
    res.status(200).json(recipe);
  } catch (err) {
    console.error("Error saving recipe:", err);
    res.status(500).json({
      message: err.message || 'Something went wrong',
    });
  }
});

// 
router.get('/', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
