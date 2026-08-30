import { useState, useEffect } from 'react';
import logoImg from '../../assets/logo.webp';
import { isNative } from '../../utils/platform';
import './SplashScreen.css';

export default function SplashScreen({ onFinish }) {
    const [phase, setPhase] = useState('enter'); // enter -> visible -> exit

    useEffect(() => {
        // Logo animates in
        const showTimer = setTimeout(() => setPhase('visible'), 100);
        // Start exit after 1.8s
        const exitTimer = setTimeout(() => setPhase('exit'), 1800);
        // Finish and unmount after exit animation
        const finishTimer = setTimeout(() => onFinish(), 2400);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(exitTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        // On Android the system splash already shows this logo at this size,
        // so re-running the entrance animation would make it visibly pop.
        <div className={`splash splash--${phase}${isNative ? ' splash--handoff' : ''}`}>
            <div className="splash__content">
                <div className="splash__logo-wrapper">
                    <img className="splash__logo" src={logoImg} alt="Kelola Keuangan" />
                    <div className="splash__ring" />
                    <div className="splash__ring splash__ring--2" />
                </div>
                <h1 className="splash__title">Kelola Keuangan</h1>
                <p className="splash__subtitle">Atur keuanganmu dengan mudah</p>
            </div>
            <div className="splash__footer">
                <span className="splash__credit">by DealTech</span>
            </div>
        </div>
    );
}
