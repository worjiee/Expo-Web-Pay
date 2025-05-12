import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/axios';

const Public = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
    // Clear any errors on initial load
    setError('');
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

  // Function to attempt code verification with maximum resilience
  const verifyCodeWithRetry = async (code, retriesLeft = 3) => {
    try {
      // Send code to server for verification
      console.log(`Attempting code verification (retries left: ${retriesLeft})`);
      const response = await api.post('/codes/verify', { code });
      console.log('Verification successful:', response.data);
      return response;
    } catch (err) {
      console.error('Verification error:', err);
      
      // If we have retries left and this is a network error, try again
      if (retriesLeft > 0 && !err.response) {
        // Longer delay between retries for mobile connections
        const retryDelay = (4 - retriesLeft) * 1500; // 1.5s, 3s, 4.5s
        console.log(`Network error. Retrying verification in ${retryDelay/1000}s... (${retriesLeft} retries left)`);
        
        // Show retry toast
        toast.info(
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-sync-alt fa-spin me-2"></i>
              <span>Retrying...</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
              Network issues detected. Trying again...
            </div>
          </div>,
          { 
            position: 'top-center',
            autoClose: retryDelay - 200,
            hideProgressBar: false
          }
        );
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return verifyCodeWithRetry(code, retriesLeft - 1);
      }
      
      // If all retries failed, throw the error
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerified(false);

    // Validate code format
    if (!code || code.trim() === '') {
      setError('Please enter a valid access code');
      setLoading(false);
      return;
    }

    const codeToVerify = code.trim().toUpperCase(); // Standardize code format
    console.log('Verifying code:', codeToVerify);
    
    // IMPORTANT CHANGE: Check localStorage FIRST before trying any API calls
    // This ensures we check the same storage that the admin panel uses
    try {
      // Direct localStorage check
      console.log('Checking localStorage directly for code verification');
      const storedCodes = localStorage.getItem('mockDb_codes');
      
      if (storedCodes) {
        const codes = JSON.parse(storedCodes);
        console.log('Found codes in localStorage:', codes);
        
        // Case-insensitive comparison
        const matchingCode = codes.find(c => 
          c.code.toLowerCase() === codeToVerify.toLowerCase() && !c.used
        );
        
        if (matchingCode) {
          console.log('DIRECT MATCH FOUND IN LOCAL STORAGE:', matchingCode);
          
          // Mark as used directly in localStorage
          matchingCode.used = true;
          matchingCode.usedAt = new Date().toISOString();
          localStorage.setItem('mockDb_codes', JSON.stringify(codes));
          
          // Show success message
          setMessage('Access code verified successfully! Redirecting to game...');
          setVerified(true);
          
          // Show success toast
          toast.success(
            <div>
              <i className="fas fa-check-circle me-2"></i> Code verified successfully!
            </div>,
            { 
              position: 'top-center',
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              style: successToastStyle
            }
          );
          
          // Redirect to game after delay
          setTimeout(() => {
            window.location.href = gameUrl;
          }, 2000);
          
          setLoading(false);
          return;
        } else {
          // Check if code exists but is already used
          const usedMatchingCode = codes.find(c => 
            c.code.toLowerCase() === codeToVerify.toLowerCase() && c.used
          );
          
          if (usedMatchingCode) {
            console.log('Code found but already used:', usedMatchingCode);
            setError('This code has already been used.');
            
            // Show error toast
            toast.error(
              <div>
                <i className="fas fa-exclamation-triangle me-2"></i> Code already used!
              </div>,
              { 
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                style: errorToastStyle
              }
            );
            
            setLoading(false);
            return;
          }
          
          // If no code found at all, show invalid code error
          console.log('No matching code found in localStorage');
          setError('Invalid code. Please check and try again.');
          
          // Show error toast
          toast.error(
            <div>
              <i className="fas fa-exclamation-triangle me-2"></i> Invalid code
            </div>,
            { 
              position: 'top-center',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              style: errorToastStyle
            }
          );
          
          setLoading(false);
          return;
        }
      } else {
        console.log('No codes found in localStorage');
      }
      
      // If we got here, the local storage check didn't work or didn't exist
      // As a fallback, try the API verification
      console.log('Falling back to API verification');
      
      // Show a loading message for API verification
      toast.info(
        <div>
          <i className="fas fa-spinner fa-spin me-2"></i> Verifying code...
        </div>,
        { 
          position: 'top-center',
          autoClose: 1500,
          hideProgressBar: false
        }
      );
      
      // Try the API verification as a backup
      const response = await api.post('/codes/verify', { code: codeToVerify });
      
      // If we got here, the API verification worked
      setMessage('Access code verified successfully! Redirecting to game...');
      setVerified(true);
      
      // Show success toast
      toast.success(
        <div>
          <i className="fas fa-check-circle me-2"></i> Code verified successfully!
        </div>,
        { 
          position: 'top-center',
          autoClose: 2000,
          hideProgressBar: false,
          style: successToastStyle
        }
      );
      
      // Redirect to game after delay
      setTimeout(() => {
        window.location.href = gameUrl;
      }, 2000);
      
    } catch (err) {
      console.error('All verification methods failed:', err);
      
      // Show appropriate error message
      if (err.response && err.response.status === 400) {
        setError('This code has already been used.');
        
        // Show error toast
        toast.error(
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i> Code already used!
          </div>,
          { 
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            style: errorToastStyle
          }
        );
      } else {
        setError('Invalid code. Please check and try again.');
        
        // Show error toast
        toast.error(
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i> Invalid code
          </div>,
          { 
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: false,
            style: errorToastStyle
          }
        );
      }
    }
    
    setLoading(false);
  };

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
                className="btn me-3"
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
                className="btn"
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
                Admin Portal
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
                    <p className="text-muted">Please enter your access code to play the game</p>
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
                            onChange={(e) => {
                              setCode(e.target.value.toUpperCase());
                              setError(''); // Clear error when user starts typing
                            }}
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
        
        {/* Footer Navigation Bar */}
        <footer className="footer py-4" style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          zIndex: 10,
          backgroundColor: 'rgba(0, 12, 36, 0.85)',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
          width: '100%',
          marginTop: 'auto',
          animation: 'fadeIn 0.5s ease-in-out'
        }}>
          <div className="container">
            {/* Team Members Section */}
            <div className="team-section mb-4">
              <h5 className="text-center text-white mb-3" style={{
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                fontWeight: '600',
                letterSpacing: '1px'
              }}>
                <i className="fas fa-users me-2"></i>
                Our Team
              </h5>
              <div className="d-flex justify-content-center flex-wrap" style={{ gap: '15px' }}>
                {teamMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="team-member" 
                    onClick={() => setActiveTeamMember(member)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transition: 'transform 0.3s, border 0.3s',
                      animation: 'pulse 3s infinite',
                      animationDelay: `${member.id * 0.2}s`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <img 
                      src={member.image} 
                      alt={member.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=50`;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
              <div className="text-white text-center mb-2 mb-md-0 me-md-4" style={{
                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                opacity: '0.9'
              }}>
                <span>© 2025 End of The Road - Creating immersive pixel adventures</span>
              </div>
              <div className="d-flex">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white mx-2" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  opacity: '0.8',
                  transition: 'opacity 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-white mx-2" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  opacity: '0.8',
                  transition: 'opacity 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <i className="fab fa-discord"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white mx-2" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  opacity: '0.8',
                  transition: 'opacity 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </footer>
        
        {/* Team Member Popup Modal */}
        {activeTeamMember && (
          <div 
            className="team-member-modal" 
            onClick={() => setActiveTeamMember(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1050,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'fadeIn 0.3s'
            }}
          >
            <div 
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '25px',
                maxWidth: '350px',
                width: '90%',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
                animation: 'slideUp 0.4s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div 
                className="close-button" 
                onClick={() => setActiveTeamMember(null)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
              >
                <i className="fas fa-times"></i>
              </div>
              
              <div className="text-center" style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  border: '3px solid #3a7bd5',
                  overflow: 'hidden',
                  animation: 'pulse 2s infinite'
                }}>
                  <img 
                    src={activeTeamMember.image} 
                    alt={activeTeamMember.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeTeamMember.name)}&background=random&color=fff&size=120`;
                    }}
                  />
                </div>
                <h3 style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '5px'
                }}>
                  {activeTeamMember.name}
                </h3>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 15px',
                  backgroundColor: 'rgba(58, 123, 213, 0.1)',
                  borderRadius: '20px',
                  color: '#3a7bd5',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  marginBottom: '15px'
                }}>
                  {activeTeamMember.role}
                </div>
              </div>
              
              <p style={{
                lineHeight: '1.6',
                color: '#555',
                textAlign: 'center',
                padding: '0 10px'
              }}>
                {activeTeamMember.info}
              </p>
              
              <div className="social-links d-flex justify-content-center mt-3" style={{ gap: '15px' }}>
                <a href="#" className="social-link" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#3a7bd5',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                  boxShadow: '0 3px 10px rgba(58, 123, 213, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#" className="social-link" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#3a7bd5',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                  boxShadow: '0 3px 10px rgba(58, 123, 213, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#3a7bd5',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                  boxShadow: '0 3px 10px rgba(58, 123, 213, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <i className="fas fa-envelope"></i>
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* CSS Animations */}
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