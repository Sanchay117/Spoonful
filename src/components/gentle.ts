import { createContext, useContext } from 'react';

export const GentleContext = createContext(false);

export const useGentle = () => useContext(GentleContext);
