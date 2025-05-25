# Game Locking Feature Implementation Guide

This guide explains how to implement the game locking feature in your Unity WebGL game. This feature will lock the game when the player runs out of lives and require an unlock code to continue playing.

## Files Overview

1. **GamePage.js** - React component that handles the game display and code verification
2. **unityBridge.js** - JavaScript bridge between the web application and Unity WebGL game
3. **GameManager.cs** - Unity C# script for managing lives and game locking
4. **LivesUI.cs** - Unity C# script for displaying lives in the game UI
5. **WebGLBridge.jslib** - JavaScript plugin for Unity WebGL

## Implementation Steps

### Step 1: Unity Game Setup

1. Create a new GameObject in your Unity scene and name it "GameManager"
2. Attach the `GameManager.cs` script to this GameObject
3. Create a UI for displaying lives (e.g., heart icons or text)
4. Create a "Game Over" panel that will be shown when the player runs out of lives
5. Attach the `LivesUI.cs` script to your lives UI GameObject
6. Configure the references in the Inspector:
   - Assign the GameManager reference in the LivesUI script
   - Assign the gameOverPanel and gameplayUI references in the GameManager script
   - Set up life icons or text in the LivesUI script

### Step 2: Unity WebGL Plugin Setup

1. Create a "Plugins" folder in your Unity project's Assets directory if it doesn't exist
2. Create a "WebGL" folder inside the Plugins folder
3. Copy the `WebGLBridge.jslib` file into the WebGL folder

### Step 3: Integrate with Your Game Logic

1. Call the `LoseLife()` method from the LivesUI script whenever the player should lose a life, for example:
   ```csharp
   // When the player gets hit by an enemy
   public void OnPlayerHit()
   {
       livesUI.LoseLife();
   }
   ```

2. Make sure your game respects the locked state by checking `isGameLocked` in the GameManager:
   ```csharp
   // In your player controller script
   private GameManager gameManager;
   
   private void Start()
   {
       gameManager = FindObjectOfType<GameManager>();
   }
   
   private void Update()
   {
       // Skip player input processing if the game is locked
       if (gameManager != null && gameManager.IsGameLocked())
       {
           return;
       }
       
       // Process player input here
   }
   ```

### Step 4: Build and Deploy

1. Build your Unity WebGL game
2. Copy the build files to your web server or hosting platform
3. Update the iframe URL in the `GamePage.js` file to point to your game's URL

## How It Works

1. The player starts with a certain number of lives (default: 3)
2. When the player loses all lives, the game is locked and a message is sent to the web application
3. The web application shows a form to enter an unlock code
4. If the player enters a valid code, the game is unlocked and the player's lives are reset
5. The code verification is handled by the existing code verification system

## Customization

- You can change the number of lives by modifying the `maxLives` variable in the GameManager script
- You can customize the appearance of the game over panel in Unity
- You can modify the code verification logic in the web application if needed

## Troubleshooting

- If the communication between Unity and the web application isn't working, check the browser console for errors
- Make sure the GameManager GameObject is present in your scene
- Verify that the WebGLBridge.jslib file is correctly placed in the Plugins/WebGL folder
- Ensure that your Unity WebGL game is properly loaded in the iframe 