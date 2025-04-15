const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition
const userSchema = new mongoose.Schema({
  username: { type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }] // Make sure this field is correct
  

});

// Auto-hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next(); // Only hash if the password is modified
    const hashedPassword = await bcrypt.hash(this.password, 10); // Hash the password
    this.password = hashedPassword; // Update the password field with the hashed value
    next(); // Proceed to save the user
  } catch (err) {
    next(err); // Pass any errors to the next middleware (error handling)
  }
});

// Method to compare passwords (for login)
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password); // Compare input password with hashed password
    return isMatch; // Return true if passwords match, false otherwise
  } catch (err) {
    throw new Error('Password comparison failed'); // Handle any errors during comparison
  }
};

// Export the model
module.exports = mongoose.model('User', userSchema);
