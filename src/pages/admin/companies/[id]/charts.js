// This script will be loaded on the client side to initialize charts
// after the page has fully loaded to avoid React hook errors

// Wait for the page to fully load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Charts script loaded');
  
  // Add a small delay to ensure React has fully initialized
  setTimeout(() => {
    // Find chart placeholders and replace with actual charts
    const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
    
    if (chartPlaceholders.length > 0) {
      console.log(`Found ${chartPlaceholders.length} chart placeholders`);
      
      // Remove the loading message and allow React to render the charts
      chartPlaceholders.forEach(placeholder => {
        placeholder.classList.remove('chart-placeholder');
        placeholder.innerHTML = '';
    });
  }
}, 500);
});
