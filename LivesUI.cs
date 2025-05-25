using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class LivesUI : MonoBehaviour
{
    [SerializeField] private GameManager gameManager;
    [SerializeField] private TextMeshProUGUI livesText;
    [SerializeField] private Image[] lifeIcons;
    [SerializeField] private int maxLives = 3;
    [SerializeField] private int currentLives = 3;

    private void Start()
    {
        // Find the GameManager if not assigned
        if (gameManager == null)
        {
            gameManager = FindObjectOfType<GameManager>();
        }
        
        UpdateLivesDisplay();
    }

    // Update the lives display
    public void UpdateLivesDisplay()
    {
        // Update text if available
        if (livesText != null)
        {
            livesText.text = $"Lives: {currentLives}";
        }
        
        // Update icons if available
        if (lifeIcons != null && lifeIcons.Length > 0)
        {
            for (int i = 0; i < lifeIcons.Length; i++)
            {
                if (lifeIcons[i] != null)
                {
                    lifeIcons[i].enabled = i < currentLives;
                }
            }
        }
    }

    // Call this method when the player loses a life
    public void LoseLife()
    {
        if (currentLives > 0)
        {
            currentLives--;
            UpdateLivesDisplay();
            
            // Notify the GameManager
            if (gameManager != null)
            {
                gameManager.LoseLife();
            }
        }
    }

    // Call this method to reset lives
    public void ResetLives()
    {
        currentLives = maxLives;
        UpdateLivesDisplay();
    }

    // Set the current number of lives
    public void SetLives(int lives)
    {
        currentLives = Mathf.Clamp(lives, 0, maxLives);
        UpdateLivesDisplay();
    }
} 