import { createContext, useState, useContext } from 'react';

const ViewModeContext = createContext();

export const ViewModeProvider = ({ children }) => {
    const [isListView, setIsListView] = useState(false);

    return (
        <ViewModeContext.Provider value={{ isListView, setIsListView }}>
            {children}
        </ViewModeContext.Provider>
    );
};

export const useViewMode = () => useContext(ViewModeContext);
