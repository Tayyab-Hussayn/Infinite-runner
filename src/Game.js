import React, { useState, useEffect, useRef } from 'react';
import './Game.css';

const TRACKS = 5;
const TRACK_HEIGHT = 120;
const GAME_WIDTH = 1200;
const GAME_HEIGHT = TRACKS * TRACK_HEIGHT;
const CAR_WIDTH = 80;
const CAR_HEIGHT = 50;
const PLAYER_SIZE = 40;
const PLAYER_X = GAME_WIDTH - 100;

const Game = () => {
  const [cars, setCars] = useState([]);
  const [playerTrack, setPlayerTrack] = useState(2);
  const [targetTrack, setTargetTrack] = useState(2);
  const [playerY, setPlayerY] = useState(0);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const gameRef = useRef();
  const animationRef = useRef();

  const getTrackY = (track) => track * TRACK_HEIGHT + (TRACK_HEIGHT - CAR_HEIGHT) / 2;
  const getPlayerTrackY = (track) => track * TRACK_HEIGHT + (TRACK_HEIGHT - PLAYER_SIZE) / 2;

  // Smooth player movement
  useEffect(() => {
    const movePlayer = () => {
      const targetY = getPlayerTrackY(targetTrack);
      setPlayerY(current => {
        const diff = targetY - current;
        if (Math.abs(diff) < 2) {
          setPlayerTrack(targetTrack);
          return targetY;
        }
        return current + diff * 0.15;
      });
    };

    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [targetTrack]);

  // Initialize player position
  useEffect(() => {
    setPlayerY(getPlayerTrackY(2));
  }, []);

  // Spawn cars
  useEffect(() => {
    const spawnCar = () => {
      const track = Math.floor(Math.random() * TRACKS);
      const carSpeed = 5 + Math.random() * 5 + speed * 1.0;
      const carTypes = [
        { color: '#FF1744', type: 'sports' },
        { color: '#00E676', type: 'sedan' },
        { color: '#FF9100', type: 'truck' },
        { color: '#E91E63', type: 'taxi' },
        { color: '#2196F3', type: 'police' },
        { color: '#9C27B0', type: 'luxury' },
        { color: '#00BCD4', type: 'electric' }
      ];
      const carType = carTypes[Math.floor(Math.random() * carTypes.length)];
      
      setCars(prev => [...prev, {
        id: Date.now() + Math.random(),
        x: -CAR_WIDTH,
        track,
        speed: carSpeed,
        ...carType
      }]);
    };

    // Balanced spawn rate - easier than before
    const spawnRate = Math.max(1100 - speed * 80, 300);
    const interval = setInterval(spawnCar, spawnRate);
    return () => clearInterval(interval);
  }, [speed]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      setCars(prev => {
        // Move cars straight in their lanes - ALWAYS move regardless of player state
        const updatedCars = prev
          .map(car => ({ ...car, x: car.x + car.speed }))
          .filter(car => car.x < GAME_WIDTH + CAR_WIDTH);

        return updatedCars;
      });

      setScore(prev => prev + 1);
      setSpeed(prev => Math.min(prev + 0.003, 8));
    };

    animationRef.current = setInterval(gameLoop, 16);
    return () => clearInterval(animationRef.current);
  }, []);

  // Separate AI logic to prevent interference with car movement
  useEffect(() => {
    const aiLoop = () => {
      setCars(currentCars => {
        // AI decision making - separate from car movement
        const dangerZone = 200 + speed * 20;
        const currentTrackCars = currentCars.filter(car => 
          car.track === playerTrack && 
          car.x > PLAYER_X - dangerZone && 
          car.x < PLAYER_X + 60
        );

        if (currentTrackCars.length > 0) {
          // Find safest track
          const trackSafety = [];
          for (let track = 0; track < TRACKS; track++) {
            const trackCars = currentCars.filter(car => 
              car.track === track && 
              car.x > PLAYER_X - dangerZone && 
              car.x < PLAYER_X + 100
            );
            trackSafety.push({ track, cars: trackCars.length });
          }

          const safestTrack = trackSafety.reduce((safest, current) => 
            current.cars < safest.cars ? current : safest
          ).track;

          // Only switch if player is not already moving
          if (safestTrack !== targetTrack && Math.abs(playerY - getPlayerTrackY(playerTrack)) < 10) {
            setTargetTrack(safestTrack);
          }
        }

        return currentCars; // Don't modify cars in AI loop
      });
    };

    const aiInterval = setInterval(aiLoop, 50); // AI runs less frequently
    return () => clearInterval(aiInterval);
  }, [playerTrack, targetTrack, speed, playerY]);

  return (
    <div className="game-container">
      <div className="hud">
        <div>Time: {Math.floor(score / 60)}s</div>
        <div>Speed: {speed.toFixed(1)}x</div>
      </div>
      
      <div className="game-area" ref={gameRef}>
        {/* Track lines */}
        {Array(TRACKS + 1).fill().map((_, i) => (
          <div 
            key={i} 
            className="track-line" 
            style={{ top: i * TRACK_HEIGHT }}
          />
        ))}
        
        {/* Cars */}
        {cars.map(car => (
          <div
            key={car.id}
            className={`car car-${car.type}`}
            style={{
              left: car.x,
              top: getTrackY(car.track),
              backgroundColor: car.color
            }}
          />
        ))}
        
        {/* Player - Doraemon */}
        <div
          className="player doraemon"
          style={{
            left: PLAYER_X,
            top: playerY
          }}
        >
          <div className="doraemon-face">
            <div className="doraemon-eyes">
              <div className="eye left-eye"></div>
              <div className="eye right-eye"></div>
            </div>
            <div className="doraemon-nose"></div>
            <div className="doraemon-mouth"></div>
          </div>
          <div className="doraemon-bell"></div>
        </div>
      </div>
    </div>
  );
};

export default Game;
