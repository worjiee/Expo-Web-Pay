mergeInto(LibraryManager.library, {
  // Function to decrease lives
  decreaseLives: function() {
    // Call the decreaseLives function in the parent window
    if (window.decreaseLives) {
      window.decreaseLives();
    } else {
      console.error('decreaseLives function not found in window');
    }
  },
  
  // Function to reset lives
  resetLives: function(count) {
    // Call the resetLives function in the parent window
    if (window.resetLives) {
      window.resetLives(count);
    } else {
      console.error('resetLives function not found in window');
    }
  }
}); 