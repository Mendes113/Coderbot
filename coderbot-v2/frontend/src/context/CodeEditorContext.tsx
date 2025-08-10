import React, { createContext, useContext } from 'react';

export const CODE_SERVER_URL = '';

type Ctx = { editorVisible: boolean; setEditorVisible: (v: boolean) => void };
const Ctx = createContext<Ctx>({ editorVisible: false, setEditorVisible: () => {} });

export const CodeEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Ctx.Provider value={{ editorVisible: false, setEditorVisible: () => {} }}>{children}</Ctx.Provider>;
};

export const useCodeEditor = () => useContext(Ctx); 