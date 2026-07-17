import React, { createContext, useContext, useState, useEffect } from 'react';

type AnimationSetting = 'minimal' | 'dynamic';

interface SettingsContextType {
  animationSetting: AnimationSetting;
  setAnimationSetting: (setting: AnimationSetting) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [animationSetting, setAnimationSettingState] = useState<AnimationSetting>('dynamic');

  useEffect(() => {
    const saved = localStorage.getItem('propit_animation_setting') as AnimationSetting;
    if (saved === 'dynamic') {
      setAnimationSettingState('dynamic');
    }
  }, []);

  const setAnimationSetting = (setting: AnimationSetting) => {
    setAnimationSettingState(setting);
    localStorage.setItem('propit_animation_setting', setting);
  };

  return (
    <SettingsContext.Provider value={{ animationSetting, setAnimationSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
