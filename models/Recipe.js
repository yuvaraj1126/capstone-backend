
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  ingredients: [String],
  instructions: String,
  cookingTime: String,
  servings: String,
  image: String,
  video: String,
  steps: String,
  userId:String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      value: Number,
    }
  ],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      text: String,
    }
  ]
});

module.exports = mongoose.model('Recipe', recipeSchema);
