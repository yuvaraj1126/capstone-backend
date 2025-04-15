const express = require('express');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a recipe
router.post('/', auth, async (req, res) => {
  try {
    const recipe = new Recipe({
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    await recipe.save();
    res.status(200).json(recipe);
  } catch (err) {
    console.error("Error saving recipe:", err);
    res.status(500).json({ message: err.message || 'Something went wrong' });
  }
});

// Get all recipes
router.get('/', auth, async (_req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user's recipes
router.get('/my', auth, async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userRecipes = await Recipe.find({ userId: userId });
    res.status(200).json(userRecipes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/my', auth, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await Recipe.deleteMany({ _id: id });

    res.status(200).json({
      message: 'Recipes deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a recipe
router.post('/save', auth, async (req, res) => {
  const { recipeId } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (!user.savedRecipes.includes(recipeId)) {
      user.savedRecipes.push(recipeId);
      await user.save();
    }

    res.status(200).json({ message: 'Recipe saved successfully' });
  } catch (err) {
    console.error("Error saving recipe:", err);
    res.status(500).json({ message: 'Error saving recipe' });
  }
});

// Get saved recipes
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedRecipes');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.savedRecipes || []);
  } catch (err) {
    console.error("Error fetching saved recipes:", err);
    res.status(500).json({ message: "Server error while fetching saved recipes" });
  }
});

// Get a recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    res.status(200).json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Rate a recipe
router.post('/rate', auth, async (req, res) => {
  const { id } = req.query;
  const { value } = req.body;

  // Validate rating value
  if (!value || value < 1 || value > 5) {
    return res.status(400).json({ error: 'Invalid rating value. Must be between 1 and 5.' });
  }

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const userIdStr = id.toString();

    // Find if the user already rated
    const existingRating = recipe.ratings.find(r => r?.user?.toString() === userIdStr);

    if (existingRating) {
      // Update existing rating
      existingRating.value = value;
    } else {
      // Add new rating
      recipe.ratings.push({ user: req.user._id, value });
    }

    await recipe.save();

    // Optional: calculate average rating
    // const total = recipe.ratings.reduce((sum, r) => sum + r.value, 0);
    // const avgRating = total / recipe.ratings.length;

    res.status(200).json({
      message: 'Rating submitted successfully',
      // averageRating: avgRating.toFixed(1),
      // totalRatings: recipe.ratings.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while submitting rating' });
  }
});

// Comment on a recipe
router.post('/comment', auth, async (req, res) => {
  const { text, userId,id } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });

  try {
    const user = await User.findById(userId);
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    recipe.comments.push({ user: user._id, text, username: user.username });
    await recipe.save();

    res.status(200).json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



router.post('/comment', auth, async (req, res) => {
  const { text } = req.body;
  const { id } = req.params;

  if (!text) return res.status(400).json({ error: 'Updated comment text is required' });

  try {
    // Find the recipe that contains the comment
    const recipe = await Recipe.findOne({ 'comments.user': id });
    if (!recipe) return res.status(404).json({ error: 'Comment not found' });

    // Find the comment inside the recipe
    const comment = recipe.comments.id(id);

    // Optional: check if current user is the owner of the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    // Update comment text
    comment.text = text;
    await recipe.save();

    res.status(200).json({ message: 'Comment updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating comment' });
  }
});

// Get recipe reviews (average rating + comments)
router.post('/reviews', async (req, res) => {
  try {
    const { id, userId } = req.body;
    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const totalRatings = recipe.ratings.length;
    const averageRating = totalRatings
      ? (recipe.ratings.reduce((acc, r) => acc + r.value, 0) / totalRatings).toFixed(1)
      : 0;

    const comments = recipe.comments.map(c => ({
      text: c.text,
      user: { username: c.username },
    }));

    res.status(200).json({ averageRating, comments });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
