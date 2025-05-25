using UnityEngine;
using System.Runtime.InteropServices;

public class GameManager : MonoBehaviour
{
    [Header("Lives Configuration")]
    [SerializeField] private int maxLives = 3;
    [SerializeField] private int currentLives;
    [SerializeField] private GameObject gameOverPanel;
    [SerializeField] private GameObject gameplayUI;
    
    private bool isGameLocked = false;

    // Import JavaScript functions
    [DllImport("__Internal")]
    private static extern void decreaseLives();
    
    [DllImport("__Internal")]
    private static extern void resetLives(int count);

    private void Awake()
    {
        // Make sure the GameManager persists between scenes
        DontDestroyOnLoad(gameObject);
    }

    private void Start()
    {
        // Initialize lives
        currentLives = maxLives;
        
        // Reset the lives in the JavaScript bridge
        #if UNITY_WEBGL && !UNITY_EDITOR
        resetLives(maxLives);
        #endif
        
        // Hide the game over panel initially
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(false);
        }
    }

    // Call this method when the player loses a life
    public void LoseLife()
    {
        if (isGameLocked) return;
        
        currentLives--;
        
        // Call the JavaScript function to decrease lives
        #if UNITY_WEBGL && !UNITY_EDITOR
        decreaseLives();
        #endif
        
        // Check if the player has run out of lives
        if (currentLives <= 0)
        {
            GameOver();
        }
    }

    // Call this method when the player runs out of lives
    private void GameOver()
    {
        isGameLocked = true;
        
        // Show the game over panel
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(true);
        }
        
        // Hide gameplay UI
        if (gameplayUI != null)
        {
            gameplayUI.SetActive(false);
        }
    }

    // Call this method to unlock the game
    public void UnlockGame(string message)
    {
        isGameLocked = false;
        
        // Reset lives
        currentLives = maxLives;
        
        // Reset the lives in the JavaScript bridge
        #if UNITY_WEBGL && !UNITY_EDITOR
        resetLives(maxLives);
        #endif
        
        // Hide the game over panel
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(false);
        }
        
        // Show gameplay UI
        if (gameplayUI != null)
        {
            gameplayUI.SetActive(true);
        }
    }

    // Call this method to lock the game
    public void LockGame(string message)
    {
        isGameLocked = true;
        
        // Show the game over panel
        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(true);
        }
        
        // Hide gameplay UI
        if (gameplayUI != null)
        {
            gameplayUI.SetActive(false);
        }
    }
    
    // Public method to check if the game is locked
    public bool IsGameLocked()
    {
        return isGameLocked;
    }
} 