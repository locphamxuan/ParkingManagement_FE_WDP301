import { useEffect, useState } from 'react';
import { useAnimation } from 'framer-motion';

/**
 * Vòng lặp mô phỏng bãi đỗ 3D (2 xe vào/ra, cổng, khói xả, HUD) tách khỏi
 * AnimatedParkingMap3D để component chỉ còn phần render. Ở chế độ `interactive`
 * thì dừng mô phỏng, hiển thị hướng dẫn chọn ô. `paused` dừng hẳn vòng lặp
 * (dùng cho bản preview khi người dùng bật prefers-reduced-motion).
 */
export function useParkingSimulation(interactive: boolean, paused = false) {
  const [hudMessage, setHudMessage] = useState('Starting simulation system...');
  const [simPhase, setSimPhase] = useState(0);

  // Animation controllers for Car A (Cyan Sedan) and Car B (Fuchsia SUV)
  const controlsCarA = useAnimation();
  const controlsCarB = useAnimation();

  // Control gates
  const [gateAOpen, setGateAOpen] = useState(false);
  const [gateBOpen, setGateBOpen] = useState(false);

  // States for headlights and parking status
  const [carAState, setCarAState] = useState<'driving' | 'parking' | 'parked'>('driving');
  const [carBState, setCarBState] = useState<'driving' | 'parking' | 'parked'>('parked');

  // Exhaust smoke particle state triggers
  const [smokeParticles, setSmokeParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (interactive || paused) {
      setCarAState('parked');
      setCarBState('parked');
      setGateAOpen(false);
      setGateBOpen(false);
      setHudMessage(
        interactive
          ? 'Please select an available (green) slot on the map.'
          : 'Simulation paused.',
      );
      return;
    }

    let active = true;

    async function runSimulationLoop() {
      if (!active) return;

      // Phase 0: Reset states
      setSimPhase(0);
      setHudMessage('System running smoothly. 3 available slots.');
      setCarAState('driving');
      setCarBState('parked');
      setGateAOpen(false);
      setGateBOpen(false);

      // Reset positions instantly (all cars HORIZONTAL rotateZ: 0)
      try {
        controlsCarA.set({ x: -100, y: 155, rotateZ: 0, opacity: 0 });
        controlsCarB.set({ x: 291, y: 37, rotateZ: 0, opacity: 1 });
      } catch (err) {
        console.warn('Animation controllers not yet ready:', err);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!active) return;

      // PHASE 1: Car A (Cyan Sedan) Enters
      setSimPhase(1);
      setHudMessage('Gate 1: Detecting incoming Cyan EV...');
      setGateAOpen(true);

      await new Promise((resolve) => setTimeout(resolve, 800));
      if (!active) return;

      // Drive through gate
      try {
        await controlsCarA.start({
          opacity: 1,
          x: 100,
          y: 155,
          rotateZ: 0,
          transition: { type: 'spring', stiffness: 50, damping: 14 }
        });
      } catch (err) {
        console.warn('controlsCarA start failed:', err);
      }
      if (!active) return;

      setGateAOpen(false);
      setHudMessage('Cyan Sedan is moving along the lane...');

      const safeStart = async (controls: any, definition: any) => {
        try {
          if (active) {
            await controls.start(definition);
          }
        } catch (err) {
          console.warn('Animation start error ignored (likely component unmounted):', err);
        }
      };

      // Drive to Slot 3 alignment (center X: 240px - half car width 28px = 212px)
      await safeStart(controlsCarA, {
        x: 212,
        y: 155,
        rotateZ: 0,
        transition: { ease: 'linear', duration: 1.2 }
      });
      if (!active) return;

      setHudMessage('Aligning parking position. Reversing into slot 3...');
      setCarAState('parking');

      // Reverse Park into Slot 3 (exact Y: 37px, rotateZ: 0 horizontal)
      await safeStart(controlsCarA, {
        x: 212,
        y: 37,
        rotateZ: 0,
        transition: { type: 'spring', stiffness: 40, damping: 12 }
      });
      if (!active) return;

      setCarAState('parked');
      setHudMessage('Cyan Sedan parked at slot 3. Starting EV charging.');

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!active) return;

      // PHASE 2: Car B (Fuchsia SUV) Exits
      setSimPhase(2);
      setHudMessage('Command received: Fuchsia SUV at slot 4 preparing to exit...');
      setCarBState('driving');

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!active) return;

      // Drive out of slot 4 down to lane
      setHudMessage('Fuchsia SUV is leaving slot 4...');
      await safeStart(controlsCarB, {
        x: 291,
        y: 155,
        rotateZ: 0,
        transition: { type: 'spring', stiffness: 45, damping: 12 }
      });
      if (!active) return;

      setHudMessage('Moving toward toll gate 2...');
      setGateBOpen(true);

      // Drive to exit gate
      await safeStart(controlsCarB, {
        x: 380,
        y: 155,
        rotateZ: 0,
        transition: { ease: 'linear', duration: 1.2 }
      });
      if (!active) return;

      setHudMessage('RFID scan successful. Toll gate 2 open.');

      // Exit screen
      await safeStart(controlsCarB, {
        x: 520,
        y: 155,
        rotateZ: 0,
        transition: { type: 'spring', stiffness: 50, damping: 12 }
      });
      if (!active) return;

      setGateBOpen(false);
      setHudMessage('Fuchsia SUV has left. Transaction successful.');

      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (!active) return;

      // Loop restart
      runSimulationLoop();
    }

    runSimulationLoop();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlsCarA, controlsCarB, paused]);

  // Handle active car smoke particles spawning during motion
  useEffect(() => {
    if (simPhase === 0 || paused) return;

    const interval = setInterval(() => {
      if (simPhase === 1 && carAState === 'driving') {
        setSmokeParticles((prev) => [
          ...prev.slice(-4),
          { id: Math.random(), x: 90, y: 170 }
        ]);
      }
      if (simPhase === 2 && carBState === 'driving') {
        setSmokeParticles((prev) => [
          ...prev.slice(-4),
          { id: Math.random(), x: 260, y: 170 }
        ]);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [simPhase, carAState, carBState, paused]);

  return {
    hudMessage, simPhase,
    gateAOpen, gateBOpen,
    carAState, carBState,
    smokeParticles,
    controlsCarA, controlsCarB,
  };
}
