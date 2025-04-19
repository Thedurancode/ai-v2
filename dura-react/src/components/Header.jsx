import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { ClockCounterClockwise, Star, List, X, Gear, Buildings, MagnifyingGlass, Clock, SignOut } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { checkApiHealth } from '../services/api';

const HeaderContainer = styled.header`
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 1024px) {
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
    margin-bottom: 0.75rem;
  }
`;

const Logo = styled(motion.div)`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const LogoImg = styled.img`
  height: 40px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));

  @media (max-width: 1024px) {
    height: 36px;
  }

  @media (max-width: 768px) {
    height: 24px;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    display: none; /* Hide on mobile, use hamburger menu instead */
  }
`;

const MenuButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.15);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  padding: 0.6rem;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    background: rgba(99, 102, 241, 0.25);
  }
`;

const SideMenu = styled(motion.div)`
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  max-width: 85%;
  height: 100vh;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  padding: 5rem 1.5rem;
  z-index: 90;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);

  @media (max-width: 480px) {
    padding: 4rem 1rem;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 80;
  display: block;
`;

const MenuNavButton = styled(motion.button)`
  background: rgba(99, 102, 241, 0.15);
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  text-decoration: none;
  width: 100%;

  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 1rem;
    gap: 0.75rem;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.25);
  }
`;

// Create a motion component for Link
const MotionLink = motion(Link);

const NavButton = styled(motion.button)`
  background: rgba(99, 102, 241, 0.15);
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  text-decoration: none;

  @media (max-width: 1200px) {
    padding: 0.8rem 1.35rem;
    font-size: 1rem;
    gap: 0.8rem;
  }

  @media (max-width: 1024px) {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
    gap: 0.75rem;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.25);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
  }
`;

const ButtonIcon = styled(motion.span)`
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;

    @media (max-width: 1024px) {
      width: 20px;
      height: 20px;
    }
  }
`;

// Server status indicator
const ServerStatusDot = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $serverOnline }) => ($serverOnline ? '#22c55e' : '#ccc')}; /* green for online, gray for offline */
  margin-right: 0.75rem;
  box-shadow: ${({ $serverOnline }) => ($serverOnline ? '0 0 6px 2px #22c55e44' : 'none')};
`;

const AdminBadge = styled.span`
  display: inline-block;
  background: linear-gradient(90deg, #3a86ff, #8338ec);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.75rem;
  box-shadow: 0 2px 6px rgba(58, 134, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Header = ({ toggleCompanyHistory }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole') || 'user';
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    // Clear authentication state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    // Redirect to login page
    navigate('/login');
  };

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const health = await checkApiHealth();
        if (mounted) setServerOnline(!!health?.api_server);
      } catch {
        if (mounted) setServerOnline(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // poll every 15s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <HeaderContainer>
      <Link to="/">
        <Logo
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Server Status Dot */}
          <ServerStatusDot title={serverOnline ? 'Server Online' : 'Server Offline'} $serverOnline={serverOnline} />
          <LogoImg
            src="https://www.ccab.com/wp-content/uploads/2023/02/MLSE-Logo_No-Box_Platinum.png"
            alt="MLSE Logo"
          />
          {userRole === 'admin' && <AdminBadge>Admin</AdminBadge>}
        </Logo>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {location.pathname === '/' && (
          <NavButton
            as={MotionLink}
            to="http://localhost:5173/potential-partners"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              marginRight: '0.5rem',
              padding: '0.5rem 0.8rem',
              fontSize: '0.85rem',
              borderRadius: '0.5rem'
            }}
          >
            <ButtonIcon
              animate={{ rotate: [0, 0, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 5
              }}
            >
              <Clock size={16} weight="bold" />
            </ButtonIcon>
            Recent Search
          </NavButton>
        )}

        <MenuButton
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? <X size={26} /> : <List size={26} />}
        </MenuButton>
      </div>

      {isMobileMenuOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <SideMenu
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {location.pathname === '/' ? (
          <>
            <MenuNavButton
              as={MotionLink}
              to="/current-partners"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Buildings size={22} weight="fill" />
              Current Partners
            </MenuNavButton>
            <MenuNavButton
              as={MotionLink}
              to="/potential-partners"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <MagnifyingGlass size={22} weight="fill" />
              Potential Partners
            </MenuNavButton>
            <MenuNavButton
              as={MotionLink}
              to="/favorites"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Star size={22} weight="fill" />
              Favorites
            </MenuNavButton>
            <MenuNavButton
              onClick={() => {
                toggleCompanyHistory();
                setIsMobileMenuOpen(false);
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <ClockCounterClockwise size={22} weight="bold" />
              Previously Viewed
            </MenuNavButton>
            <MenuNavButton
              as={MotionLink}
              to="http://localhost:5173/potential-partners"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Clock size={22} weight="bold" />
              Recent Search
            </MenuNavButton>
            <MenuNavButton
              as={MotionLink}
              to="/settings"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Gear size={22} weight="bold" />
              Settings
            </MenuNavButton>

            {userRole === 'admin' && (
              <>
                <div style={{
                  margin: '1.5rem 0 0.5rem',
                  padding: '0.5rem 0',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  Admin Controls
                </div>
                <MenuNavButton
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ background: 'rgba(99, 102, 241, 0.25)' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Gear size={22} weight="bold" />
                  Manage Users
                </MenuNavButton>
              </>
            )}

            <MenuNavButton
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              style={{ marginTop: 'auto', background: 'rgba(220, 38, 38, 0.15)' }}
            >
              <SignOut size={22} weight="bold" />
              Logout
            </MenuNavButton>
          </>
        ) : (
          <>
            <MenuNavButton
              as={MotionLink}
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              whileTap={{ scale: 0.97 }}
            >
              Back to Broad Search
            </MenuNavButton>
            <MenuNavButton
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              style={{ marginTop: 'auto', background: 'rgba(220, 38, 38, 0.15)' }}
            >
              <SignOut size={22} weight="bold" />
              Logout
            </MenuNavButton>
          </>
        )}
      </SideMenu>
    </HeaderContainer>
  );
};

export default Header;
