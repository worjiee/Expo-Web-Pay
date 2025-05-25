// Unity Bridge Script
// This script serves as a bridge between the web application and the Unity WebGL game

(function() {
  // Store the initial lives count
  let lives = 3; // Default to 3 lives
  let isGameLocked = false;

  // Function to initialize the bridge when the Unity game is loaded
  function initializeBridge() {
    console.log('Unity Bridge initialized');
    
    // Listen for messages from the parent window (our React app)
    window.addEventListener('message', function(event) {
      // Handle messages from the parent window
      if (event.data && event.data.type === 'UnityMessage') {
        handleMessageFromParent(event.data);
      }
    });
    
    // Send a message to the parent window that the game is ready
    sendMessageToParent('GameReady', {});
  }
  
  // Function to handle messages from the parent window
  function handleMessageFromParent(message) {
    const { functionName, parameter } = message;
    
    switch (functionName) {
      case 'SetLives':
        lives = parseInt(parameter) || 3;
        break;
      case 'UnlockGame':
        isGameLocked = false;
        sendMessageToUnity('UnlockGame', '');
        break;
      case 'LockGame':
        isGameLocked = true;
        sendMessageToUnity('LockGame', '');
        break;
      default:
        // Forward the message to Unity
        sendMessageToUnity(functionName, parameter);
    }
  }
  
  // Function to send a message to the Unity game
  function sendMessageToUnity(functionName, parameter) {
    if (window.unityInstance) {
      try {
        window.unityInstance.SendMessage('GameManager', functionName, parameter);
      } catch (error) {
        console.error('Error sending message to Unity:', error);
      }
    }
  }
  
  // Function to send a message to the parent window
  function sendMessageToParent(eventName, data) {
    window.parent.postMessage({
      type: 'UnityEvent',
      eventName,
      data
    }, '*');
  }
  
  // Function to decrease lives
  window.decreaseLives = function() {
    if (isGameLocked) return;
    
    lives--;
    console.log('Lives decreased to:', lives);
    
    // Send the updated lives count to the parent window
    sendMessageToParent('LivesUpdated', { lives });
    
    // If no lives left, lock the game
    if (lives <= 0) {
      isGameLocked = true;
      sendMessageToParent('LivesEnded', {});
      sendMessageToUnity('LockGame', '');
    }
  };
  
  // Function to reset lives
  window.resetLives = function(count) {
    lives = count || 3;
    console.log('Lives reset to:', lives);
    sendMessageToParent('LivesUpdated', { lives });
  };
  
  // Initialize the bridge when the page loads
  if (document.readyState === 'complete') {
    initializeBridge();
  } else {
    window.addEventListener('load', initializeBridge);
  }
})(); 