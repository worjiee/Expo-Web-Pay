import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Public = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [activeTeamMember, setActiveTeamMember] = useState(null);
  
  // Team members data
  const teamMembers = [
    { id: 1, name: "Jamespetter Lazaro", role: "Lead Developer", image: "/team/james.jpg", info: "James leads our development team with expertise in game programming and architecture." },
    { id: 2, name: "Karl Santino Sacayan", role: "Art Director", image: "/team/karlpogi.jpg", info: "Karl oversees all visual elements in our games, specializing in pixel art and character design." },
    { id: 3, name: "Kysha Gayle Toribio", role: "Sound Designer", image: "/team/kysha.jpg", info: "Kysha creates immersive soundscapes and music that bring our game worlds to life." },
    { id: 4, name: "Emmanuel Jacob Montes", role: "Game Designer", image: "/team/ejay.jpg", info: "Emmanuel (Ejay) focuses on gameplay mechanics and player experience design." },
    { id: 5, name: "Jaymar Abistado", role: "UI/UX Designer", image: "/team/jay.jpg", info: "Jaymar ensures our interfaces are both beautiful and intuitive for the best player experience." },
    { id: 6, name: "Drix John Delos Reyes", role: "Producer", image: "/team/drix.jpg", info: "Drix manages project timelines and coordinates between all departments to deliver quality games." },
    { id: 7, name: "Stefanie Zophia Choco", role: "Narrative Designer", image: "/team/phia.jpg", info: "Stefanie crafts compelling stories and characters that engage players in our game worlds." },
    { id: 8, name: "Paul Rovic Angeles", role: "QA Lead", image: "/team/hookadoncic.jpg", info: "Paul ensures our games meet the highest quality standards before release through rigorous testing." },
    { id: 9, name: "Nathan Villena", role: "Community Manager", image: "/team/thathan.jpg", info: "Nathan builds and nurtures our amazing player community, gathering feedback and organizing events." },
    { id: 10, name: "John Lynard Cabading", role: "Marketing Director", image: "/team/polgorg.jpg", info: "John develops strategies to bring our games to wider audiences and create engaging campaigns." },
    { id: 11, name: "Bernard James Raplisa", role: "Technical Artist", image: "/team/bernard.jpg", info: "Bernard bridges the gap between art and programming, optimizing visual assets and creating technical solutions for the art pipeline." }
  ];
  
  // URL of your Unity WebGL game
  const gameUrl = 'https://www.clyoth.top/';

  useEffect(() => {
    // Add fade-in animation when component mounts
    setFadeIn(true);
  }, []);

  // Custom toast styles
  const successToastStyle = {
    background: 'linear-gradient(135deg, #2980b9 0%, #2ecc71 100%)',
    borderRadius: '8px',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  };
  
  const errorToastStyle = {
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    borderRadius: '8px',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  };

  // EXTREMELY SIMPLIFIED CODE VERIFICATION with detailed logging
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setVerified(false);

    // Clean input code - uppercase and remove whitespace
    const cleanCode = code.trim().toUpperCase();
    console.log(`Verifying code: "${cleanCode}"`);
    
    try {
      // Direct localStorage access - absolute minimum approach
      const storedData = localStorage.getItem('mockDb_codes');
      console.log(`Found localStorage data: ${storedData ? 'yes' : 'no'} (${storedData ? storedData.length : 0} bytes)`);
      
      if (!storedData) {
        console.error('No codes found in localStorage');
        toast.error('No codes found. Please generate some codes first.');
        setLoading(false);
        return;
      }
      
      // Parse the codes
      const allCodes = JSON.parse(storedData);
      console.log(`Parsed ${allCodes.length} codes from localStorage`);
      
      // Log first few codes for debugging
      if (allCodes.length > 0) {
        console.log('Sample stored codes:');
        allCodes.slice(0, 3).forEach((c, i) => {
          console.log(`Code ${i+1}: ${JSON.stringify(c)}`);
        });
      }
      
      // Find the code with basic array methods
      // Using a for loop for maximum compatibility
      let foundCode = null;
      let foundIndex = -1;
      
      console.log(`Searching for code match: "${cleanCode}"`);
      for (let i = 0; i < allCodes.length; i++) {
        const currentCode = allCodes[i];
        const storedCodeValue = (currentCode.code || '').toString().trim().toUpperCase();
        
        console.log(`Comparing with: "${storedCodeValue}" - match: ${storedCodeValue === cleanCode}`);
        
        if (storedCodeValue === cleanCode) {
          foundCode = currentCode;
          foundIndex = i;
          console.log(`Match found at index ${i}: ${JSON.stringify(foundCode)}`);
          break;
        }
      }
      
      if (!foundCode) {
        console.error(`No matching code found for: "${cleanCode}"`);
        toast.error('Invalid code. Please check and try again.', {
          position: 'top-center',
          style: errorToastStyle
        });
        setLoading(false);
        return;
      }
      
      if (foundCode.used) {
        console.error(`Code "${cleanCode}" has already been used`);
        toast.error('This code has already been used.', {
          position: 'top-center',
          style: errorToastStyle
        });
        setLoading(false);
        return;
      }
      
      // Mark code as used with simple direct array modification
      console.log(`Marking code ${cleanCode} as used`);
      allCodes[foundIndex].used = true;
      allCodes[foundIndex].usedAt = new Date().toISOString();
      
      // Save updated codes
      localStorage.setItem('mockDb_codes', JSON.stringify(allCodes));
      console.log('Saved updated codes to localStorage');
      
      // Success! Show message and redirect
      setVerified(true);
      setMessage('Code verified successfully! Redirecting to game...');
      console.log('Code verification successful, preparing redirect');
      
      toast.success('Code verified successfully!', {
        position: 'top-center',
        style: successToastStyle
      });
      
      // Redirect after delay
      console.log(`Will redirect to ${gameUrl} in 2 seconds`);
      setTimeout(() => {
        window.location.href = gameUrl;
      }, 2000);
      
    } catch (err) {
      console.error('Error verifying code:', err);
      toast.error(`Error verifying code: ${err.message || 'Unknown error'}`, {
        position: 'top-center',
        style: errorToastStyle
      });
    }
    
    setLoading(false);
  };

  // ... rest of your component code remains unchanged ...

  return (
    <div style={{
      backgroundImage: `url('/bg_game_moving.gif')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'auto', // Ensure scrolling works properly on mobile
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay for better readability on mobile
        zIndex: 1,
        overflow: 'auto', // Enable scrolling on this layer
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Navigation Bar with animation */}
        <nav className="navbar navbar-expand-lg navbar-dark" style={{
          background: 'rgba(0, 12, 36, 0.85)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.5s ease-in-out',
          padding: '15px 0',
          position: 'relative',
          zIndex: 2
        }}>
          <div className="container d-flex justify-content-between align-items-center">
            <Link to="/" className="navbar-brand d-flex align-items-center">
              <div style={{ 
                width: '40px',
                height: '40px',
                marginRight: '12px',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0
              }}>
                <img 
                  src="/company_logo.jpg" 
                  alt="Company Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <span style={{ 
                fontWeight: '700', 
                letterSpacing: '1px',
                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                color: 'white'
              }}>End of The Road</span>
            </Link>
            
            <div className="d-flex">
              <Link 
                to="/" 
                className="btn me-2"
                style={{
                  background: 'transparent',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 15px',
                  borderRadius: '4px'
                }}
              >
                <i className="fas fa-gamepad me-2"></i>
                Public Portal
              </Link>
              
              <Link 
                to="/login" 
                className="btn me-2"
                style={{
                  background: 'transparent',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 15px',
                  borderRadius: '4px'
                }}
              >
                <i className="fas fa-lock me-2"></i>
                Admin
              </Link>
              
              <Link 
                to="/debug" 
                className="btn"
                style={{
                  background: 'rgba(255,70,70,0.2)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 15px',
                  borderRadius: '4px'
                }}
              >
                <i className="fas fa-bug me-2"></i>
                Debug
              </Link>
            </div>
          </div>
        </nav>
        
        <div className={`container mt-4 mt-md-5 px-3 px-sm-auto ${fadeIn ? 'fadeIn' : ''}`} style={{ 
          animation: 'fadeIn 1s ease-in-out',
          position: 'relative',
          zIndex: 2,
          marginBottom: '30px' // Add bottom margin to ensure there's space at the bottom on mobile
        }}>
          <ToastContainer 
            position="top-center"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden'
              }}>
                <div className="card-header text-center" style={{
                  background: 'linear-gradient(135deg, #2980b9 0%, #2ecc71 100%)',
                  borderBottom: 'none'
                }}>
                  <h2 className="mb-0" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Game Access</h2>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <img 
                      src="/logo_game.png" 
                      alt="Game Logo" 
                      style={{ 
                        width: 'min(150px, 40vw)', // Responsive width 
                        height: 'min(150px, 40vw)', // Responsive height
                        marginBottom: '20px', 
                        animation: 'pulse 2s infinite',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #3a7bd5'
                      }}
                    />
                    <h3 className="card-title text-center" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Enter Your Code</h3>
                    <p className="text-muted">
                      Please enter your access code to play the game <br />
                      <small>(Try the test code: ABCDE)</small>
                    </p>
                  </div>
                  
                  {message && <div className="alert alert-success">{message}</div>}
                  
                  {verified ? (
                    <div className="text-center verification-success">
                      <div className="checkmark-circle mb-4">
                        <i className="fas fa-check-circle" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', color: '#5cb85c' }}></i>
                      </div>
                      <h4 className="mt-2 mb-3" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>Code verified successfully!</h4>
                      <p>
                        <i className="fas fa-gamepad me-2"></i>
                        Redirecting to game...
                      </p>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">
                        If you are not redirected automatically, 
                        <a href={gameUrl} className="btn btn-link">
                          <i className="fas fa-external-link-alt me-1"></i>
                          click here
                        </a>.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Enter your code"
                            required
                            disabled={loading}
                            style={{ 
                              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                              letterSpacing: '2px',
                              height: 'auto',
                              padding: '1.25rem 0.75rem 0.625rem 0.75rem'
                            }}
                          />
                          <label htmlFor="code" style={{ padding: '0.75rem 0.75rem' }}>
                            <i className="fas fa-key me-2"></i>
                            Access Code
                          </label>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100 py-3" // Taller button for better touch targets
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #2980b9 0%, #2ecc71 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                          fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-unlock-alt me-2"></i>
                            Unlock Game Access
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer... rest of component remains the same */}
        
        <style jsx="true">{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Public; 